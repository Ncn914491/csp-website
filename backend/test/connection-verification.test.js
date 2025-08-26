const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const Grid = require('gridfs-stream');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

describe('Backend Infrastructure Setup and Database Connection', () => {
  let connection;
  let gridfsBucket;
  let gfs;

  beforeAll(async () => {
    // Test MongoDB Atlas connection
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
    if (!mongoUri) {
      throw new Error('Missing MONGO_URI/MONGO_URL environment variable');
    }

    try {
      await mongoose.connect(mongoUri);
      connection = mongoose.connection;
      console.log('✅ MongoDB Atlas connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
      console.log('✅ MongoDB connection closed');
    }
  });

  describe('MongoDB Atlas Connection', () => {
    test('should connect to MongoDB Atlas successfully', () => {
      expect(connection.readyState).toBe(1); // 1 = connected
    });

    test('should use correct database name', () => {
      expect(connection.name).toBe('cspDB');
    });

    test('should have valid connection string format', () => {
      const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
      expect(mongoUri).toMatch(/^mongodb\+srv:\/\//);
      expect(mongoUri).toContain('mongodb.net');
    });

    test('should verify environment variables are loaded', () => {
      expect(process.env.MONGO_URL).toBeDefined();
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.PORT).toBeDefined();
    });
  });

  describe('GridFS Configuration', () => {
    beforeAll(async () => {
      // Wait for connection to be ready
      if (connection.readyState !== 1) {
        await new Promise((resolve, reject) => {
          connection.once('open', resolve);
          connection.once('error', reject);
        });
      }

      // Initialize GridFS
      gfs = Grid(connection.db, mongoose.mongo);
      gfs.collection('uploads');
      gridfsBucket = new GridFSBucket(connection.db, { bucketName: 'uploads' });
    });

    test('should initialize GridFS successfully', () => {
      expect(gfs).toBeDefined();
      expect(gridfsBucket).toBeDefined();
    });

    test('should have correct GridFS bucket configuration', () => {
      expect(gridfsBucket.s.options.bucketName).toBe('uploads');
    });

    test('should be able to access GridFS collections', async () => {
      const filesCollection = connection.db.collection('uploads.files');
      const chunksCollection = connection.db.collection('uploads.chunks');
      
      expect(filesCollection).toBeDefined();
      expect(chunksCollection).toBeDefined();
      
      // Test collection access
      const filesCount = await filesCollection.countDocuments();
      const chunksCount = await chunksCollection.countDocuments();
      
      expect(typeof filesCount).toBe('number');
      expect(typeof chunksCount).toBe('number');
      
      console.log(`📁 GridFS files: ${filesCount}, chunks: ${chunksCount}`);
    });

    test('should handle GridFS file operations without errors', async () => {
      // Test creating a simple text file in GridFS
      const testContent = 'Test file content for GridFS verification';
      const testFileName = `test-${Date.now()}.txt`;
      
      try {
        // Create upload stream
        const uploadStream = gridfsBucket.openUploadStream(testFileName, {
          contentType: 'text/plain',
          metadata: { test: true }
        });

        // Write test content
        uploadStream.end(testContent);

        // Wait for upload to complete
        const fileId = await new Promise((resolve, reject) => {
          uploadStream.on('finish', () => resolve(uploadStream.id));
          uploadStream.on('error', reject);
        });

        expect(fileId).toBeDefined();
        console.log(`✅ Test file uploaded with ID: ${fileId}`);

        // Verify file exists
        const filesCollection = connection.db.collection('uploads.files');
        const file = await filesCollection.findOne({ _id: fileId });
        expect(file).toBeDefined();
        expect(file.filename).toBe(testFileName);
        expect(file.contentType).toBe('text/plain');

        // Test download stream
        const downloadStream = gridfsBucket.openDownloadStream(fileId);
        const chunks = [];
        
        const downloadedContent = await new Promise((resolve, reject) => {
          downloadStream.on('data', chunk => chunks.push(chunk));
          downloadStream.on('end', () => resolve(Buffer.concat(chunks).toString()));
          downloadStream.on('error', reject);
        });

        expect(downloadedContent).toBe(testContent);
        console.log('✅ Test file downloaded and verified');

        // Clean up test file
        await gridfsBucket.delete(fileId);
        console.log('✅ Test file cleaned up');

      } catch (error) {
        console.error('❌ GridFS operation failed:', error);
        throw error;
      }
    });
  });

  describe('Database Connection Fallback Mechanism', () => {
    test('should have local data fallback available', () => {
      const localData = require('../local-data');
      expect(typeof localData.initializeData).toBe('function');
      expect(typeof localData.getUsers).toBe('function');
      expect(typeof localData.getWeeklyUpdates).toBe('function');
    });

    test('should handle connection errors gracefully', async () => {
      // Test with invalid connection string
      const invalidUri = 'mongodb://invalid-host:27017/test';
      
      try {
        const testConnection = await mongoose.createConnection(invalidUri, {
          serverSelectionTimeoutMS: 1000 // Short timeout for test
        });
        
        // Should not reach here
        await testConnection.close();
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.name).toMatch(/MongoServerSelectionError|MongooseError/);
        console.log('✅ Connection error handled gracefully');
      }
    });
  });

  describe('Database Models and Schema Validation', () => {
    test('should load all required models without errors', () => {
      const User = require('../models/User');
      const Week = require('../models/weekModel');
      
      expect(User).toBeDefined();
      expect(Week).toBeDefined();
      
      // Test schema structure
      expect(User.schema.paths.name).toBeDefined();
      expect(User.schema.paths.email).toBeDefined();
      expect(User.schema.paths.password).toBeDefined();
      expect(User.schema.paths.role).toBeDefined();
      
      expect(Week.schema.paths.weekNumber).toBeDefined();
      expect(Week.schema.paths.summary).toBeDefined();
      expect(Week.schema.paths.photos).toBeDefined();
      expect(Week.schema.paths.reportPdf).toBeDefined();
    });

    test('should validate Week model constraints', () => {
      const Week = require('../models/weekModel');
      
      // Test required fields
      expect(Week.schema.paths.weekNumber.isRequired).toBe(true);
      expect(Week.schema.paths.summary.isRequired).toBe(true);
      
      // Test unique constraint
      expect(Week.schema.paths.weekNumber.options.unique).toBe(true);
      
      // Test array types
      expect(Week.schema.paths.photos.instance).toBe('Array');
    });

    test('should validate User model constraints', () => {
      const User = require('../models/User');
      
      // Test required fields
      expect(User.schema.paths.name.isRequired).toBe(true);
      expect(User.schema.paths.email.isRequired).toBe(true);
      expect(User.schema.paths.password.isRequired).toBe(true);
      expect(User.schema.paths.role.isRequired).toBe(true);
      
      // Test unique constraint
      expect(User.schema.paths.email.options.unique).toBe(true);
      
      // Test enum values
      expect(User.schema.paths.role.enumValues).toEqual(['admin', 'student']);
      expect(User.schema.paths.role.options.default).toBe('student');
    });
  });

  describe('Environment Configuration', () => {
    test('should have all required environment variables', () => {
      const requiredVars = ['MONGO_URL', 'JWT_SECRET', 'PORT'];
      
      requiredVars.forEach(varName => {
        expect(process.env[varName]).toBeDefined();
        expect(process.env[varName]).not.toBe('');
        console.log(`✅ ${varName}: ${varName === 'JWT_SECRET' ? '[HIDDEN]' : process.env[varName]}`);
      });
    });

    test('should have valid JWT secret', () => {
      const jwtSecret = process.env.JWT_SECRET;
      expect(jwtSecret.length).toBeGreaterThan(20);
      expect(jwtSecret).not.toBe('your_jwt_secret_key_here');
    });

    test('should have valid MongoDB connection string', () => {
      const mongoUrl = process.env.MONGO_URL;
      expect(mongoUrl).toMatch(/^mongodb\+srv:\/\//);
      expect(mongoUrl).toContain('cspDB');
      expect(mongoUrl).not.toBe('your_mongodb_connection_string');
    });

    test('should have valid port configuration', () => {
      const port = process.env.PORT;
      const portNum = parseInt(port);
      expect(portNum).toBeGreaterThan(0);
      expect(portNum).toBeLessThan(65536);
    });
  });

  describe('Database Collections and Indexes', () => {
    test('should verify database collections exist or can be created', async () => {
      const collections = await connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      console.log('📊 Available collections:', collectionNames);
      
      // GridFS collections should exist or be creatable
      const gridfsCollections = collectionNames.filter(name => 
        name.startsWith('uploads.')
      );
      
      if (gridfsCollections.length > 0) {
        console.log('✅ GridFS collections found:', gridfsCollections);
      } else {
        console.log('ℹ️ GridFS collections will be created on first upload');
      }
    });

    test('should verify indexes are properly configured', async () => {
      const User = require('../models/User');
      const Week = require('../models/weekModel');
      
      // Ensure indexes are created
      await User.ensureIndexes();
      await Week.ensureIndexes();
      
      // Check User indexes
      const userIndexes = await User.collection.getIndexes();
      expect(userIndexes).toBeDefined();
      expect(userIndexes.email_1).toBeDefined(); // Unique email index
      
      // Check Week indexes
      const weekIndexes = await Week.collection.getIndexes();
      expect(weekIndexes).toBeDefined();
      expect(weekIndexes.weekNumber_1).toBeDefined(); // Unique weekNumber index
      
      console.log('✅ Database indexes verified');
    });
  });
});