const mongoose = require('mongoose');
const Group = require('./models/Group');
const User = require('./models/User');
require('dotenv').config();

async function createTestGroups() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Get test users
    const student = await User.findOne({ username: 'student' });
    const admin = await User.findOne({ username: 'admin' });

    if (!student || !admin) {
      console.log('Test users not found. Please run create-test-user.js first');
      process.exit(1);
    }

    // Remove existing test groups
    await Group.deleteMany({ name: { $regex: /^Test/ } });

    // Create test groups
    const groups = [
      {
        name: 'Test Study Group 1',
        description: 'A group for discussing computer science topics and sharing resources',
        members: [student._id],
        maxMembers: 10
      },
      {
        name: 'Test Career Guidance',
        description: 'Share career advice, internship opportunities, and professional development tips',
        members: [student._id, admin._id],
        maxMembers: 20
      },
      {
        name: 'Test Project Collaboration',
        description: 'Collaborate on coding projects and get help with assignments',
        members: [],
        maxMembers: 15
      }
    ];

    await Group.insertMany(groups);
    console.log('✅ Test groups created successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test groups:', error);
    process.exit(1);
  }
}

createTestGroups();