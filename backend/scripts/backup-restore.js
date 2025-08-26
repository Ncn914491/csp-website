const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { pipeline } = require('stream');
const pipelineAsync = promisify(pipeline);
require('dotenv').config();

// Import models
const Week = require('../models/weekModel');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');

class BackupRestoreManager {
  constructor() {
    this.gfs = null;
    this.bucket = null;
    this.backupDir = path.join(__dirname, '../backups');
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      console.log('✅ Connected to MongoDB for backup/restore operations');
      
      // Initialize GridFS
      const conn = mongoose.connection;
      this.gfs = Grid(conn.db, mongoose.mongo);
      this.gfs.collection("uploads");
      
      this.bucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
      });
      
      console.log('✅ GridFS initialized');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`✅ Created backup directory: ${this.backupDir}`);
    }
  }

  async backupCollectionData() {
    console.log('📊 Backing up collection data...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dataBackupDir = path.join(this.backupDir, `data-${timestamp}`);
    fs.mkdirSync(dataBackupDir, { recursive: true });
    
    const collections = [
      { name: 'users', model: User },
      { name: 'groups', model: Group },
      { name: 'messages', model: Message },
      { name: 'weeks', model: Week }
    ];
    
    const backupManifest = {
      timestamp: new Date(),
      collections: {},
      gridfsFiles: 0
    };
    
    for (const collection of collections) {
      try {
        const data = await collection.model.find({}).lean();
        const filePath = path.join(dataBackupDir, `${collection.name}.json`);
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        backupManifest.collections[collection.name] = {
          count: data.length,
          file: `${collection.name}.json`
        };
        
        console.log(`✅ Backed up ${collection.name}: ${data.length} documents`);
      } catch (error) {
        console.error(`❌ Failed to backup ${collection.name}:`, error.message);
        backupManifest.collections[collection.name] = {
          error: error.message
        };
      }
    }
    
    return { dataBackupDir, backupManifest };
  }

  async backupGridFSFiles(dataBackupDir, backupManifest) {
    console.log('📁 Backing up GridFS files...');
    
    const filesBackupDir = path.join(dataBackupDir, 'gridfs-files');
    fs.mkdirSync(filesBackupDir, { recursive: true });
    
    try {
      const files = await this.gfs.files.find({}).toArray();
      const fileManifest = [];
      
      for (const file of files) {
        try {
          const fileName = `${file._id.toString()}-${file.filename}`;
          const filePath = path.join(filesBackupDir, fileName);
          
          // Download file from GridFS
          const downloadStream = this.bucket.openDownloadStream(file._id);
          const writeStream = fs.createWriteStream(filePath);
          
          await pipelineAsync(downloadStream, writeStream);
          
          // Store file metadata
          fileManifest.push({
            _id: file._id,
            filename: file.filename,
            contentType: file.contentType,
            length: file.length,
            uploadDate: file.uploadDate,
            metadata: file.metadata,
            backupFileName: fileName
          });
          
          console.log(`✅ Backed up file: ${file.filename}`);
          
        } catch (error) {
          console.error(`❌ Failed to backup file ${file.filename}:`, error.message);
          fileManifest.push({
            _id: file._id,
            filename: file.filename,
            error: error.message
          });
        }
      }
      
      // Save file manifest
      const manifestPath = path.join(filesBackupDir, 'files-manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(fileManifest, null, 2));
      
      backupManifest.gridfsFiles = fileManifest.filter(f => !f.error).length;
      console.log(`✅ Backed up ${backupManifest.gridfsFiles} GridFS files`);
      
    } catch (error) {
      console.error('❌ Failed to backup GridFS files:', error.message);
      backupManifest.gridfsError = error.message;
    }
  }

  async createBackup() {
    console.log('🗄️  Starting complete backup process...\n');
    
    try {
      await this.connect();
      this.ensureBackupDirectory();
      
      const { dataBackupDir, backupManifest } = await this.backupCollectionData();
      await this.backupGridFSFiles(dataBackupDir, backupManifest);
      
      // Save backup manifest
      const manifestPath = path.join(dataBackupDir, 'backup-manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(backupManifest, null, 2));
      
      console.log('\n📋 Backup Summary:');
      console.log('=' .repeat(50));
      console.log(`Backup Location: ${dataBackupDir}`);
      console.log(`Timestamp: ${backupManifest.timestamp}`);
      
      for (const [name, info] of Object.entries(backupManifest.collections)) {
        if (info.error) {
          console.log(`❌ ${name}: ${info.error}`);
        } else {
          console.log(`✅ ${name}: ${info.count} documents`);
        }
      }
      
      console.log(`✅ GridFS Files: ${backupManifest.gridfsFiles} files`);
      
      console.log('\n🎉 Backup completed successfully!');
      console.log(`📁 Backup saved to: ${dataBackupDir}`);
      
      return dataBackupDir;
      
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async restoreCollectionData(backupDir) {
    console.log('📊 Restoring collection data...');
    
    const collections = [
      { name: 'users', model: User },
      { name: 'groups', model: Group },
      { name: 'messages', model: Message },
      { name: 'weeks', model: Week }
    ];
    
    for (const collection of collections) {
      try {
        const filePath = path.join(backupDir, `${collection.name}.json`);
        
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️  Backup file not found for ${collection.name}, skipping...`);
          continue;
        }
        
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Clear existing data
        await collection.model.deleteMany({});
        
        // Insert backup data
        if (data.length > 0) {
          await collection.model.insertMany(data);
        }
        
        console.log(`✅ Restored ${collection.name}: ${data.length} documents`);
        
      } catch (error) {
        console.error(`❌ Failed to restore ${collection.name}:`, error.message);
      }
    }
  }

  async restoreGridFSFiles(backupDir) {
    console.log('📁 Restoring GridFS files...');
    
    const filesBackupDir = path.join(backupDir, 'gridfs-files');
    const manifestPath = path.join(filesBackupDir, 'files-manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      console.log('⚠️  GridFS files manifest not found, skipping file restore...');
      return;
    }
    
    try {
      // Clear existing GridFS files
      const existingFiles = await this.gfs.files.find({}).toArray();
      for (const file of existingFiles) {
        await this.bucket.delete(file._id);
      }
      console.log(`🧹 Cleared ${existingFiles.length} existing GridFS files`);
      
      const fileManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      let restoredCount = 0;
      
      for (const fileInfo of fileManifest) {
        if (fileInfo.error) {
          console.log(`⚠️  Skipping file with backup error: ${fileInfo.filename}`);
          continue;
        }
        
        try {
          const backupFilePath = path.join(filesBackupDir, fileInfo.backupFileName);
          
          if (!fs.existsSync(backupFilePath)) {
            console.log(`⚠️  Backup file not found: ${fileInfo.backupFileName}`);
            continue;
          }
          
          // Upload file to GridFS
          const readStream = fs.createReadStream(backupFilePath);
          const uploadStream = this.bucket.openUploadStreamWithId(
            new mongoose.Types.ObjectId(fileInfo._id),
            fileInfo.filename,
            {
              contentType: fileInfo.contentType,
              metadata: fileInfo.metadata
            }
          );
          
          await pipelineAsync(readStream, uploadStream);
          
          console.log(`✅ Restored file: ${fileInfo.filename}`);
          restoredCount++;
          
        } catch (error) {
          console.error(`❌ Failed to restore file ${fileInfo.filename}:`, error.message);
        }
      }
      
      console.log(`✅ Restored ${restoredCount} GridFS files`);
      
    } catch (error) {
      console.error('❌ Failed to restore GridFS files:', error.message);
    }
  }

  async restoreFromBackup(backupDir) {
    console.log(`🔄 Starting restore from backup: ${backupDir}\n`);
    
    try {
      await this.connect();
      
      // Verify backup directory exists
      if (!fs.existsSync(backupDir)) {
        throw new Error(`Backup directory not found: ${backupDir}`);
      }
      
      // Check for backup manifest
      const manifestPath = path.join(backupDir, 'backup-manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        console.log(`📋 Restoring backup from: ${manifest.timestamp}`);
      }
      
      await this.restoreCollectionData(backupDir);
      await this.restoreGridFSFiles(backupDir);
      
      console.log('\n🎉 Restore completed successfully!');
      
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async listBackups() {
    this.ensureBackupDirectory();
    
    console.log('📋 Available Backups:');
    console.log('=' .repeat(50));
    
    const backupDirs = fs.readdirSync(this.backupDir)
      .filter(dir => dir.startsWith('data-'))
      .sort()
      .reverse(); // Most recent first
    
    if (backupDirs.length === 0) {
      console.log('No backups found.');
      return [];
    }
    
    const backups = [];
    
    for (const dir of backupDirs) {
      const backupPath = path.join(this.backupDir, dir);
      const manifestPath = path.join(backupPath, 'backup-manifest.json');
      
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          const stats = fs.statSync(backupPath);
          
          console.log(`📁 ${dir}`);
          console.log(`   Created: ${new Date(manifest.timestamp).toLocaleString()}`);
          console.log(`   Collections: ${Object.keys(manifest.collections).length}`);
          console.log(`   GridFS Files: ${manifest.gridfsFiles || 0}`);
          console.log(`   Size: ${this.formatBytes(this.getDirectorySize(backupPath))}`);
          console.log('');
          
          backups.push({
            name: dir,
            path: backupPath,
            timestamp: manifest.timestamp,
            manifest: manifest
          });
          
        } catch (error) {
          console.log(`❌ ${dir}: Invalid manifest`);
        }
      } else {
        console.log(`⚠️  ${dir}: No manifest found`);
      }
    }
    
    return backups;
  }

  getDirectorySize(dirPath) {
    let totalSize = 0;
    
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += this.getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Command line interface
if (require.main === module) {
  const manager = new BackupRestoreManager();
  const command = process.argv[2];
  const backupPath = process.argv[3];
  
  switch (command) {
    case 'backup':
      manager.createBackup().catch(console.error);
      break;
      
    case 'restore':
      if (!backupPath) {
        console.error('❌ Please provide backup directory path');
        console.log('Usage: node backup-restore.js restore <backup-directory>');
        process.exit(1);
      }
      manager.restoreFromBackup(backupPath).catch(console.error);
      break;
      
    case 'list':
      manager.listBackups().catch(console.error);
      break;
      
    default:
      console.log('CSP Website Backup & Restore Manager');
      console.log('');
      console.log('Usage:');
      console.log('  node backup-restore.js backup                    # Create new backup');
      console.log('  node backup-restore.js restore <backup-dir>      # Restore from backup');
      console.log('  node backup-restore.js list                     # List available backups');
      console.log('');
      console.log('Examples:');
      console.log('  node backup-restore.js backup');
      console.log('  node backup-restore.js restore ../backups/data-2024-01-15T10-30-00-000Z');
      console.log('  node backup-restore.js list');
      break;
  }
}

module.exports = BackupRestoreManager;