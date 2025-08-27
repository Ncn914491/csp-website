const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { GridFSBucket } = require('mongodb');
require('dotenv').config();

// Import models
const Week = require('../models/weekModel');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const SchoolVisit = require('../models/SchoolVisit');
const Resource = require('../models/Resource');

let bucket;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected successfully');
    
    // Initialize GridFS Bucket
    const db = mongoose.connection.db;
    bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log('✅ GridFS Bucket initialized');
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

async function clearAllData() {
  console.log('🧹 Clearing all existing data...');
  
  try {
    // Clear all collections
    await Week.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({});
    await Message.deleteMany({});
    await SchoolVisit.deleteMany({});
    await Resource.deleteMany({});
    
    // Clear GridFS files and chunks
    const db = mongoose.connection.db;
    await db.collection('uploads.files').deleteMany({});
    await db.collection('uploads.chunks').deleteMany({});
    
    console.log('✅ All data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
    throw error;
  }
}

async function uploadFileToGridFS(filePath, filename) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }

    const readStream = fs.createReadStream(filePath);
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: getContentType(filePath),
      metadata: {
        originalPath: filePath,
        uploadedAt: new Date()
      }
    });

    readStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      console.log(`✅ Uploaded: ${filename} (${uploadStream.id})`);
      resolve(uploadStream.id.toString());
    });

    uploadStream.on('error', (error) => {
      console.error(`❌ Error uploading ${filename}:`, error.message);
      reject(error);
    });
  });
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

async function uploadWeekData() {
  console.log('📁 Uploading week data from public/csp folder...');
  
  const cspPath = path.join(__dirname, '../../public/csp');
  
  if (!fs.existsSync(cspPath)) {
    console.error('❌ CSP folder not found at:', cspPath);
    return;
  }

  // Career guidance (Week 0)
  const careerPath = path.join(cspPath, 'career');
  if (fs.existsSync(careerPath)) {
    console.log('📚 Processing career guidance data...');
    
    const careerFiles = fs.readdirSync(careerPath);
    const photos = [];
    let reportFile = null;

    for (const file of careerFiles) {
      const filePath = path.join(careerPath, file);
      const ext = path.extname(file).toLowerCase();
      
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        const fileId = await uploadFileToGridFS(filePath, `career_${file}`);
        photos.push(fileId);
      } else if (['.pdf', '.ppt', '.pptx'].includes(ext)) {
        reportFile = await uploadFileToGridFS(filePath, `career_report_${file}`);
      }
    }

    if (photos.length > 0 || reportFile) {
      const careerWeek = new Week({
        weekNumber: 0,
        summary: 'Career Guidance Resources - Interactive presentation with comprehensive career guidance, college information, and professional development resources.',
        photos: photos,
        reportFile: reportFile
      });
      
      await careerWeek.save();
      console.log('✅ Career guidance data uploaded');
    }
  }

  // Process weeks 1-8
  for (let weekNum = 1; weekNum <= 8; weekNum++) {
    const weekPath = path.join(cspPath, `week${weekNum}`);
    
    if (fs.existsSync(weekPath)) {
      console.log(`📅 Processing Week ${weekNum}...`);
      
      const weekFiles = fs.readdirSync(weekPath);
      const photos = [];
      let reportFile = null;

      for (const file of weekFiles) {
        const filePath = path.join(weekPath, file);
        const ext = path.extname(file).toLowerCase();
        
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
          const fileId = await uploadFileToGridFS(filePath, `week${weekNum}_${file}`);
          photos.push(fileId);
        } else if (['.pdf'].includes(ext)) {
          reportFile = await uploadFileToGridFS(filePath, `week${weekNum}_report_${file}`);
        }
      }

      // Create week entry even if no files (placeholder)
      const weekSummaries = {
        1: 'Introduction to Computer Science Program - Overview of curriculum, learning objectives, and program structure.',
        2: 'Programming Fundamentals - Basic programming concepts, syntax, and problem-solving techniques.',
        3: 'Data Structures and Algorithms - Understanding fundamental data structures and algorithmic thinking.',
        4: 'Web Development Basics - Introduction to HTML, CSS, and JavaScript for web development.',
        5: 'Database Management - Relational databases, SQL, and data modeling concepts.',
        6: 'Software Engineering Principles - Software development lifecycle, testing, and project management.',
        7: 'Advanced Programming Concepts - Object-oriented programming, design patterns, and best practices.',
        8: 'Project Development and Presentation - Capstone project work and presentation skills.'
      };

      const week = new Week({
        weekNumber: weekNum,
        summary: weekSummaries[weekNum] || `Week ${weekNum} activities and learning materials.`,
        photos: photos,
        reportFile: reportFile
      });
      
      await week.save();
      console.log(`✅ Week ${weekNum} data uploaded (${photos.length} photos, ${reportFile ? '1 PDF' : 'no PDF'})`);
    } else {
      // Create placeholder week
      const weekSummaries = {
        1: 'Introduction to Computer Science Program - Overview of curriculum, learning objectives, and program structure.',
        2: 'Programming Fundamentals - Basic programming concepts, syntax, and problem-solving techniques.',
        3: 'Data Structures and Algorithms - Understanding fundamental data structures and algorithmic thinking.',
        4: 'Web Development Basics - Introduction to HTML, CSS, and JavaScript for web development.',
        5: 'Database Management - Relational databases, SQL, and data modeling concepts.',
        6: 'Software Engineering Principles - Software development lifecycle, testing, and project management.',
        7: 'Advanced Programming Concepts - Object-oriented programming, design patterns, and best practices.',
        8: 'Project Development and Presentation - Capstone project work and presentation skills.'
      };

      const week = new Week({
        weekNumber: weekNum,
        summary: weekSummaries[weekNum] || `Week ${weekNum} activities and learning materials.`,
        photos: [],
        reportFile: null
      });
      
      await week.save();
      console.log(`✅ Week ${weekNum} placeholder created`);
    }
  }
}

