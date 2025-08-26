const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB connected for admin creation');
  } catch (error) {
    console.error('MongoDB connection error:', error?.message || error);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminPassword = 'admin123'; // Change this to a secure password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@csp.com',
      password: passwordHash,
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@csp.com');
    console.log('Password: admin123');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error?.message || error);
  } finally {
    await mongoose.connection.close();
  }
};

createAdmin();