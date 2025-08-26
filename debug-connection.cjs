const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
require('dotenv').config({ path: './backend/.env' });

console.log('🔧 Debug: Testing MongoDB and GridFS connection...');
console.log('🔧 MONGO_URL:', process.env.MONGO_URL ? 'Set' : 'Not set');

const testConnection = async () => {
  try {
    console.log('🔧 Attempting MongoDB connection...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected successfully');
    
    console.log('🔧 Setting up GridFS...');
    const conn = mongoose.connection;
    const gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("uploads");
    console.log('✅ GridFS initialized');
    
    console.log('🔧 Setting up multer storage...');
    const storage = new GridFsStorage({
      url: process.env.MONGO_URL,
      file: (req, file) => {
        return {
          filename: `${Date.now()}-${file.originalname}`,
          bucketName: "uploads"
        };
      },
    });
    
    const upload = multer({ storage });
    console.log('✅ Multer GridFS storage configured');
    
    // Test database operations
    console.log('🔧 Testing database operations...');
    const collections = await conn.db.listCollections().toArray();
    console.log('✅ Available collections:', collections.map(c => c.name));
    
    console.log('🎉 All connections successful!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('❌ Full error:', error);
    process.exit(1);
  }
};

testConnection();