async function createDefaultUsers() {
  console.log('👥 Creating default users...');
  
  const bcrypt = require('bcryptjs');
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = new User({
    username: 'admin',
    email: 'admin@csp.edu',
    passwordHash: adminPassword,
    role: 'admin'
  });
  await admin.save();
  console.log('✅ Admin user created (username: admin, password: admin123)');
  
  // Create test student user
  const studentPassword = await bcrypt.hash('student123', 12);
  const student = new User({
    username: 'student',
    email: 'student@csp.edu',
    passwordHash: studentPassword,
    role: 'student'
  });
  await student.save();
  console.log('✅ Student user created (username: student, password: student123)');
}

async function createDefaultGroups() {
  console.log('👥 Creating default study groups...');
  
  const groups = [
    {
      name: 'Computer Science Fundamentals',
      description: 'Discuss programming concepts, algorithms, and computer science theory',
      maxMembers: 50
    },
    {
      name: 'Web Development',
      description: 'Share resources and collaborate on web development projects',
      maxMembers: 30
    },
    {
      name: 'Career Guidance',
      description: 'Get advice on career paths, internships, and job opportunities',
      maxMembers: 100
    },
    {
      name: 'Project Collaboration',
      description: 'Find team members and collaborate on programming projects',
      maxMembers: 25
    },
    {
      name: 'Exam Preparation',
      description: 'Study together for entrance exams and competitive programming',
      maxMembers: 40
    }
  ];

  for (const groupData of groups) {
    const group = new Group(groupData);
    await group.save();
    console.log(`✅ Created group: ${groupData.name}`);
  }
}

async function createSampleResources() {
  console.log('📚 Creating sample career resources...');
  
  const resources = [
    {
      title: 'Complete Guide to Software Engineering Careers',
      type: 'PDF',
      url: 'https://example.com/software-engineering-guide.pdf',
      tags: ['software', 'engineering', 'career', 'programming']
    },
    {
      title: 'Top 10 Programming Languages to Learn in 2024',
      type: 'Article',
      url: 'https://example.com/programming-languages-2024',
      tags: ['programming', 'languages', 'trends', 'learning']
    },
    {
      title: 'Data Science Career Path Explained',
      type: 'Video',
      url: 'https://example.com/data-science-career-video',
      tags: ['data science', 'analytics', 'career', 'machine learning']
    },
    {
      title: 'Web Development Bootcamp Resources',
      type: 'PDF',
      url: 'https://example.com/web-dev-bootcamp.pdf',
      tags: ['web development', 'frontend', 'backend', 'fullstack']
    },
    {
      title: 'Cybersecurity Fundamentals Course',
      type: 'Video',
      url: 'https://example.com/cybersecurity-course',
      tags: ['cybersecurity', 'security', 'networking', 'ethical hacking']
    }
  ];

  for (const resourceData of resources) {
    const resource = new Resource(resourceData);
    await resource.save();
    console.log(`✅ Created resource: ${resourceData.title}`);
  }
}

async function main() {
  console.log('🚀 Starting fresh data migration...');
  
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  try {
    // Step 1: Clear all existing data
    await clearAllData();
    
    // Step 2: Upload week data from public/csp folder
    await uploadWeekData();
    
    // Step 3: Create default users
    await createDefaultUsers();
    
    // Step 4: Create default groups
    await createDefaultGroups();
    
    // Step 5: Create sample resources
    await createSampleResources();
    
    console.log('🎉 Fresh data migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Weeks: ${await Week.countDocuments()}`);
    console.log(`- Users: ${await User.countDocuments()}`);
    console.log(`- Groups: ${await Group.countDocuments()}`);
    console.log(`- Resources: ${await Resource.countDocuments()}`);
    console.log(`- School Visits: ${await SchoolVisit.countDocuments()}`);
    const gridfsCount = await mongoose.connection.db.collection('uploads.files').countDocuments();
    console.log(`- GridFS Files: ${gridfsCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { main };