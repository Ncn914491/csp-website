const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_DIR = path.join(__dirname, 'test-files');

// Create test directory if it doesn't exist
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

// Create dummy test files
const createDummyFiles = () => {
  console.log('📁 Creating dummy test files...');
  
  // Create dummy image (simple base64 PNG)
  const dummyImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77ggAAAABJRU5ErkJggg==';
  const dummyImagePath = path.join(TEST_DIR, 'test-image.png');
  fs.writeFileSync(dummyImagePath, Buffer.from(dummyImageBase64, 'base64'));
  
  // Create dummy PDF
  const dummyPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000206 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n299\n%%EOF';
  const dummyPdfPath = path.join(TEST_DIR, 'test-report.pdf');
  fs.writeFileSync(dummyPdfPath, dummyPdfContent);
  
  console.log('✅ Dummy files created successfully');
  console.log(`   Image: ${dummyImagePath}`);
  console.log(`   PDF: ${dummyPdfPath}`);
  
  return { dummyImagePath, dummyPdfPath };
};

// Test GridFS upload
const testGridFSUpload = async (imagePath, pdfPath) => {
  console.log('\n🚀 Testing GridFS upload...');
  
  try {
    const formData = new FormData();
    formData.append('weekNumber', '999'); // Use a test week number
    formData.append('summary', 'This is a test week for GridFS functionality');
    formData.append('photos', fs.createReadStream(imagePath));
    formData.append('reportPdf', fs.createReadStream(pdfPath));
    
    const response = await axios.post(`${BASE_URL}/api/gridfs-weeks/add`, formData, {
      headers: {
        ...formData.getHeaders(),
        // Note: In real scenario, you'd need to authenticate first to get a token
        // 'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Upload successful!');
    console.log('   Response:', response.data);
    return response.data.data;
  } catch (error) {
    console.log('❌ Upload failed');
    console.log('   Error:', error.response?.data || error.message);
    throw error;
  }
};

// Test GridFS retrieval
const testGridFSRetrieval = async (weekData) => {
  console.log('\n📥 Testing GridFS retrieval...');
  
  try {
    // Test fetching all weeks
    console.log('   Testing: Fetch all weeks...');
    const weeksResponse = await axios.get(`${BASE_URL}/api/gridfs-weeks`);
    console.log(`   ✅ Found ${weeksResponse.data.length} weeks`);
    
    // Test fetching specific week
    console.log('   Testing: Fetch specific week...');
    const weekResponse = await axios.get(`${BASE_URL}/api/gridfs-weeks/${weekData._id}`);
    console.log('   ✅ Week details fetched successfully');
    
    // Test file retrieval
    if (weekData.photos && weekData.photos.length > 0) {
      console.log('   Testing: Photo file retrieval...');
      const photoResponse = await axios.get(`${BASE_URL}/api/gridfs-weeks/file/${weekData.photos[0]}`, {
        responseType: 'arraybuffer'
      });
      console.log(`   ✅ Photo retrieved (${photoResponse.data.length} bytes)`);
    }
    
    if (weekData.reportPdf) {
      console.log('   Testing: PDF file retrieval...');
      const pdfResponse = await axios.get(`${BASE_URL}/api/gridfs-weeks/file/${weekData.reportPdf}`, {
        responseType: 'arraybuffer'
      });
      console.log(`   ✅ PDF retrieved (${pdfResponse.data.length} bytes)`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Retrieval failed');
    console.log('   Error:', error.response?.data || error.message);
    throw error;
  }
};

// Clean up test data
const cleanupTestData = async (weekData) => {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    await axios.delete(`${BASE_URL}/api/gridfs-weeks/${weekData._id}`);
    console.log('✅ Test week deleted successfully');
  } catch (error) {
    console.log('⚠️  Cleanup failed (this might be expected if tests failed)');
    console.log('   Error:', error.response?.data || error.message);
  }
};

// Clean up test files
const cleanupTestFiles = () => {
  console.log('\n🗂️  Cleaning up test files...');
  try {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
      console.log('✅ Test files cleaned up');
    }
  } catch (error) {
    console.log('⚠️  File cleanup failed:', error.message);
  }
};

// Main test function
const runGridFSTests = async () => {
  console.log('🧪 GridFS Test Suite Starting...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Directory: ${TEST_DIR}`);
  
  let weekData = null;
  
  try {
    // Step 1: Create test files
    const { dummyImagePath, dummyPdfPath } = createDummyFiles();
    
    // Step 2: Test upload
    weekData = await testGridFSUpload(dummyImagePath, dummyPdfPath);
    
    // Step 3: Test retrieval
    await testGridFSRetrieval(weekData);
    
    // Step 4: Cleanup
    if (weekData) {
      await cleanupTestData(weekData);
    }
    
    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ File upload to GridFS');
    console.log('   ✅ Week data storage');
    console.log('   ✅ Week retrieval');
    console.log('   ✅ File retrieval from GridFS');
    console.log('   ✅ Cleanup');
    
  } catch (error) {
    console.log('\n💥 Test suite failed!');
    console.log('Error:', error.message);
    
    // Attempt cleanup even if tests failed
    if (weekData) {
      await cleanupTestData(weekData);
    }
    
    process.exit(1);
  } finally {
    cleanupTestFiles();
  }
};

// MongoDB Atlas verification
const verifyMongoAtlasCollections = () => {
  console.log('\n🔍 MongoDB Atlas Verification Instructions:');
  console.log('After running the tests, check your MongoDB Atlas dashboard:');
  console.log('1. Navigate to your cluster');
  console.log('2. Click "Browse Collections"');
  console.log('3. Look for these collections:');
  console.log('   - weeks (contains week documents with file references)');
  console.log('   - uploads.files (contains file metadata)');
  console.log('   - uploads.chunks (contains actual file chunks)');
  console.log('\nIf you see these collections, GridFS is working correctly!');
};

// Run tests if called directly
if (require.main === module) {
  runGridFSTests()
    .then(() => {
      verifyMongoAtlasCollections();
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runGridFSTests,
  createDummyFiles,
  testGridFSUpload,
  testGridFSRetrieval,
  cleanupTestData,
  cleanupTestFiles
};
