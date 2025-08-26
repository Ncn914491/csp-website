const mongoose = require('mongoose');
const User = require('./backend/models/User');
require('dotenv').config({ path: './backend/.env' });

async function checkUsers() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');

    const users = await User.find({});
    console.log('📋 Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}`);
      console.log(`  Name: ${user.name || 'N/A'}`);
      console.log(`  Email: ${user.email || 'N/A'}`);
      console.log(`  Username: ${user.username || 'N/A'}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Has password: ${!!user.password}`);
      console.log(`  Has passwordHash: ${!!user.passwordHash}`);
      console.log('---');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();