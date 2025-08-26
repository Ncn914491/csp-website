const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const fs = require('fs');
const path = require('path');
const Week = require('./backend/models/weekModel');
require('dotenv').config({ path: './backend/.env' });

async function uploadCareerGuidance() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
    if (!mongoUri) {
      throw new Error('Missing MONGO_URI/MONGO_URL');
    }
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');

    const db = mongoose.connection.db;
    const gridfsBucket = new GridFSBucket(db, { bucketName: 'uploads' });

    // Check if career guidance already exists (week 0)
    const existingCareer = await Week.findOne({ weekNumber: 0 });
    if (existingCareer) {
      console.log('Career guidance already exists, deleting old version...');
      
      // Delete old files from GridFS
      if (existingCareer.reportPdf) {
        try {
          await gridfsBucket.delete(new mongoose.Types.ObjectId(existingCareer.reportPdf));
          console.log('✅ Deleted old career guidance file');
        } catch (err) {
          console.log('⚠️ Could not delete old file:', err.message);
        }
      }
      
      // Delete the document
      await Week.deleteOne({ weekNumber: 0 });
      console.log('✅ Deleted old career guidance document');
    }

    // Upload new csp.pptx file
    const filePath = path.join(__dirname, 'public/csp/csp.pptx');
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log('📤 Uploading csp.pptx to GridFS...');
    
    const uploadStream = gridfsBucket.openUploadStream('csp.pptx', {
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });

    const fileStream = fs.createReadStream(filePath);
    
    const uploadPromise = new Promise((resolve, reject) => {
      uploadStream.on('finish', () => {
        console.log('✅ File uploaded successfully');
        resolve(uploadStream.id);
      });
      
      uploadStream.on('error', (error) => {
        console.error('❌ Upload failed:', error);
        reject(error);
      });
    });

    fileStream.pipe(uploadStream);
    const fileId = await uploadPromise;

    // Create career guidance document (week 0)
    const careerGuidance = new Week({
      weekNumber: 0,
      summary: 'Career Guidance Resources - Comprehensive PowerPoint presentation with career paths, opportunities, and guidance for students.',
      photos: [], // No photos for career guidance
      reportPdf: fileId.toString()
    });

    await careerGuidance.save();
    console.log('✅ Career guidance document created successfully');
    console.log('📋 Career guidance ID:', careerGuidance._id);
    console.log('📋 File ID:', fileId.toString());

    await mongoose.disconnect();
    console.log('✅ Upload completed successfully!');
    
  } catch (error) {
    console.error('❌ Error uploading career guidance:', error);
    process.exit(1);
  }
}

uploadCareerGuidance();