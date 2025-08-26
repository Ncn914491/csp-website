const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
require('dotenv').config();

// Import models
const Week = require('../models/weekModel');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');

class DataMigrator {
  constructor() {
    this.gfs = null;
    this.bucket = null;
    this.migrations = [];
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      console.log('✅ Connected to MongoDB for data migration');
      
      // Initialize GridFS
      const conn = mongoose.connection;
      this.gfs = Grid(conn.db, mongoose.mongo);
      this.gfs.collection("uploads");
      
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

  // Migration 1: Add missing fields to existing weeks
  async migration_001_addWeekFields() {
    const migrationName = 'migration_001_addWeekFields';
    console.log(`🔄 Running ${migrationName}...`);
    
    try {
      const weeks = await Week.find({});
      let updatedCount = 0;
      
      for (const week of weeks) {
        let needsUpdate = false;
        
        // Ensure photos array exists
        if (!week.photos) {
          week.photos = [];
          needsUpdate = true;
        }
        
        // Ensure videos array exists
        if (!week.videos) {
          week.videos = [];
          needsUpdate = true;
        }
        
        // Ensure reportPdf field exists
        if (week.reportPdf === undefined) {
          week.reportPdf = null;
          needsUpdate = true;
        }
        
        // Add default summary if missing
        if (!week.summary || week.summary.trim() === '') {
          week.summary = `Week ${week.weekNumber} activities and learning objectives.`;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await week.save();
          updatedCount++;
        }
      }
      
      console.log(`✅ ${migrationName} completed: Updated ${updatedCount} weeks`);
      this.migrations.push({ name: migrationName, status: 'completed', updatedRecords: updatedCount });
      
    } catch (error) {
      console.error(`❌ ${migrationName} failed:`, error.message);
      this.migrations.push({ name: migrationName, status: 'failed', error: error.message });
    }
  }

  // Migration 2: Ensure all users have proper role field
  async migration_002_ensureUserRoles() {
    const migrationName = 'migration_002_ensureUserRoles';
    console.log(`🔄 Running ${migrationName}...`);
    
    try {
      const users = await User.find({});
      let updatedCount = 0;
      
      for (const user of users) {
        let needsUpdate = false;
        
        // Ensure role field exists and is valid
        if (!user.role || !['admin', 'student'].includes(user.role)) {
          // Default to student unless email suggests admin
          user.role = user.email.includes('admin') ? 'admin' : 'student';
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await user.save();
          updatedCount++;
        }
      }
      
      console.log(`✅ ${migrationName} completed: Updated ${updatedCount} users`);
      this.migrations.push({ name: migrationName, status: 'completed', updatedRecords: updatedCount });
      
    } catch (error) {
      console.error(`❌ ${migrationName} failed:`, error.message);
      this.migrations.push({ name: migrationName, status: 'failed', error: error.message });
    }
  }

  // Migration 3: Clean up invalid GridFS references
  async migration_003_cleanupInvalidReferences() {
    const migrationName = 'migration_003_cleanupInvalidReferences';
    console.log(`🔄 Running ${migrationName}...`);
    
    try {
      const weeks = await Week.find({});
      let updatedCount = 0;
      
      for (const week of weeks) {
        let needsUpdate = false;
        
        // Validate photo references
        const validPhotos = [];
        for (const photoId of week.photos || []) {
          try {
            const file = await this.gfs.files.findOne({ _id: new mongoose.Types.ObjectId(photoId) });
            if (file) {
              validPhotos.push(photoId);
            } else {
              console.log(`   Removing invalid photo reference: ${photoId} from week ${week.weekNumber}`);
              needsUpdate = true;
            }
          } catch (error) {
            console.log(`   Removing malformed photo ID: ${photoId} from week ${week.weekNumber}`);
            needsUpdate = true;
          }
        }
        
        if (validPhotos.length !== (week.photos || []).length) {
          week.photos = validPhotos;
          needsUpdate = true;
        }
        
        // Validate PDF reference
        if (week.reportPdf) {
          try {
            const file = await this.gfs.files.findOne({ _id: new mongoose.Types.ObjectId(week.reportPdf) });
            if (!file) {
              console.log(`   Removing invalid PDF reference: ${week.reportPdf} from week ${week.weekNumber}`);
              week.reportPdf = null;
              needsUpdate = true;
            }
          } catch (error) {
            console.log(`   Removing malformed PDF ID: ${week.reportPdf} from week ${week.weekNumber}`);
            week.reportPdf = null;
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          await week.save();
          updatedCount++;
        }
      }
      
      console.log(`✅ ${migrationName} completed: Updated ${updatedCount} weeks`);
      this.migrations.push({ name: migrationName, status: 'completed', updatedRecords: updatedCount });
      
    } catch (error) {
      console.error(`❌ ${migrationName} failed:`, error.message);
      this.migrations.push({ name: migrationName, status: 'failed', error: error.message });
    }
  }

  // Migration 4: Add metadata to GridFS files that are missing it
  async migration_004_addGridFSMetadata() {
    const migrationName = 'migration_004_addGridFSMetadata';
    console.log(`🔄 Running ${migrationName}...`);
    
    try {
      const files = await this.gfs.files.find({}).toArray();
      let updatedCount = 0;
      
      for (const file of files) {
        if (!file.metadata || Object.keys(file.metadata).length === 0) {
          let metadata = {};
          
          // Determine file type from filename
          if (file.filename.includes('photo') || file.filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
            metadata.fileType = 'photo';
          } else if (file.filename.includes('report') || file.filename.match(/\.pdf$/i)) {
            metadata.fileType = 'report';
          } else if (file.filename.includes('career') || file.filename.match(/\.(ppt|pptx)$/i)) {
            metadata.fileType = 'career-guidance';
          }
          
          // Extract week number from filename
          const weekMatch = file.filename.match(/week(\d+)/i);
          if (weekMatch) {
            metadata.weekNumber = parseInt(weekMatch[1]);
          }
          
          metadata.originalName = file.filename;
          
          // Update file metadata
          await this.gfs.files.updateOne(
            { _id: file._id },
            { $set: { metadata: metadata } }
          );
          
          updatedCount++;
          console.log(`   Added metadata to file: ${file.filename}`);
        }
      }
      
      console.log(`✅ ${migrationName} completed: Updated ${updatedCount} files`);
      this.migrations.push({ name: migrationName, status: 'completed', updatedRecords: updatedCount });
      
    } catch (error) {
      console.error(`❌ ${migrationName} failed:`, error.message);
      this.migrations.push({ name: migrationName, status: 'failed', error: error.message });
    }
  }

  // Migration 5: Ensure group descriptions exist
  async migration_005_ensureGroupDescriptions() {
    const migrationName = 'migration_005_ensureGroupDescriptions';
    console.log(`🔄 Running ${migrationName}...`);
    
    try {
      const groups = await Group.find({});
      let updatedCount = 0;
      
      const defaultDescriptions = {
        'Web Development Enthusiasts': 'A group for students passionate about web development, sharing resources and discussing latest trends.',
        'Data Science Explorers': 'Explore the world of data science, machine learning, and analytics.',
        'Mobile App Developers': 'Connect with fellow mobile app developers working on various platforms.',
        'Cybersecurity Warriors': 'Discuss cybersecurity trends, ethical hacking, and information security.',
        'AI & Machine Learning': 'Dive deep into artificial intelligence and machine learning algorithms.',
        'Career Guidance Hub': 'Share career advice, interview experiences, and professional development tips.'
      };
      
      for (const group of groups) {
        if (!group.description || group.description.trim() === '') {
          group.description = defaultDescriptions[group.name] || `Discussion group for ${group.name} members.`;
          await group.save();
          updatedCount++;
        }
      }
      
      console.log(`✅ ${migrationName} completed: Updated ${updatedCount} groups`);
      this.migrations.push({ name: migrationName, status: 'completed', updatedRecords: updatedCount });
      
    } catch (error) {
      console.error(`❌ ${migrationName} failed:`, error.message);
      this.migrations.push({ name: migrationName, status: 'failed', error: error.message });
    }
  }

  async runAllMigrations() {
    console.log('🚀 Starting data migrations...\n');
    
    await this.migration_001_addWeekFields();
    await this.migration_002_ensureUserRoles();
    await this.migration_003_cleanupInvalidReferences();
    await this.migration_004_addGridFSMetadata();
    await this.migration_005_ensureGroupDescriptions();
    
    console.log('\n📊 Migration Summary:');
    console.log('=' .repeat(50));
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const migration of this.migrations) {
      const status = migration.status === 'completed' ? '✅' : '❌';
      console.log(`${status} ${migration.name}: ${migration.status}`);
      
      if (migration.status === 'completed') {
        successCount++;
        if (migration.updatedRecords > 0) {
          console.log(`   Updated ${migration.updatedRecords} records`);
        }
      } else {
        failureCount++;
        console.log(`   Error: ${migration.error}`);
      }
    }
    
    console.log(`\n📈 Results: ${successCount} successful, ${failureCount} failed`);
    
    if (failureCount === 0) {
      console.log('🎉 All migrations completed successfully!');
    } else {
      console.log('⚠️  Some migrations failed. Please review the errors above.');
    }
  }

  async migrate() {
    try {
      await this.connect();
      await this.runAllMigrations();
    } catch (error) {
      console.error('❌ Migration process failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const migrator = new DataMigrator();
  migrator.migrate().catch(console.error);
}

module.exports = DataMigrator;