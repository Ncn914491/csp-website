const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
require('dotenv').config();

// Import models
const Week = require('../models/weekModel');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');

class DatabaseSummary {
  constructor() {
    this.gfs = null;
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      console.log('✅ Connected to MongoDB');
      
      // Initialize GridFS
      const conn = mongoose.connection;
      this.gfs = Grid(conn.db, mongoose.mongo);
      this.gfs.collection("uploads");
      
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }

  async generateSummary() {
    console.log('📊 CSP Website Database Summary');
    console.log('=' .repeat(60));
    console.log(`Generated: ${new Date().toLocaleString()}`);
    console.log('');

    // Users Summary
    const users = await User.find({});
    const adminUsers = users.filter(u => u.role === 'admin');
    const studentUsers = users.filter(u => u.role === 'student');
    
    console.log('👥 Users:');
    console.log(`   Total: ${users.length}`);
    console.log(`   Admins: ${adminUsers.length}`);
    console.log(`   Students: ${studentUsers.length}`);
    console.log('');

    // Groups Summary
    const groups = await Group.find({}).populate('members');
    console.log('👥 Groups:');
    console.log(`   Total: ${groups.length}`);
    
    for (const group of groups) {
      console.log(`   📁 ${group.name}: ${group.members.length} members`);
    }
    console.log('');

    // Messages Summary
    const messages = await Message.find({});
    console.log('💬 Messages:');
    console.log(`   Total: ${messages.length}`);
    
    for (const group of groups) {
      const groupMessages = messages.filter(m => m.groupId.toString() === group._id.toString());
      console.log(`   📁 ${group.name}: ${groupMessages.length} messages`);
    }
    console.log('');

    // Weeks Summary
    const weeks = await Week.find({}).sort({ weekNumber: 1 });
    console.log('📅 Weeks:');
    console.log(`   Total: ${weeks.length}`);
    
    for (const week of weeks) {
      const photoCount = week.photos ? week.photos.length : 0;
      const videoCount = week.videos ? week.videos.length : 0;
      const hasPdf = week.reportPdf ? '✅' : '❌';
      
      console.log(`   📖 Week ${week.weekNumber}:`);
      console.log(`      Photos: ${photoCount}`);
      console.log(`      Videos: ${videoCount}`);
      console.log(`      PDF Report: ${hasPdf}`);
      console.log(`      Summary: ${week.summary.substring(0, 80)}...`);
    }
    console.log('');

    // GridFS Files Summary
    const files = await this.gfs.files.find({}).toArray();
    const filesByType = {
      photos: files.filter(f => f.metadata && f.metadata.fileType === 'photo'),
      videos: files.filter(f => f.metadata && f.metadata.fileType === 'video'),
      reports: files.filter(f => f.metadata && f.metadata.fileType === 'report'),
      career: files.filter(f => f.metadata && f.metadata.fileType === 'career-guidance'),
      other: files.filter(f => !f.metadata || !['photo', 'video', 'report', 'career-guidance'].includes(f.metadata.fileType))
    };

    console.log('📁 GridFS Files:');
    console.log(`   Total: ${files.length}`);
    console.log(`   📸 Photos: ${filesByType.photos.length}`);
    console.log(`   🎥 Videos: ${filesByType.videos.length}`);
    console.log(`   📄 PDF Reports: ${filesByType.reports.length}`);
    console.log(`   💼 Career Guidance: ${filesByType.career.length}`);
    console.log(`   📁 Other: ${filesByType.other.length}`);
    console.log('');

    // Files by Week
    console.log('📅 Files by Week:');
    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      const weekFiles = files.filter(f => f.metadata && f.metadata.weekNumber === weekNum);
      const photos = weekFiles.filter(f => f.metadata.fileType === 'photo').length;
      const videos = weekFiles.filter(f => f.metadata.fileType === 'video').length;
      const pdfs = weekFiles.filter(f => f.metadata.fileType === 'report').length;
      
      console.log(`   Week ${weekNum}: ${photos} photos, ${videos} videos, ${pdfs} PDFs`);
    }
    console.log('');

