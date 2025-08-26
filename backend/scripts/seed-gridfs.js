const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Week = require('../models/weekModel');

class GridFSSeeder {
  constructor() {
    this.gfs = null;
    this.bucket = null;
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      console.log('✅ Connected to MongoDB for GridFS seeding');
      
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

  async createSampleFiles() {
    console.log('📁 Creating sample files for GridFS...');
    
    // Create sample directories if they don't exist
    const sampleDir = path.join(__dirname, '../sample-files');
    const weekDirs = ['week1', 'week2', 'week3', 'week4', 'week5'];
    
    if (!fs.existsSync(sampleDir)) {
      fs.mkdirSync(sampleDir, { recursive: true });
    }

    for (const weekDir of weekDirs) {
      const weekPath = path.join(sampleDir, weekDir);
      if (!fs.existsSync(weekPath)) {
        fs.mkdirSync(weekPath, { recursive: true });
      }

      // Create sample image files (placeholder content)
      const imageFiles = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];
      for (const imageFile of imageFiles) {
        const imagePath = path.join(weekPath, imageFile);
        if (!fs.existsSync(imagePath)) {
          // Create a simple text file as placeholder for image
          const imageContent = `Sample image content for ${weekDir}/${imageFile}\nThis is a placeholder for actual image data.\nIn production, this would be actual image binary data.`;
          fs.writeFileSync(imagePath, imageContent);
        }
      }

      // Create sample PDF report
      const pdfPath = path.join(weekPath, 'report.pdf');
      if (!fs.existsSync(pdfPath)) {
        const pdfContent = `Sample PDF report for ${weekDir}\n\nThis is a placeholder for actual PDF content.\nIn production, this would be actual PDF binary data.\n\nWeek Summary:\n- Learning objectives covered\n- Activities completed\n- Student progress\n- Next week preview`;
        fs.writeFileSync(pdfPath, pdfContent);
      }
    }

    // Create career guidance file
    const careerPath = path.join(sampleDir, 'career-guidance.ppt');
    if (!fs.existsSync(careerPath)) {
      const careerContent = `Career Guidance Presentation\n\nThis is a placeholder for actual PowerPoint content.\nIn production, this would be actual PPT binary data.\n\nTopics Covered:\n- Career paths in Computer Science\n- Industry trends and opportunities\n- Resume building tips\n- Interview preparation\n- Professional networking`;
      fs.writeFileSync(careerPath, careerContent);
    }

    console.log('✅ Sample files created');
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

  async seedGridFSFiles() {
    console.log('📤 Uploading files to GridFS...');
    
    const sampleDir = path.join(__dirname, '../sample-files');
    const weekFileIds = {};

    // Upload files for each week
    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      const weekDir = path.join(sampleDir, `week${weekNum}`);
      weekFileIds[weekNum] = {
        photos: [],
        reportPdf: null
      };

      // Upload photos
      const photoFiles = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];
      for (const photoFile of photoFiles) {
        const photoPath = path.join(weekDir, photoFile);
        if (fs.existsSync(photoPath)) {
          const fileId = await this.uploadFileToGridFS(
            photoPath,
            `week${weekNum}-${photoFile}`,
            {
              weekNumber: weekNum,
              fileType: 'photo',
              originalName: photoFile
            }
          );
          weekFileIds[weekNum].photos.push(fileId.toString());
          console.log(`✅ Uploaded ${photoFile} for week ${weekNum}`);
        }
      }

      // Upload PDF report
      const reportPath = path.join(weekDir, 'report.pdf');
      if (fs.existsSync(reportPath)) {
        const fileId = await this.uploadFileToGridFS(
          reportPath,
          `week${weekNum}-report.pdf`,
          {
            weekNumber: weekNum,
            fileType: 'report',
            originalName: 'report.pdf'
          }
        );
        weekFileIds[weekNum].reportPdf = fileId.toString();
        console.log(`✅ Uploaded report.pdf for week ${weekNum}`);
      }
    }

    // Upload career guidance file
    const careerPath = path.join(sampleDir, 'career-guidance.ppt');
    if (fs.existsSync(careerPath)) {
      const careerFileId = await this.uploadFileToGridFS(
        careerPath,
        'career-guidance.ppt',
        {
          fileType: 'career-guidance',
          originalName: 'career-guidance.ppt'
        }
      );
      console.log('✅ Uploaded career-guidance.ppt');
    }

    return weekFileIds;
  }

  async updateWeekReferences(weekFileIds) {
    console.log('🔗 Updating week documents with GridFS references...');
    
    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      const week = await Week.findOne({ weekNumber: weekNum });
      if (week && weekFileIds[weekNum]) {
        week.photos = weekFileIds[weekNum].photos;
        week.reportPdf = weekFileIds[weekNum].reportPdf;
        await week.save();
        console.log(`✅ Updated week ${weekNum} with ${week.photos.length} photos and ${week.reportPdf ? 'PDF' : 'no PDF'}`);
      }
    }
  }

  async listGridFSFiles() {
    console.log('\n📋 GridFS Files Summary:');
    const files = await this.gfs.files.find({}).toArray();
    
    const filesByType = {
      photos: files.filter(f => f.metadata && f.metadata.fileType === 'photo'),
      reports: files.filter(f => f.metadata && f.metadata.fileType === 'report'),
      career: files.filter(f => f.metadata && f.metadata.fileType === 'career-guidance')
    };

    console.log(`   Photos: ${filesByType.photos.length}`);
    console.log(`   Reports: ${filesByType.reports.length}`);
    console.log(`   Career Guidance: ${filesByType.career.length}`);
    console.log(`   Total Files: ${files.length}`);

    return files;
  }

  async seed() {
    try {
      await this.connect();
      await this.clearGridFSFiles();
      await this.createSampleFiles();
      const weekFileIds = await this.seedGridFSFiles();
      await this.updateWeekReferences(weekFileIds);
      await this.listGridFSFiles();
      
      console.log('\n🎉 GridFS seeding completed successfully!');
      
    } catch (error) {
      console.error('❌ GridFS seeding failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  const seeder = new GridFSSeeder();
  seeder.seed().catch(console.error);
}

module.exports = GridFSSeeder;