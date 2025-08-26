const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Week = require('../models/weekModel');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');

class DataIntegrityVerifier {
  constructor() {
    this.gfs = null;
    this.bucket = null;
    this.issues = [];
    this.stats = {
      totalFiles: 0,
      validFiles: 0,
      invalidFiles: 0,
      orphanedFiles: 0,
      missingReferences: 0,
      validWeeks: 0,
      invalidWeeks: 0
    };
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      console.log('✅ Connected to MongoDB for data integrity verification');
      
      // Initialize GridFS
      const conn = mongoose.connection;
      this.gfs = Grid(conn.db, mongoose.mongo);
      this.gfs.collection("uploads");
      
      // Initialize GridFS bucket
      this.bucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
      });
      
      console.log('✅ GridFS initialized');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }

  logIssue(type, message, details = {}) {
    this.issues.push({
      type,
      message,
      details,
      timestamp: new Date()
    });
    console.log(`⚠️  ${type}: ${message}`);
  }

  async verifyGridFSFiles() {
    console.log('🔍 Verifying GridFS files...');
    
    try {
      const files = await this.gfs.files.find({}).toArray();
      this.stats.totalFiles = files.length;
      
      for (const file of files) {
        try {
          // Check if file chunks exist
          const chunks = await this.gfs.chunks.find({ files_id: file._id }).toArray();
          
          if (chunks.length === 0) {
            this.logIssue('MISSING_CHUNKS', `File ${file.filename} has no chunks`, {
              fileId: file._id,
              filename: file.filename
            });
            this.stats.invalidFiles++;
          } else {
            // Verify file size matches chunk data
            const totalChunkSize = chunks.reduce((sum, chunk) => sum + chunk.data.length(), 0);
            
            if (Math.abs(totalChunkSize - file.length) > 1) { // Allow 1 byte difference for padding
              this.logIssue('SIZE_MISMATCH', `File ${file.filename} size mismatch`, {
                fileId: file._id,
                filename: file.filename,
                expectedSize: file.length,
                actualSize: totalChunkSize
              });
              this.stats.invalidFiles++;
            } else {
              this.stats.validFiles++;
            }
          }
          
          // Check metadata integrity
          if (!file.metadata) {
            this.logIssue('MISSING_METADATA', `File ${file.filename} has no metadata`, {
              fileId: file._id,
              filename: file.filename
            });
          }
          
        } catch (error) {
          this.logIssue('FILE_ACCESS_ERROR', `Cannot access file ${file.filename}`, {
            fileId: file._id,
            filename: file.filename,
            error: error.message
          });
          this.stats.invalidFiles++;
        }
      }
      
      console.log(`✅ GridFS verification complete: ${this.stats.validFiles}/${this.stats.totalFiles} files valid`);
      
    } catch (error) {
      this.logIssue('GRIDFS_ERROR', 'Failed to access GridFS files', { error: error.message });
    }
  }

  async verifyWeekReferences() {
    console.log('🔍 Verifying week-to-file references...');
    
    try {
      const weeks = await Week.find({});
      
      for (const week of weeks) {
        let weekValid = true;
        
        // Verify photo references
        for (const photoId of week.photos || []) {
          try {
            const file = await this.gfs.files.findOne({ _id: new mongoose.Types.ObjectId(photoId) });
            if (!file) {
              this.logIssue('MISSING_PHOTO_FILE', `Week ${week.weekNumber} references missing photo`, {
                weekId: week._id,
                weekNumber: week.weekNumber,
                photoId: photoId
              });
              weekValid = false;
            }
          } catch (error) {
            this.logIssue('INVALID_PHOTO_ID', `Week ${week.weekNumber} has invalid photo ID`, {
              weekId: week._id,
              weekNumber: week.weekNumber,
              photoId: photoId,
              error: error.message
            });
            weekValid = false;
          }
        }
        
        // Verify PDF reference
        if (week.reportPdf) {
          try {
            const file = await this.gfs.files.findOne({ _id: new mongoose.Types.ObjectId(week.reportPdf) });
            if (!file) {
              this.logIssue('MISSING_PDF_FILE', `Week ${week.weekNumber} references missing PDF`, {
                weekId: week._id,
                weekNumber: week.weekNumber,
                pdfId: week.reportPdf
              });
              weekValid = false;
            }
          } catch (error) {
            this.logIssue('INVALID_PDF_ID', `Week ${week.weekNumber} has invalid PDF ID`, {
              weekId: week._id,
              weekNumber: week.weekNumber,
              pdfId: week.reportPdf,
              error: error.message
            });
            weekValid = false;
          }
        }
        
        if (weekValid) {
          this.stats.validWeeks++;
        } else {
          this.stats.invalidWeeks++;
        }
      }
      
      console.log(`✅ Week reference verification complete: ${this.stats.validWeeks}/${weeks.length} weeks valid`);
      
    } catch (error) {
      this.logIssue('WEEK_VERIFICATION_ERROR', 'Failed to verify week references', { error: error.message });
    }
  }

  async findOrphanedFiles() {
    console.log('🔍 Finding orphaned GridFS files...');
    
    try {
      const files = await this.gfs.files.find({}).toArray();
      const weeks = await Week.find({});
      
      // Collect all referenced file IDs
      const referencedIds = new Set();
      
      for (const week of weeks) {
        // Add photo IDs
        for (const photoId of week.photos || []) {
          referencedIds.add(photoId);
        }
        
        // Add PDF ID
        if (week.reportPdf) {
          referencedIds.add(week.reportPdf);
        }
      }
      
      // Find orphaned files
      for (const file of files) {
        const fileIdStr = file._id.toString();
        if (!referencedIds.has(fileIdStr)) {
          // Check if it's a career guidance file (not orphaned)
          if (file.metadata && file.metadata.fileType === 'career-guidance') {
            continue; // Career guidance files are not referenced by weeks
          }
          
          this.logIssue('ORPHANED_FILE', `File ${file.filename} is not referenced by any week`, {
            fileId: file._id,
            filename: file.filename,
            uploadDate: file.uploadDate,
            size: file.length
          });
          this.stats.orphanedFiles++;
        }
      }
      
      console.log(`✅ Orphaned file check complete: ${this.stats.orphanedFiles} orphaned files found`);
      
    } catch (error) {
      this.logIssue('ORPHAN_CHECK_ERROR', 'Failed to check for orphaned files', { error: error.message });
    }
  }

  async verifyUserGroupReferences() {
    console.log('🔍 Verifying user-group references...');
    
    try {
      const groups = await Group.find({}).populate('members');
      const users = await User.find({});
      const userIds = new Set(users.map(u => u._id.toString()));
      
      for (const group of groups) {
        for (const memberId of group.members) {
          const memberIdStr = memberId.toString();
          if (!userIds.has(memberIdStr)) {
            this.logIssue('INVALID_GROUP_MEMBER', `Group ${group.name} references non-existent user`, {
              groupId: group._id,
              groupName: group.name,
              invalidMemberId: memberIdStr
            });
          }
        }
      }
      
      // Verify message references
      const messages = await Message.find({});
      const groupIds = new Set(groups.map(g => g._id.toString()));
      
      for (const message of messages) {
        const groupIdStr = message.groupId.toString();
        const userIdStr = message.userId.toString();
        
        if (!groupIds.has(groupIdStr)) {
          this.logIssue('INVALID_MESSAGE_GROUP', `Message references non-existent group`, {
            messageId: message._id,
            invalidGroupId: groupIdStr
          });
        }
        
        if (!userIds.has(userIdStr)) {
          this.logIssue('INVALID_MESSAGE_USER', `Message references non-existent user`, {
            messageId: message._id,
            invalidUserId: userIdStr
          });
        }
      }
      
      console.log('✅ User-group reference verification complete');
      
    } catch (error) {
      this.logIssue('REFERENCE_VERIFICATION_ERROR', 'Failed to verify user-group references', { error: error.message });
    }
  }

  async generateReport() {
    console.log('\n📊 Data Integrity Report');
    console.log('=' .repeat(50));
    
    console.log('\n📈 Statistics:');
    console.log(`   Total GridFS Files: ${this.stats.totalFiles}`);
    console.log(`   Valid Files: ${this.stats.validFiles}`);
    console.log(`   Invalid Files: ${this.stats.invalidFiles}`);
    console.log(`   Orphaned Files: ${this.stats.orphanedFiles}`);
    console.log(`   Valid Weeks: ${this.stats.validWeeks}`);
    console.log(`   Invalid Weeks: ${this.stats.invalidWeeks}`);
    
    console.log(`\n🔍 Issues Found: ${this.issues.length}`);
    
    if (this.issues.length > 0) {
      console.log('\n⚠️  Detailed Issues:');
      
      const issuesByType = {};
      for (const issue of this.issues) {
        if (!issuesByType[issue.type]) {
          issuesByType[issue.type] = [];
        }
        issuesByType[issue.type].push(issue);
      }
      
      for (const [type, issues] of Object.entries(issuesByType)) {
        console.log(`\n   ${type} (${issues.length} issues):`);
        for (const issue of issues.slice(0, 5)) { // Show first 5 issues of each type
          console.log(`     - ${issue.message}`);
          if (issue.details.filename) {
            console.log(`       File: ${issue.details.filename}`);
          }
          if (issue.details.weekNumber) {
            console.log(`       Week: ${issue.details.weekNumber}`);
          }
        }
        if (issues.length > 5) {
          console.log(`     ... and ${issues.length - 5} more`);
        }
      }
    }
    
    // Calculate overall health score
    const totalChecks = this.stats.totalFiles + this.stats.validWeeks + this.stats.invalidWeeks;
    const validChecks = this.stats.validFiles + this.stats.validWeeks;
    const healthScore = totalChecks > 0 ? Math.round((validChecks / totalChecks) * 100) : 0;
    
    console.log(`\n🏥 Overall Health Score: ${healthScore}%`);
    
    if (healthScore >= 95) {
      console.log('✅ Database integrity is excellent!');
    } else if (healthScore >= 80) {
      console.log('⚠️  Database integrity is good but has some issues');
    } else {
      console.log('❌ Database integrity needs attention');
    }
    
    // Save detailed report to file
    const reportPath = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }
    
    const reportFile = path.join(reportPath, `integrity-report-${Date.now()}.json`);
    const reportData = {
      timestamp: new Date(),
      stats: this.stats,
      issues: this.issues,
      healthScore: healthScore
    };
    
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);
    
    return { healthScore, issues: this.issues, stats: this.stats };
  }

  async verify() {
    try {
      await this.connect();
      
      console.log('🔍 Starting comprehensive data integrity verification...\n');
      
      await this.verifyGridFSFiles();
      await this.verifyWeekReferences();
      await this.findOrphanedFiles();
      await this.verifyUserGroupReferences();
      
      const report = await this.generateReport();
      
      console.log('\n🎉 Data integrity verification completed!');
      
      return report;
      
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  const verifier = new DataIntegrityVerifier();
  verifier.verify().catch(console.error);
}

module.exports = DataIntegrityVerifier;