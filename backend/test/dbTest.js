const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const SchoolVisit = require('../models/SchoolVisit');
const WeeklyUpdate = require('../models/WeeklyUpdate');
const Resource = require('../models/Resource');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected for testing');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const testCollections = async () => {
  try {
    console.log('\n📊 Testing database collections...\n');

    // Test Users collection
    const user = await User.findOne();
    console.log('👤 User sample:', user || 'No users found');

    // Test SchoolVisits collection
    const visit = await SchoolVisit.findOne();
    console.log('🏫 SchoolVisit sample:', visit || 'No visits found');

    // Test WeeklyUpdates collection
    const week = await WeeklyUpdate.findOne();
    console.log('📅 WeeklyUpdate sample:', week || 'No weekly updates found');

    // Test Resources collection
    const resource = await Resource.findOne();
    console.log('📄 Resource sample:', resource || 'No resources found');

    // Collection counts
    const counts = {
      users: await User.countDocuments(),
      visits: await SchoolVisit.countDocuments(),
      weeks: await WeeklyUpdate.countDocuments(),
      resources: await Resource.countDocuments()
    };

    console.log('\n📈 Collection counts:', counts);
    console.log('\n✅ Database test completed successfully!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

(async () => {
  await connectDB();
  await testCollections();
})();