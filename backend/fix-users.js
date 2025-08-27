const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function fixUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');

    // Drop the users collection to start fresh
    try {
      await User.collection.drop();
      console.log('✅ Dropped existing users collection');
    } catch (error) {
      console.log('ℹ️ Users collection did not exist or was already empty');
    }

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'admin'
    });
    await adminUser.save();
    console.log('✅ Created admin user');

    // Create test student users
    const students = [
      { username: 'student1', password: 'password123' },
      { username: 'student2', password: 'password123' },
      { username: 'john', password: 'john123' },
      { username: 'jane', password: 'jane123' }
    ];

    for (const student of students) {
      const passwordHash = await bcrypt.hash(student.password, 12);
      const user = new User({
        username: student.username,
        passwordHash,
        role: 'student'
      });
      await user.save();
      console.log(`✅ Created student user: ${student.username}`);
    }

    console.log('\n🎉 All users created successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin - Username: admin, Password: admin123');
    console.log('Student - Username: student1, Password: password123');
    console.log('Student - Username: student2, Password: password123');
    console.log('Student - Username: john, Password: john123');
    console.log('Student - Username: jane, Password: jane123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

fixUsers();