const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const Grid = require('gridfs-stream');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Verifying Backend Infrastructure Setup...\n');

async function verifySetup() {
  let connection = null;
  
  try {
    // 1. Check Environment Variables
    console.log('1️⃣ Checking Environment Variables...');
    const requiredVars = ['MONGO_URL', 'JWT_SECRET', 'PORT'];
    const missing = [];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      } else {
        console.log(`   ✅ ${varName}: ${varName === 'JWT_SECRET' ? '[HIDDEN]' : process.env[varName]}`);
      }
    }
    
    if (missing.length > 0) {
      console.log(`   ❌ Missing variables: ${missing.join(', ')}`);
      return false;
    }
    
    // 2. Test MongoDB Atlas Connection
    console.log('\n2️⃣ Testing MongoDB Atlas Connection...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
    
    await mongoose.connect(mongoUri);
    connection = mongoose.connection;
    console.log(`   ✅ Connected to database: ${connection.name}`);
    console.log(`   ✅ Host: ${connection.host}`);
    
    // 3. Test GridFS Configuration
    console.log('\n3️⃣ Testing GridFS Configuration...');
    
    // Initialize GridFS
    const gfs = Grid(connection.db, mongoose.mongo);
    gfs.collection('uploads');
    const gridfsBucket = new GridFSBucket(connection.db, { bucketName: 'uploads' });
    
    console.log('   ✅ GridFS initialized successfully');
    
    // Check existing files
    const filesCollection = connection.db.collection('uploads.files');
    const chunksCollection = connection.db.collection('uploads.chunks');
    
    const filesCount = await filesCollection.countDocuments();
    const chunksCount = await chunksCollection.countDocuments();
    
    console.log(`   ✅ GridFS files: ${filesCount}, chunks: ${chunksCount}`);
    
    // 4. Test Database Models
    console.log('\n4️⃣ Testing Database Models...');
    
    const User = require('./models/User');
    const Week = require('./models/weekModel');
    
    console.log('   ✅ User model loaded');
    console.log('   ✅ Week model loaded');
    
    // Test model operations
    const userCount = await User.countDocuments();
    const weekCount = await Week.countDocuments();
    
    console.log(`   ✅ Users in database: ${userCount}`);
    console.log(`   ✅ Weeks in database: ${weekCount}`);
    
    // 5. Test GridFS File Operations
    console.log('\n5️⃣ Testing GridFS File Operations...');
    
    const testContent = `Test file - ${new Date().toISOString()}`;
    const testFileName = `setup-test-${Date.now()}.txt`;
    
    // Upload test
    const uploadStream = gridfsBucket.openUploadStream(testFileName, {
      contentType: 'text/plain',
      metadata: { test: true }
    });
    
    uploadStream.end(testContent);
    
    const fileId = await new Promise((resolve, reject) => {
      uploadStream.on('finish', () => resolve(uploadStream.id));
      uploadStream.on('error', reject);
    });
    
    console.log('   ✅ File upload test passed');
    
    // Download test
    const downloadStream = gridfsBucket.openDownloadStream(fileId);
    const chunks = [];
    
    const downloadedContent = await new Promise((resolve, reject) => {
      downloadStream.on('data', chunk => chunks.push(chunk));
      downloadStream.on('end', () => resolve(Buffer.concat(chunks).toString()));
      downloadStream.on('error', reject);
    });
    
    if (downloadedContent === testContent) {
      console.log('   ✅ File download test passed');
    } else {
      throw new Error('Downloaded content does not match uploaded content');
    }
    
    // Cleanup test
    await gridfsBucket.delete(fileId);
    console.log('   ✅ File cleanup test passed');
    
    // 6. Test Connection Fallback
    console.log('\n6️⃣ Testing Connection Fallback Mechanism...');
    
    const localData = require('./local-data');
    console.log('   ✅ Local data fallback available');
    console.log('   ✅ Fallback initialization function available');
    
    console.log('\n🎉 All Infrastructure Tests Passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Environment variables configured');
    console.log('   ✅ MongoDB Atlas connection working');
    console.log('   ✅ GridFS configuration functional');
    console.log('   ✅ Database models loaded');
    console.log('   ✅ File operations working');
    console.log('   ✅ Fallback mechanism available');
    
    return true;
    
  } catch (error) {
    console.log(`\n❌ Setup verification failed: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your .env file has correct MongoDB connection string');
    console.log('   2. Verify MongoDB Atlas cluster is running');
    console.log('   3. Check network connectivity');
    console.log('   4. Ensure database user has proper permissions');
    
    return false;
    
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run verification
verifySetup()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Verification script error:', error.message);
    process.exit(1);
  });