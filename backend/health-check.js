const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const Grid = require('gridfs-stream');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

class DatabaseHealthChecker {
  constructor() {
    this.connection = null;
    this.gridfsBucket = null;
    this.gfs = null;
  }

  async checkConnection() {
    const results = {
      timestamp: new Date().toISOString(),
      mongodb: { status: 'unknown', details: {} },
      gridfs: { status: 'unknown', details: {} },
      environment: { status: 'unknown', details: {} },
      overall: { status: 'unknown', healthy: false }
    };

    try {
      // Check environment variables
      results.environment = await this.checkEnvironment();
      
      // Check MongoDB connection
      results.mongodb = await this.checkMongoDB();
      
      // Check GridFS if MongoDB is healthy
      if (results.mongodb.status === 'healthy') {
        results.gridfs = await this.checkGridFS();
      }
      
      // Determine overall health
      results.overall = this.determineOverallHealth(results);
      
      return results;
    } catch (error) {
      results.overall = {
        status: 'error',
        healthy: false,
        error: error.message
      };
      return results;
    } finally {
      await this.cleanup();
    }
  }

  async checkEnvironment() {
    const requiredVars = ['MONGO_URL', 'JWT_SECRET', 'PORT'];
    const missing = [];
    const invalid = [];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      } else if (process.env[varName].includes('your_') || process.env[varName] === '') {
        invalid.push(varName);
      }
    }

    if (missing.length > 0 || invalid.length > 0) {
      return {
        status: 'unhealthy',
        details: {
          missing: missing,
          invalid: invalid,
          message: 'Required environment variables are missing or invalid'
        }
      };
    }

    return {
      status: 'healthy',
      details: {
        port: process.env.PORT,
        hasMongoUrl: !!process.env.MONGO_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        mongoUrlFormat: process.env.MONGO_URL?.startsWith('mongodb+srv://') ? 'atlas' : 'local'
      }
    };
  }

  async checkMongoDB() {
    try {
      const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
      
      // Test connection with timeout
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      
      this.connection = mongoose.connection;
      
      // Test basic operations
      const adminDb = this.connection.db.admin();
      const serverStatus = await adminDb.serverStatus();
      
      // Get database stats
      const dbStats = await this.connection.db.stats();
      
      return {
        status: 'healthy',
        details: {
          database: this.connection.name,
          host: serverStatus.host,
          version: serverStatus.version,
          uptime: serverStatus.uptime,
          collections: dbStats.collections,
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize,
          indexes: dbStats.indexes
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          code: error.code,
          type: error.constructor.name
        }
      };
    }
  }

  async checkGridFS() {
    try {
      if (!this.connection) {
        throw new Error('MongoDB connection not available');
      }

      // Initialize GridFS
      this.gfs = Grid(this.connection.db, mongoose.mongo);
      this.gfs.collection('uploads');
      this.gridfsBucket = new GridFSBucket(this.connection.db, { bucketName: 'uploads' });

      // Check GridFS collections
      const filesCollection = this.connection.db.collection('uploads.files');
      const chunksCollection = this.connection.db.collection('uploads.chunks');
      
      const filesCount = await filesCollection.countDocuments();
      const chunksCount = await chunksCollection.countDocuments();

      // Test GridFS operations with a small test file
      const testContent = `Health check test - ${Date.now()}`;
      const testFileName = `health-check-${Date.now()}.txt`;
      
      // Upload test file
      const uploadStream = this.gridfsBucket.openUploadStream(testFileName, {
        contentType: 'text/plain',
        metadata: { healthCheck: true, timestamp: new Date() }
      });

      uploadStream.end(testContent);

      const fileId = await new Promise((resolve, reject) => {
        uploadStream.on('finish', () => resolve(uploadStream.id));
        uploadStream.on('error', reject);
        setTimeout(() => reject(new Error('Upload timeout')), 5000);
      });

      // Download and verify test file
      const downloadStream = this.gridfsBucket.openDownloadStream(fileId);
      const chunks = [];
      
      const downloadedContent = await new Promise((resolve, reject) => {
        downloadStream.on('data', chunk => chunks.push(chunk));
        downloadStream.on('end', () => resolve(Buffer.concat(chunks).toString()));
        downloadStream.on('error', reject);
        setTimeout(() => reject(new Error('Download timeout')), 5000);
      });

      if (downloadedContent !== testContent) {
        throw new Error('GridFS content verification failed');
      }

      // Clean up test file
      await this.gridfsBucket.delete(fileId);

      return {
        status: 'healthy',
        details: {
          bucketName: 'uploads',
          filesCount: filesCount,
          chunksCount: chunksCount,
          uploadTest: 'passed',
          downloadTest: 'passed',
          cleanupTest: 'passed'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          type: error.constructor.name
        }
      };
    }
  }

  determineOverallHealth(results) {
    const components = [results.environment, results.mongodb, results.gridfs];
    const unhealthyComponents = components.filter(c => c.status === 'unhealthy');
    const unknownComponents = components.filter(c => c.status === 'unknown');

    if (unhealthyComponents.length > 0) {
      return {
        status: 'unhealthy',
        healthy: false,
        unhealthyComponents: unhealthyComponents.length,
        details: 'One or more components are unhealthy'
      };
    }

    if (unknownComponents.length > 0) {
      return {
        status: 'degraded',
        healthy: false,
        unknownComponents: unknownComponents.length,
        details: 'Some components could not be checked'
      };
    }

    return {
      status: 'healthy',
      healthy: true,
      details: 'All components are healthy'
    };
  }

  async cleanup() {
    if (this.connection) {
      try {
        await this.connection.close();
      } catch (error) {
        console.error('Error closing connection:', error.message);
      }
    }
  }
}

