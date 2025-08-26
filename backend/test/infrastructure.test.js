const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

describe('Backend Infrastructure Tests', () => {
  let connection;
  let gridfsBucket;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
    await mongoose.connect(mongoUri);
    connection = mongoose.connection;
    gridfsBucket = new GridFSBucket(connection.db, { bucketName: 'uploads' });
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
  });

  describe('MongoDB Connection', () => {
    test('should connect to MongoDB Atlas successfully', () => {
      expect(connection.readyState).toBe(1);
      expect(connection.name).toBe('cspDB');
    });

    test('should have valid environment variables', () => {
      expect(process.env.MONGO_URL).toBeDefined();
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.PORT).toBeDefined();
    });
  });

  describe('GridFS Configuration', () => {
    test('should initialize GridFS successfully', () => {
      expect(gridfsBucket).toBeDefined();
      expect(gridfsBucket.s.options.bucketName).toBe('uploads');
    });

    test('should access GridFS collections', async () => {
      const filesCollection = connection.db.collection('uploads.files');
      const chunksCollection = connection.db.collection('uploads.chunks');
      
      const filesCount = await filesCollection.countDocuments();
      const chunksCount = await chunksCollection.countDocuments();
      
      expect(typeof filesCount).toBe('number');
      expect(typeof chunksCount).toBe('number');
      expect(filesCount).toBeGreaterThanOrEqual(0);
      expect(chunksCount).toBeGreaterThanOrEqual(0);
    });

    test('should handle file operations', async () => {
      const testContent = 'Test file for infrastructure verification';
      const testFileName = `test-${Date.now()}.txt`;
      
      // Upload
      const uploadStream = gridfsBucket.openUploadStream(testFileName, {
        contentType: 'text/plain'
      });
      
      uploadStream.end(testContent);
      
      const fileId = await new Promise((resolve, reject) => {
        uploadStream.on('finish', () => resolve(uploadStream.id));
        uploadStream.on('error', reject);
      });
      
      expect(fileId).toBeDefined();
      
      // Download
      const downloadStream = gridfsBucket.openDownloadStream(fileId);
      const chunks = [];
      
      const downloadedContent = await new Promise((resolve, reject) => {
        downloadStream.on('data', chunk => chunks.push(chunk));
        downloadStream.on('end', () => resolve(Buffer.concat(chunks).toString()));
        downloadStream.on('error', reject);
      });
      
      expect(downloadedContent).toBe(testContent);
      
      // Cleanup
      await gridfsBucket.delete(fileId);
    });
  });

  describe('Database Models', () => {
    test('should load models without errors', () => {
      const User = require('../models/User');
      const Week = require('../models/weekModel');
      
      expect(User).toBeDefined();
      expect(Week).toBeDefined();
    });

    test('should validate model schemas', () => {
      const User = require('../models/User');
      const Week = require('../models/weekModel');
      
      // User schema validation
      expect(User.schema.paths.name.isRequired).toBe(true);
      expect(User.schema.paths.email.isRequired).toBe(true);
      expect(User.schema.paths.email.options.unique).toBe(true);
      expect(User.schema.paths.role.enumValues).toEqual(['admin', 'student']);
      
      // Week schema validation
      expect(Week.schema.paths.weekNumber.isRequired).toBe(true);
      expect(Week.schema.paths.weekNumber.options.unique).toBe(true);
      expect(Week.schema.paths.summary.isRequired).toBe(true);
    });
  });

  describe('Connection Fallback', () => {
    test('should have local data fallback available', () => {
      const localData = require('../local-data');
      
      expect(typeof localData.initializeData).toBe('function');
      expect(typeof localData.getUsers).toBe('function');
      expect(typeof localData.getWeeklyUpdates).toBe('function');
    });
  });
});