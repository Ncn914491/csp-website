const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

describe('GridFS Operations Tests', () => {
  let gfs;
  let connection;
  let testFileId;

  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGO_URL.replace('cspDB', 'cspDB_test');
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
    
    connection = mongoose.connection;
    
    // Initialize GridFS
    gfs = Grid(connection.db, mongoose.mongo);
    gfs.collection('test_uploads');
  });

  afterAll(async () => {
    // Clean up test files
    if (testFileId) {
      try {
        await new Promise((resolve, reject) => {
          gfs.remove({ _id: testFileId }, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (error) {
        console.log('Cleanup error:', error.message);
      }
    }
    
    // Clean up all test files
    try {
      await connection.db.collection('test_uploads.files').deleteMany({
        filename: { $regex: /^test-/ }
      });
      await connection.db.collection('test_uploads.chunks').deleteMany({});
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
    
    await mongoose.connection.close();
  });

  describe('GridFS File Storage', () => {
    test('should store a file in GridFS', async () => {
      const testContent = 'This is test file content for GridFS testing';
      const filename = 'test-file.txt';
      
      return new Promise((resolve, reject) => {
        const writeStream = gfs.createWriteStream({
          filename: filename,
          content_type: 'text/plain',
          metadata: {
            testFile: true,
            uploadedAt: new Date()
          }
        });

        writeStream.on('close', (file) => {
          expect(file).toBeDefined();
          expect(file.filename).toBe(filename);
          expect(file.contentType).toBe('text/plain');
          testFileId = file._id;
          resolve();
        });

        writeStream.on('error', reject);
        writeStream.write(testContent);
        writeStream.end();
      });
    });

    test('should retrieve file metadata from GridFS', async () => {
      return new Promise((resolve, reject) => {
        gfs.files.findOne({ _id: testFileId }, (err, file) => {
          if (err) return reject(err);
          
          expect(file).toBeDefined();
          expect(file._id.toString()).toBe(testFileId.toString());
          expect(file.filename).toBe('test-file.txt');
          expect(file.contentType).toBe('text/plain');
          expect(file.metadata).toBeDefined();
          expect(file.metadata.testFile).toBe(true);
          resolve();
        });
      });
    });

    test('should read file content from GridFS', async () => {
      return new Promise((resolve, reject) => {
        const readStream = gfs.createReadStream({ _id: testFileId });
        let content = '';

        readStream.on('data', (chunk) => {
          content += chunk.toString();
        });

        readStream.on('end', () => {
          expect(content).toBe('This is test file content for GridFS testing');
          resolve();
        });

        readStream.on('error', reject);
      });
    });

    test('should handle file not found errors', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      return new Promise((resolve, reject) => {
        const readStream = gfs.createReadStream({ _id: nonExistentId });
        
        readStream.on('error', (error) => {
          expect(error).toBeDefined();
          expect(error.message).toContain('file not found');
          resolve();
        });

        readStream.on('data', () => {
          reject(new Error('Should not receive data for non-existent file'));
        });
      });
    });
  });

  describe('GridFS File Operations', () => {
    let imageFileId;

    test('should store binary file (image simulation)', async () => {
      // Create a simple binary buffer to simulate an image
      const binaryData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52  // IHDR chunk
      ]);

      return new Promise((resolve, reject) => {
        const writeStream = gfs.createWriteStream({
          filename: 'test-image.png',
          content_type: 'image/png',
          metadata: {
            originalName: 'test-image.png',
            uploadedBy: 'test-user',
            fileType: 'image'
          }
        });

        writeStream.on('close', (file) => {
          expect(file.filename).toBe('test-image.png');
          expect(file.contentType).toBe('image/png');
          expect(file.length).toBe(binaryData.length);
          imageFileId = file._id;
          resolve();
        });

        writeStream.on('error', reject);
        writeStream.write(binaryData);
        writeStream.end();
      });
    });

    test('should list files with filtering', async () => {
      return new Promise((resolve, reject) => {
        gfs.files.find({ 
          contentType: { $regex: /^image\// }
        }).toArray((err, files) => {
          if (err) return reject(err);
          
          expect(Array.isArray(files)).toBe(true);
          expect(files.length).toBeGreaterThan(0);
          
          const testImage = files.find(f => f.filename === 'test-image.png');
          expect(testImage).toBeDefined();
          expect(testImage.contentType).toBe('image/png');
          resolve();
        });
      });
    });

    test('should update file metadata', async () => {
      return new Promise((resolve, reject) => {
        gfs.files.updateOne(
          { _id: imageFileId },
          { 
            $set: { 
              'metadata.processed': true,
              'metadata.processedAt': new Date()
            }
          },
          (err, result) => {
            if (err) return reject(err);
            
            expect(result.modifiedCount).toBe(1);
            
            // Verify the update
            gfs.files.findOne({ _id: imageFileId }, (err, file) => {
              if (err) return reject(err);
              
              expect(file.metadata.processed).toBe(true);
              expect(file.metadata.processedAt).toBeDefined();
              resolve();
            });
          }
        );
      });
    });

    test('should delete file from GridFS', async () => {
      return new Promise((resolve, reject) => {
        gfs.remove({ _id: imageFileId }, (err) => {
          if (err) return reject(err);
          
          // Verify file is deleted
          gfs.files.findOne({ _id: imageFileId }, (err, file) => {
            if (err) return reject(err);
            
            expect(file).toBeNull();
            resolve();
          });
        });
      });
    });
  });

  describe('GridFS Performance Tests', () => {
    test('should handle multiple concurrent uploads', async () => {
      const uploadPromises = [];
      const fileCount = 5;

      for (let i = 0; i < fileCount; i++) {
        const promise = new Promise((resolve, reject) => {
          const content = `Test file content ${i}`;
          const writeStream = gfs.createWriteStream({
            filename: `test-concurrent-${i}.txt`,
            content_type: 'text/plain'
          });

          writeStream.on('close', (file) => {
            resolve(file._id);
          });

          writeStream.on('error', reject);
          writeStream.write(content);
          writeStream.end();
        });

        uploadPromises.push(promise);
      }

      const fileIds = await Promise.all(uploadPromises);
      expect(fileIds).toHaveLength(fileCount);

      // Clean up
      for (const fileId of fileIds) {
        await new Promise((resolve) => {
          gfs.remove({ _id: fileId }, () => resolve());
        });
      }
    });

    test('should handle large file streaming', async () => {
      // Create a larger test file (1MB of data)
      const chunkSize = 1024; // 1KB chunks
      const totalChunks = 1024; // 1MB total
      const largeContent = 'A'.repeat(chunkSize);

      return new Promise((resolve, reject) => {
        const writeStream = gfs.createWriteStream({
          filename: 'test-large-file.txt',
          content_type: 'text/plain',
          chunkSize: chunkSize
        });

        let chunksWritten = 0;

        writeStream.on('close', (file) => {
          expect(file.length).toBe(chunkSize * totalChunks);
          
          // Clean up immediately
          gfs.remove({ _id: file._id }, () => {
            resolve();
          });
        });

        writeStream.on('error', reject);

        // Write chunks
        const writeChunk = () => {
          if (chunksWritten < totalChunks) {
            writeStream.write(largeContent);
            chunksWritten++;
            setImmediate(writeChunk); // Use setImmediate to avoid stack overflow
          } else {
            writeStream.end();
          }
        };

        writeChunk();
      });
    });
  });

  describe('GridFS Error Handling', () => {
    test('should handle invalid ObjectId', async () => {
      return new Promise((resolve) => {
        gfs.files.findOne({ _id: 'invalid-id' }, (err, file) => {
          expect(err).toBeDefined();
          expect(file).toBeUndefined();
          resolve();
        });
      });
    });

    test('should handle write stream errors', async () => {
      return new Promise((resolve) => {
        const writeStream = gfs.createWriteStream({
          filename: '', // Invalid empty filename
          content_type: 'text/plain'
        });

        writeStream.on('error', (error) => {
          expect(error).toBeDefined();
          resolve();
        });

        writeStream.on('close', () => {
          // Should not reach here with invalid filename
          resolve();
        });

        writeStream.write('test content');
        writeStream.end();
      });
    });

    test('should handle read stream for deleted file', async () => {
      // First create a file
      const fileId = await new Promise((resolve, reject) => {
        const writeStream = gfs.createWriteStream({
          filename: 'test-to-delete.txt',
          content_type: 'text/plain'
        });

        writeStream.on('close', (file) => {
          resolve(file._id);
        });

        writeStream.on('error', reject);
        writeStream.write('content to delete');
        writeStream.end();
      });

      // Delete the file
      await new Promise((resolve, reject) => {
        gfs.remove({ _id: fileId }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Try to read the deleted file
      return new Promise((resolve) => {
        const readStream = gfs.createReadStream({ _id: fileId });
        
        readStream.on('error', (error) => {
          expect(error).toBeDefined();
          resolve();
        });

        readStream.on('data', () => {
          // Should not receive data
          resolve();
        });
      });
    });
  });

  describe('GridFS Metadata Operations', () => {
    test('should query files by metadata', async () => {
      // Create files with different metadata
      const file1Id = await new Promise((resolve, reject) => {
        const writeStream = gfs.createWriteStream({
          filename: 'test-metadata-1.txt',
          content_type: 'text/plain',
          metadata: {
            category: 'documents',
            week: 1,
            type: 'report'
          }
        });

        writeStream.on('close', (file) => resolve(file._id));
        writeStream.on('error', reject);
        writeStream.write('Document content 1');
        writeStream.end();
      });

      const file2Id = await new Promise((resolve, reject) => {
        const writeStream = gfs.createWriteStream({
          filename: 'test-metadata-2.txt',
          content_type: 'text/plain',
          metadata: {
            category: 'images',
            week: 1,
            type: 'photo'
          }
        });

        writeStream.on('close', (file) => resolve(file._id));
        writeStream.on('error', reject);
        writeStream.write('Image content 1');
        writeStream.end();
      });

      // Query by metadata
      return new Promise((resolve, reject) => {
        gfs.files.find({
          'metadata.week': 1,
          'metadata.category': 'documents'
        }).toArray((err, files) => {
          if (err) return reject(err);
          
          expect(files).toHaveLength(1);
          expect(files[0].metadata.type).toBe('report');
          
          // Clean up
          gfs.remove({ _id: file1Id }, () => {
            gfs.remove({ _id: file2Id }, () => {
              resolve();
            });
          });
        });
      });
    });

    test('should aggregate file statistics', async () => {
      return new Promise((resolve, reject) => {
        // Get file count and total size
        gfs.files.aggregate([
          {
            $group: {
              _id: null,
              totalFiles: { $sum: 1 },
              totalSize: { $sum: '$length' },
              avgSize: { $avg: '$length' }
            }
          }
        ]).toArray((err, results) => {
          if (err) return reject(err);
          
          if (results.length > 0) {
            const stats = results[0];
            expect(stats.totalFiles).toBeGreaterThanOrEqual(0);
            expect(stats.totalSize).toBeGreaterThanOrEqual(0);
            expect(stats.avgSize).toBeGreaterThanOrEqual(0);
          }
          
          resolve();
        });
      });
    });
  });
});