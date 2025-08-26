const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const localData = require('./local-data');
const Grid = require('gridfs-stream');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Static file serving
app.use('/csp', express.static(path.join(__dirname, '../csp')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Global flag to track database connection
let isMongoConnected = false;

// GridFS variables
let gfs, upload;

// MongoDB connection with fallback to local data
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected successfully');
    isMongoConnected = true;
    
    // Initialize GridFS
    const conn = mongoose.connection;
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("uploads");
    
    // Configure GridFS Storage
    const storage = new GridFsStorage({
      url: process.env.MONGO_URL,
      file: (req, file) => {
        return {
          filename: `${Date.now()}-${file.originalname}`,
          bucketName: "uploads"
        };
      },
    });
    
    upload = multer({ storage });
    console.log('✅ GridFS configured successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('🔄 Falling back to local data store for development...');
    await localData.initializeData();
    isMongoConnected = false;
  }
};

// Add middleware to pass database status and GridFS to routes
app.use((req, res, next) => {
  req.isMongoConnected = isMongoConnected;
  req.gfs = gfs;
  req.upload = upload;
  next();
});

// Test route to verify MongoDB connection
app.get('/api/test', (req, res) => {
  res.json({ message: "MongoDB connection successful" });
});

// Import route handlers
const visitsRoutes = require('./routes/visits');
const weeksRoutes = require('./routes/weeks');
const weekRoutes = require('./routes/weekRoutes'); // GridFS-based week routes
const resourcesRoutes = require('./routes/resources');
const usersRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const groupsRoutes = require('./routes/groups'); // Groups routes

// Use routes
app.use('/api/visits', visitsRoutes);
app.use('/api/weeks', weeksRoutes); // Existing legacy weeks routes
app.use('/api/gridfs-weeks', weekRoutes); // New GridFS-based week routes
app.use('/api/resources', resourcesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/groups', groupsRoutes); // Groups API
app.use('/api', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server after database connection
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test MongoDB connection at: http://localhost:${PORT}/api/test`);
  });
};

startServer();
