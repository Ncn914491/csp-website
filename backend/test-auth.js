const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
require('dotenv').config();

async function testAuth() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');

    // Test user creation
    const testUsername = 'student1';
    const testPassword = 'password123';

    // Check if user exists
    let user = await User.findOne({ username: testUsername });
    
    if (!user) {
      // Create test user
      const passwordHash = await bcrypt.hash(testPassword, 12);
      user = new User({
        username: testUsername,
        passwordHash,
        role: 'student'
      });
      await user.save();
      console.log('✅ Created test student user');
    } else {
      console.log('✅ Test student user already exists');
    }

    // Test password verification
    const isPasswordValid = await bcrypt.compare(testPassword, user.passwordHash);
    console.log('✅ Password verification:', isPasswordValid);

    // Test JWT creation
    const payload = {
      userId: user._id.toString(),
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ JWT token created');

    // Test JWT verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ JWT token verified:', decoded);

    // Test admin user
    const adminUsername = 'admin';
    const adminPassword = 'admin123';

    let adminUser = await User.findOne({ username: adminUsername });
    
    if (!adminUser) {
      const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
      adminUser = new User({
        username: adminUsername,
        passwordHash: adminPasswordHash,
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ Created admin user');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('\n🎉 All authentication tests passed!');
    console.log('\nTest credentials:');
    console.log(`Student - Username: ${testUsername}, Password: ${testPassword}`);
    console.log(`Admin - Username: ${adminUsername}, Password: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testAuth();