const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Create test student
    const studentPassword = await bcrypt.hash('student123', 12);
    const student = new User({
      username: 'student',
      passwordHash: studentPassword,
      role: 'student',
      name: 'Test Student',
      email: 'student@test.com'
    });

    // Create test admin
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = new User({
      username: 'admin',
      passwordHash: adminPassword,
      role: 'admin',
      name: 'Test Admin',
      email: 'admin@test.com'
    });

    // Remove existing users with same usernames
    await User.deleteMany({ username: { $in: ['student', 'admin'] } });

    // Save new users
    await student.save();
    await admin.save();

    console.log('✅ Test users created successfully:');
    console.log('Student: username=student, password=student123');
    console.log('Admin: username=admin, password=admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
}

createTestUser();