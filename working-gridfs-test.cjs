const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const fs = require('fs');
const path = require('path');
const Week = require('./backend/models/weekModel');
require('dotenv').config({ path: './backend/.env' });

console.log('🧪 Starting working GridFS test with native MongoDB...');

const testGridFS = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected');

    // Initialize GridFS using native MongoDB
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log('✅ GridFS bucket initialized');

    // Check if we have test files
    const testImagePath = path.join(__dirname, 'csp', 'week1', 'image1.jpg');
    const testPdfPath = path.join(__dirname, 'csp', 'week1', 'report.pdf');

    if (!fs.existsSync(testImagePath)) {
      console.log('❌ Test image not found at:', testImagePath);
      process.exit(1);
    }

    if (!fs.existsSync(testPdfPath)) {
      console.log('❌ Test PDF not found at:', testPdfPath);
      process.exit(1);
    }

    console.log('📁 Test files found');

    // Upload image directly using native GridFS
    console.log('📤 Uploading test image...');
    const imageStream = fs.createReadStream(testImagePath);
    const imageUploadStream = bucket.openUploadStream('test-image.jpg', {
      contentType: 'image/jpeg'
    });

    const imageId = await new Promise((resolve, reject) => {
      imageStream.pipe(imageUploadStream)
        .on('error', reject)
        .on('finish', () => {
          console.log('✅ Image uploaded with ID:', imageUploadStream.id);
          resolve(imageUploadStream.id);
        });
    });

    // Upload PDF
    console.log('📤 Uploading test PDF...');
    const pdfStream = fs.createReadStream(testPdfPath);
    const pdfUploadStream = bucket.openUploadStream('test-report.pdf', {
      contentType: 'application/pdf'
    });

    const pdfId = await new Promise((resolve, reject) => {
      pdfStream.pipe(pdfUploadStream)
        .on('error', reject)
        .on('finish', () => {
          console.log('✅ PDF uploaded with ID:', pdfUploadStream.id);
          resolve(pdfUploadStream.id);
        });
    });

    // Create a test week document
    const testWeek = new Week({
      weekNumber: 999,
      summary: 'Test week for GridFS verification',
      photos: [imageId.toString()],
      reportPdf: pdfId.toString()
    });

    await testWeek.save();
    console.log('✅ Test week created:', testWeek._id);

    // Verify file retrieval
    console.log('🔍 Verifying file retrieval...');
    const files = await db.collection('uploads.files').find({}).toArray();
    const chunks = await db.collection('uploads.chunks').find({}).toArray();

    console.log(`📸 Found ${files.length} files in GridFS`);
    console.log(`🧩 Found ${chunks.length} chunks in GridFS`);

    files.forEach(file => {
      console.log(`   File: ${file.filename} (${file.contentType}, ${file.length} bytes)`);
    });

    // Test file download
    console.log('📥 Testing file download...');
    const downloadStream = bucket.openDownloadStream(imageId);
    let downloadedData = Buffer.alloc(0);
    
    await new Promise((resolve, reject) => {
      downloadStream
        .on('data', (chunk) => {
          downloadedData = Buffer.concat([downloadedData, chunk]);
        })
        .on('end', () => {
          console.log('✅ Downloaded image data:', downloadedData.length, 'bytes');
          resolve();
        })
        .on('error', reject);
    });

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));

    console.log('🎉 All tests passed! GridFS is working correctly with native MongoDB API.');
    
    // Cleanup test data
    await Week.findByIdAndDelete(testWeek._id);
    await bucket.delete(imageId);
    await bucket.delete(pdfId);
    
    console.log('🧹 Test data cleaned up');
    
    console.log('\n✨ Migration Instructions:');
    console.log('1. Update server to use native MongoDB GridFS instead of gridfs-stream');
    console.log('2. Use GridFSBucket for file operations');
    console.log('3. Run migration script to upload all CSP files');

    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

testGridFS();
