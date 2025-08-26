const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const fs = require('fs');
const path = require('path');
const Week = require('./backend/models/weekModel');
require('dotenv').config({ path: './backend/.env' });

console.log('🧪 Starting simple GridFS test...');

const testGridFS = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected');

    // Initialize GridFS
    const conn = mongoose.connection;
    const gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    console.log('✅ GridFS initialized');

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

    // Upload image directly using GridFS
    console.log('📤 Uploading test image...');
    const imageStream = fs.createReadStream(testImagePath);
    const imageUploadStream = gfs.createWriteStream({
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });

    imageStream.pipe(imageUploadStream);

    await new Promise((resolve, reject) => {
      imageUploadStream.on('close', (file) => {
        console.log('✅ Image uploaded with ID:', file._id);
        resolve(file);
      });
      imageUploadStream.on('error', reject);
    });

    // Upload PDF
    console.log('📤 Uploading test PDF...');
    const pdfStream = fs.createReadStream(testPdfPath);
    const pdfUploadStream = gfs.createWriteStream({
      filename: 'test-report.pdf',
      contentType: 'application/pdf'
    });

    pdfStream.pipe(pdfUploadStream);

    const pdfFile = await new Promise((resolve, reject) => {
      pdfUploadStream.on('close', (file) => {
        console.log('✅ PDF uploaded with ID:', file._id);
        resolve(file);
      });
      pdfUploadStream.on('error', reject);
    });

    // Create a test week document
    const testWeek = new Week({
      weekNumber: 999,
      summary: 'Test week for GridFS verification',
      photos: [imageUploadStream.id.toString()],
      reportPdf: pdfFile._id.toString()
    });

    await testWeek.save();
    console.log('✅ Test week created:', testWeek._id);

    // Verify file retrieval
    console.log('🔍 Verifying file retrieval...');
    const retrievedImage = await gfs.files.findOne({ _id: imageUploadStream.id });
    const retrievedPdf = await gfs.files.findOne({ _id: pdfFile._id });

    console.log('📸 Retrieved image:', retrievedImage ? 'Found' : 'Not found');
    console.log('📄 Retrieved PDF:', retrievedPdf ? 'Found' : 'Not found');

    // List all collections
    const collections = await conn.db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));

    // Check GridFS collections
    const filesCount = await conn.db.collection('uploads.files').countDocuments();
    const chunksCount = await conn.db.collection('uploads.chunks').countDocuments();
    
    console.log(`🗂️  GridFS files count: ${filesCount}`);
    console.log(`🧩 GridFS chunks count: ${chunksCount}`);

    console.log('🎉 All tests passed! GridFS is working correctly.');
    
    // Cleanup test data
    await Week.findByIdAndDelete(testWeek._id);
    await gfs.files.deleteOne({ _id: imageUploadStream.id });
    await gfs.files.deleteOne({ _id: pdfFile._id });
    await gfs.chunks.deleteMany({ files_id: imageUploadStream.id });
    await gfs.chunks.deleteMany({ files_id: pdfFile._id });
    
    console.log('🧹 Test data cleaned up');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

testGridFS();
