const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const localData = require('./local-data');
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

// MongoDB connection with fallback to local data
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected successfully');
    isMongoConnected = true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('🔄 Falling back to local data store for development...');
    await localData.initializeData();
    isMongoConnected = false;
  }
};

// Connect to database
connectDB();

// Add middleware to pass database status to routes
app.use((req, res, next) => {
  req.isMongoConnected = isMongoConnected;
  next();
});

// Test route to verify MongoDB connection
app.get('/api/test', (req, res) => {
  res.json({ message: "MongoDB connection successful" });
});

// Import route handlers
const visitsRoutes = require('./routes/visits');
const weeksRoutes = require('./routes/weeks');
const resourcesRoutes = require('./routes/resources');
const usersRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/visits', visitsRoutes);
app.use('/api/weeks', weeksRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ai', aiRoutes);
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test MongoDB connection at: http://localhost:${PORT}/api/test`);
});