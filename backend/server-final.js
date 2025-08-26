const express = require('express');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Week = require('./models/weekModel');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Static file serving (keep for legacy support)
app.use('/csp', express.static(path.join(__dirname, '../csp')));
app.use('/public', express.static(path.join(__dirname, '../public')));

let bucket, upload;

// Initialize MongoDB and GridFS
const initializeDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected successfully');

    // Initialize GridFS with native MongoDB API
    const db = mongoose.connection.db;
    bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log('✅ GridFS bucket initialized');

    // Set up multer with GridFS storage for form uploads
    const storage = new GridFsStorage({
      url: process.env.MONGO_URL,
      file: (req, file) => ({
        filename: `${Date.now()}-${file.originalname}`,
        bucketName: 'uploads'
      })
    });
    upload = multer({ storage });
    console.log('✅ Multer GridFS storage configured');

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
};

// Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'MongoDB connection successful' });
});

// GridFS Week Routes
app.get('/api/gridfs-weeks', async (req, res) => {
  try {
    if (!bucket) {
      return res.status(503).json({ error: 'GridFS not initialized' });
    }

    const weeks = await Week.find({}).sort({ weekNumber: -1 });
    res.json(weeks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload week data with files
app.post('/api/gridfs-weeks/add', (req, res) => {
  if (!upload || !bucket) {
    return res.status(503).json({ error: 'GridFS not available' });
  }

  const uploadFields = upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'reportPdf', maxCount: 1 }
  ]);

  uploadFields(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    try {
      if (!req.files || !req.files['photos'] || !req.files['reportPdf']) {
        return res.status(400).json({ error: 'Photos and reportPdf are required' });
      }

      const photoIds = req.files['photos'].map(file => file.id.toString());
      const reportId = req.files['reportPdf'][0].id.toString();

      const newWeek = new Week({
        weekNumber: req.body.weekNumber,
        summary: req.body.summary,
        photos: photoIds,
        reportPdf: reportId
      });

      await newWeek.save();
      res.json({ message: 'Week added successfully', data: newWeek });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// Serve files from GridFS
app.get('/api/gridfs-weeks/file/:id', async (req, res) => {
  try {
    if (!bucket) {
      return res.status(503).json({ error: 'GridFS not available' });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    
    // Get file info
    const db = mongoose.connection.db;
    const file = await db.collection('uploads.files').findOne({ _id: fileId });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set proper headers
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `inline; filename="${file.filename}"`);

    // Stream the file
    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);
    
    downloadStream.on('error', (error) => {
      console.error('GridFS download error:', error);
      res.status(500).json({ error: 'File streaming failed' });
    });

  } catch (err) {
    console.error('File serving error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single week
app.get('/api/gridfs-weeks/:id', async (req, res) => {
  try {
    const week = await Week.findById(req.params.id);
    if (!week) {
      return res.status(404).json({ error: 'Week not found' });
    }
    res.json(week);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete week and associated files
app.delete('/api/gridfs-weeks/:id', async (req, res) => {
  try {
    if (!bucket) {
      return res.status(503).json({ error: 'GridFS not available' });
    }

    const week = await Week.findById(req.params.id);
    if (!week) {
      return res.status(404).json({ error: 'Week not found' });
    }

    // Delete associated files from GridFS
    try {
      // Delete photos
      for (const photoId of week.photos) {
        await bucket.delete(new mongoose.Types.ObjectId(photoId));
      }

      // Delete report PDF
      if (week.reportPdf) {
        await bucket.delete(new mongoose.Types.ObjectId(week.reportPdf));
      }
    } catch (fileErr) {
      console.error('Error deleting files:', fileErr.message);
    }

    // Delete week document
    await Week.findByIdAndDelete(req.params.id);
    res.json({ message: 'Week and associated files deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import and use other existing routes
const visitsRoutes = require('./routes/visits');
const weeksRoutes = require('./routes/weeks');
const resourcesRoutes = require('./routes/resources');
const usersRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');

app.use('/api/visits', visitsRoutes);
app.use('/api/weeks', weeksRoutes); // Legacy weeks routes
app.use('/api/resources', resourcesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', authRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const startServer = async () => {
  const dbInitialized = await initializeDB();
  if (!dbInitialized) {
    console.error('Failed to initialize database');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Test connection: http://localhost:${PORT}/api/test`);
    console.log(`🗂️  GridFS API: http://localhost:${PORT}/api/gridfs-weeks`);
    console.log(`📁 File serving: http://localhost:${PORT}/api/gridfs-weeks/file/[id]`);
  });
};

startServer();
