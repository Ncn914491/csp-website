const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');
console.log('Connection string:', process.env.MONGO_URL ? 'Found' : 'Not found');

mongoose.connect(process.env.MONGO_URL, {
  serverSelectionTimeoutMS: 5000 // 5 second timeout
})
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('\nPlease ensure:');
    console.log('1. Your MongoDB Atlas cluster is running');
    console.log('2. Your IP address is whitelisted in MongoDB Atlas');
    console.log('3. The connection string in .env is correct');
    process.exit(1);
  });
