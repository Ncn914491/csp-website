const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Week = require('../models/weekModel');

class RealFilesSeeder {
  constructor() {
    this.gfs = null;
    this.bucket = null;
    this.cspDir = path.join(__dirname, '../../public/csp');
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      console.log('✅ Connected to MongoDB for real files seeding');
      
      // Initialize GridFS
      const conn = mongoose.connection;
      this.gfs = Grid(conn.db, mongoose.mongo);
      this.gfs.collection("uploads");
      
      // Initialize GridFS bucket for file operations
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

  async clearGridFSFiles() {
    console.log('🧹 Clearing existing GridFS files...');
    try {
      const files = await this.gfs.files.find({}).toArray();
      for (const file of files) {
        await this.bucket.delete(file._id);
      }
      console.log(`✅ Cleared ${files.length} existing GridFS files`);
    } catch (error) {
      console.log('ℹ️ No existing GridFS files to clear');
    }
  }

  async uploadFileToGridFS(filePath, filename, metadata = {}) {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath);
      const uploadStream = this.bucket.openUploadStream(filename, {
        metadata: metadata
      });

      readStream.pipe(uploadStream);

      uploadStream.on('error', reject);
      uploadStream.on('finish', () => {
        resolve(uploadStream.id);
      });
    });
  }

  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      return 'photo';
    } else if (ext === '.pdf') {
      return 'report';
    } else if (['.mp4', '.avi', '.mov'].includes(ext)) {
      return 'video';
    } else if (['.ppt', '.pptx'].includes(ext)) {
      return 'presentation';
    }
    return 'document';
  }

  async uploadWeekFiles() {
    console.log('📤 Uploading all real files from public/csp to GridFS...');
    
    const weekFileIds = {};

    // Process each week directory
    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      const weekDir = path.join(this.cspDir, `week${weekNum}`);
      
      if (!fs.existsSync(weekDir)) {
        console.log(`⚠️ Week ${weekNum} directory not found, skipping...`);
        continue;
      }

      weekFileIds[weekNum] = {
        photos: [],
        videos: [],
        reportPdf: null
      };

      console.log(`\n📁 Processing Week ${weekNum}...`);
      
      const files = fs.readdirSync(weekDir);
      
      for (const file of files) {
        const filePath = path.join(weekDir, file);
        const fileType = this.getFileType(file);
        
        try {
          const fileId = await this.uploadFileToGridFS(
            filePath,
            `week${weekNum}-${file}`,
            {
              weekNumber: weekNum,
              fileType: fileType,
              originalName: file
            }
          );

          if (fileType === 'photo') {
            weekFileIds[weekNum].photos.push(fileId.toString());
            console.log(`✅ Uploaded photo: ${file}`);
          } else if (fileType === 'video') {
            weekFileIds[weekNum].videos.push(fileId.toString());
            console.log(`✅ Uploaded video: ${file}`);
          } else if (fileType === 'report') {
            weekFileIds[weekNum].reportPdf = fileId.toString();
            console.log(`✅ Uploaded PDF: ${file}`);
          } else {
            console.log(`✅ Uploaded ${fileType}: ${file}`);
          }
          
        } catch (error) {
          console.error(`❌ Failed to upload ${file}:`, error.message);
        }
      }

      console.log(`📊 Week ${weekNum} summary: ${weekFileIds[weekNum].photos.length} photos, ${weekFileIds[weekNum].videos.length} videos, ${weekFileIds[weekNum].reportPdf ? '1 PDF' : 'no PDF'}`);
    }

    return weekFileIds;
  }

  async uploadCareerGuidanceFiles() {
    console.log('\n📤 Uploading career guidance files...');
    
    const careerFiles = ['csp.pptx', 'synergyschool.jpg', 'synergyschoolphoto.jpg'];
    const uploadedFiles = [];

    for (const file of careerFiles) {
      const filePath = path.join(this.cspDir, file);
      
      if (fs.existsSync(filePath)) {
        try {
          const fileType = this.getFileType(file);
          const fileId = await this.uploadFileToGridFS(
            filePath,
            `career-${file}`,
            {
              fileType: 'career-guidance',
              originalName: file,
              category: fileType === 'photo' ? 'school-photo' : 'presentation'
            }
          );
          
          uploadedFiles.push({
            id: fileId.toString(),
            filename: file,
            type: fileType
          });
          
          console.log(`✅ Uploaded career file: ${file}`);
          
        } catch (error) {
          console.error(`❌ Failed to upload career file ${file}:`, error.message);
        }
      } else {
        console.log(`⚠️ Career file not found: ${file}`);
      }
    }

    return uploadedFiles;
  }

  async updateWeekReferences(weekFileIds) {
    console.log('\n🔗 Updating week documents with GridFS references...');
    
    // Enhanced week summaries based on actual content
    const weekSummaries = {
      1: 'Introduction to Computer Science Program - Campus tour, faculty introductions, and programming fundamentals. Students explored the development environment and learned about basic programming concepts. Interactive sessions included hands-on coding exercises and group discussions about career opportunities in technology.',
      2: 'Programming Fundamentals Deep Dive - Comprehensive coverage of variables, data types, control structures, and basic algorithms. Students implemented their first programs and learned debugging techniques. The week included practical exercises in Python programming and introduction to problem-solving methodologies.',
      3: 'Data Structures and Algorithms - Introduction to arrays, linked lists, stacks, queues, and basic sorting algorithms. Students learned about time complexity analysis and implemented various data structures. Hands-on sessions focused on algorithm design and optimization techniques.',
      4: 'Web Development Foundations - HTML, CSS, and JavaScript fundamentals with responsive design principles. Students created their first web pages and learned about modern web development practices. The curriculum covered DOM manipulation, event handling, and basic web application architecture.',
      5: 'Database Management and Capstone Projects - Introduction to databases, SQL queries, and database design principles. Students worked on integrating all learned concepts into comprehensive capstone projects. The week concluded with project presentations and peer reviews.'
    };

    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      try {
        let week = await Week.findOne({ weekNumber: weekNum });
        
        if (!week) {
          // Create new week if it doesn't exist
          week = new Week({
            weekNumber: weekNum,
            summary: weekSummaries[weekNum] || `Week ${weekNum} activities and learning objectives.`,
            photos: [],
            videos: [],
            reportPdf: null
          });
        }

        // Update with actual file references
        if (weekFileIds[weekNum]) {
          week.photos = weekFileIds[weekNum].photos;
          week.videos = weekFileIds[weekNum].videos;
          week.reportPdf = weekFileIds[weekNum].reportPdf;
          
          // Update summary with enhanced content
          week.summary = weekSummaries[weekNum] || week.summary;
        }

        await week.save();
        
        const photoCount = week.photos ? week.photos.length : 0;
        const videoCount = week.videos ? week.videos.length : 0;
        const hasPdf = week.reportPdf ? 'PDF' : 'no PDF';
        
        console.log(`✅ Updated week ${weekNum}: ${photoCount} photos, ${videoCount} videos, ${hasPdf}`);
        
      } catch (error) {
        console.error(`❌ Failed to update week ${weekNum}:`, error.message);
      }
    }
  }

  async generateFileSummary() {
    console.log('\n📋 GridFS Files Summary:');
    console.log('=' .repeat(60));
    
    const files = await this.gfs.files.find({}).toArray();
    
    const filesByType = {
      photos: files.filter(f => f.metadata && f.metadata.fileType === 'photo'),
      videos: files.filter(f => f.metadata && f.metadata.fileType === 'video'),
      reports: files.filter(f => f.metadata && f.metadata.fileType === 'report'),
      career: files.filter(f => f.metadata && f.metadata.fileType === 'career-guidance'),
      other: files.filter(f => !f.metadata || !['photo', 'video', 'report', 'career-guidance'].includes(f.metadata.fileType))
    };

    console.log(`📸 Photos: ${filesByType.photos.length}`);
    console.log(`🎥 Videos: ${filesByType.videos.length}`);
    console.log(`📄 PDF Reports: ${filesByType.reports.length}`);
    console.log(`💼 Career Guidance: ${filesByType.career.length}`);
    console.log(`📁 Other Files: ${filesByType.other.length}`);
    console.log(`📊 Total Files: ${files.length}`);

    // Show breakdown by week
    console.log('\n📅 Files by Week:');
    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      const weekFiles = files.filter(f => f.metadata && f.metadata.weekNumber === weekNum);
      const photos = weekFiles.filter(f => f.metadata.fileType === 'photo').length;
      const videos = weekFiles.filter(f => f.metadata.fileType === 'video').length;
      const pdfs = weekFiles.filter(f => f.metadata.fileType === 'report').length;
      
      console.log(`   Week ${weekNum}: ${photos} photos, ${videos} videos, ${pdfs} PDFs`);
    }

    return files;
  }

  async seed() {
    try {
      await this.connect();
      
      // Check if CSP directory exists
      if (!fs.existsSync(this.cspDir)) {
        throw new Error(`CSP directory not found: ${this.cspDir}`);
      }

      await this.clearGridFSFiles();
      
      console.log('🚀 Starting real files upload from public/csp directory...\n');
      
      const weekFileIds = await this.uploadWeekFiles();
      const careerFiles = await this.uploadCareerGuidanceFiles();
      
      await this.updateWeekReferences(weekFileIds);
      await this.generateFileSummary();
      
      console.log('\n🎉 Real files seeding completed successfully!');
      console.log('\n📋 What was uploaded:');
      console.log('   ✅ All photos from week1-week5 directories');
      console.log('   ✅ All videos from week directories');
      console.log('   ✅ All PDF reports from week directories');
      console.log('   ✅ Career guidance presentation and photos');
      console.log('   ✅ Week documents updated with file references');
      
      console.log('\n🌐 Next Steps:');
      console.log('   1. Start your backend server: npm run dev');
      console.log('   2. Test GridFS endpoints: http://localhost:5000/api/gridfs-weeks');
      console.log('   3. View individual files: http://localhost:5000/api/gridfs-weeks/file/[file-id]');
      console.log('   4. Test the frontend to see all real photos and documents');
      
    } catch (error) {
      console.error('❌ Real files seeding failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  const seeder = new RealFilesSeeder();
  seeder.seed().catch(console.error);
}

module.exports = RealFilesSeeder;