// CLI usage
if (require.main === module) {
  const checker = new DatabaseHealthChecker();
  
  checker.checkConnection()
    .then(results => {
      console.log('🏥 Database Health Check Results');
      console.log('================================');
      console.log(`Timestamp: ${results.timestamp}`);
      console.log(`Overall Status: ${results.overall.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'} (${results.overall.status})`);
      console.log();
      
      console.log('📊 Component Details:');
      console.log(`Environment: ${results.environment.status === 'healthy' ? '✅' : '❌'} ${results.environment.status}`);
      console.log(`MongoDB: ${results.mongodb.status === 'healthy' ? '✅' : '❌'} ${results.mongodb.status}`);
      console.log(`GridFS: ${results.gridfs.status === 'healthy' ? '✅' : '❌'} ${results.gridfs.status}`);
      
      if (results.mongodb.status === 'healthy') {
        console.log();
        console.log('🗄️ Database Info:');
        console.log(`Database: ${results.mongodb.details.database}`);
        console.log(`Host: ${results.mongodb.details.host}`);
        console.log(`Version: ${results.mongodb.details.version}`);
        console.log(`Collections: ${results.mongodb.details.collections}`);
        console.log(`Data Size: ${(results.mongodb.details.dataSize / 1024 / 1024).toFixed(2)} MB`);
      }
      
      if (results.gridfs.status === 'healthy') {
        console.log();
        console.log('📁 GridFS Info:');
        console.log(`Files: ${results.gridfs.details.filesCount}`);
        console.log(`Chunks: ${results.gridfs.details.chunksCount}`);
        console.log(`Operations: Upload ✅ Download ✅ Cleanup ✅`);
      }
      
      if (!results.overall.healthy) {
        console.log();
        console.log('❌ Issues Found:');
        if (results.environment.status !== 'healthy') {
          console.log(`Environment: ${results.environment.details.message || 'Configuration issues'}`);
        }
        if (results.mongodb.status !== 'healthy') {
          console.log(`MongoDB: ${results.mongodb.details.error || 'Connection issues'}`);
        }
        if (results.gridfs.status !== 'healthy') {
          console.log(`GridFS: ${results.gridfs.details.error || 'File operations issues'}`);
        }
      }
      
      process.exit(results.overall.healthy ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Health check failed:', error.message);
      process.exit(1);
    });
}

module.exports = DatabaseHealthChecker;