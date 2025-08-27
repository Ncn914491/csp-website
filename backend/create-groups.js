const mongoose = require('mongoose');
const Group = require('./models/Group');
require('dotenv').config();

async function createGroups() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');

    // Drop existing groups to start fresh
    try {
      await Group.collection.drop();
      console.log('✅ Dropped existing groups collection');
    } catch (error) {
      console.log('ℹ️ Groups collection did not exist or was already empty');
    }

    // Create test groups
    const groups = [
      {
        name: 'Study Group A',
        description: 'General study group for all subjects and collaborative learning',
        maxMembers: 10
      },
      {
        name: 'Programming Club',
        description: 'For students interested in coding, web development, and software engineering',
        maxMembers: 15
      },
      {
        name: 'Career Guidance',
        description: 'Discuss career opportunities, interview tips, and professional development',
        maxMembers: 20
      },
      {
        name: 'Project Team',
        description: 'Collaborate on group projects and assignments',
        maxMembers: 8
      }
    ];

    for (const groupData of groups) {
      const group = new Group(groupData);
      await group.save();
      console.log(`✅ Created group: ${groupData.name}`);
    }

    console.log('\n🎉 All groups created successfully!');
    console.log('Students can now join these groups and start collaborating.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createGroups();