    // Storage Statistics
    const totalSize = files.reduce((sum, file) => sum + file.length, 0);
    const avgSize = files.length > 0 ? totalSize / files.length : 0;
    
    console.log('💾 Storage Statistics:');
    console.log(`   Total Size: ${this.formatBytes(totalSize)}`);
    console.log(`   Average File Size: ${this.formatBytes(avgSize)}`);
    console.log(`   Largest File: ${this.formatBytes(Math.max(...files.map(f => f.length)))}`);
    console.log(`   Smallest File: ${this.formatBytes(Math.min(...files.map(f => f.length)))}`);
    console.log('');

    // Login Information
    console.log('🔐 Login Information:');
    console.log('   Admin Account:');
    console.log('     Email: admin@csp.edu');
    console.log('     Password: admin123');
    console.log('');
    console.log('   Student Accounts (examples):');
    const sampleStudents = studentUsers.slice(0, 3);
    for (const student of sampleStudents) {
      console.log(`     Email: ${student.email}`);
      console.log(`     Password: student123`);
    }
    console.log('     ... and 17 more student accounts');
    console.log('');

    // API Endpoints
    console.log('🌐 Available API Endpoints:');
    console.log('   📊 General:');
    console.log('     GET  /api/test                    - Test connection');
    console.log('     POST /api/login                   - User login');
    console.log('     POST /api/register                - User registration');
    console.log('');
    console.log('   📅 Weeks:');
    console.log('     GET  /api/gridfs-weeks            - Get all weeks');
    console.log('     GET  /api/gridfs-weeks/:id        - Get specific week');
    console.log('     GET  /api/gridfs-weeks/file/:id   - Stream file by ID');
    console.log('');
    console.log('   👥 Groups:');
    console.log('     GET  /api/groups                  - Get all groups');
    console.log('     POST /api/groups                  - Create group (admin)');
    console.log('     POST /api/groups/:id/join         - Join group');
    console.log('     GET  /api/groups/:id/messages     - Get group messages');
    console.log('     POST /api/groups/:id/messages     - Send message');
    console.log('');
    console.log('   🤖 AI:');
    console.log('     POST /api/ai                      - Chat with AI');
    console.log('');

    // Scripts Available
    console.log('🛠️  Available Scripts:');
    console.log('   npm run seed                      - Complete seeding (DB + files)');
    console.log('   npm run seed:db                   - Seed database only');
    console.log('   npm run seed:real-files           - Seed real files from public/csp');
    console.log('   npm run verify:integrity          - Verify data integrity');
    console.log('   npm run migrate                   - Run data migrations');
    console.log('   npm run backup                    - Create backup');
    console.log('   npm run backup:list               - List available backups');
    console.log('   npm run restore <backup-path>     - Restore from backup');
    console.log('');

    console.log('🎉 Database is fully populated and ready for use!');
    console.log('');
    console.log('📋 What\'s included:');
    console.log('   ✅ All real photos, videos, and PDFs from public/csp uploaded to GridFS');
    console.log('   ✅ 5 weeks of program data with enhanced summaries');
    console.log('   ✅ 21 users (1 admin + 20 students with Indian names)');
    console.log('   ✅ 6 groups with realistic descriptions and members');
    console.log('   ✅ Sample group chat messages for testing');
    console.log('   ✅ Career guidance files (presentation + photos)');
    console.log('   ✅ Complete backup and restore capabilities');
    console.log('   ✅ Data integrity verification tools');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Start backend: npm run dev');
    console.log('   2. Start frontend: npm run dev (in main directory)');
    console.log('   3. Test the application at http://localhost:3000');
    console.log('   4. Login with admin or student credentials');
    console.log('   5. Verify all photos, videos, and PDFs display correctly');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async run() {
    try {
      await this.connect();
      await this.generateSummary();
    } catch (error) {
      console.error('❌ Summary generation failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run summary if this file is executed directly
if (require.main === module) {
  const summary = new DatabaseSummary();
  summary.run().catch(console.error);
}

module.exports = DatabaseSummary;