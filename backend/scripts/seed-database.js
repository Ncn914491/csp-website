const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const Week = require('../models/weekModel');

// Sample Indian names and professions
const indianNames = [
  'Aarav Sharma', 'Vivaan Patel', 'Aditya Kumar', 'Vihaan Singh', 'Arjun Gupta',
  'Sai Reddy', 'Reyansh Agarwal', 'Ayaan Khan', 'Krishna Yadav', 'Ishaan Joshi',
  'Ananya Verma', 'Diya Mehta', 'Aadhya Nair', 'Kavya Iyer', 'Arya Desai',
  'Myra Bansal', 'Anika Malhotra', 'Saanvi Kapoor', 'Navya Sinha', 'Kiara Jain'
];

const professions = [
  'Software Engineer', 'Data Scientist', 'Web Developer', 'Mobile App Developer',
  'DevOps Engineer', 'UI/UX Designer', 'Product Manager', 'System Administrator',
  'Database Administrator', 'Cybersecurity Analyst', 'Machine Learning Engineer',
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'QA Engineer'
];

// Sample group names and descriptions
const groupData = [
  {
    name: 'Web Development Enthusiasts',
    description: 'A group for students passionate about web development, sharing resources and discussing latest trends in HTML, CSS, JavaScript, and frameworks.'
  },
  {
    name: 'Data Science Explorers',
    description: 'Explore the world of data science, machine learning, and analytics. Share projects, datasets, and learning resources.'
  },
  {
    name: 'Mobile App Developers',
    description: 'Connect with fellow mobile app developers working on Android, iOS, and cross-platform applications.'
  },
  {
    name: 'Cybersecurity Warriors',
    description: 'Discuss cybersecurity trends, ethical hacking, and information security best practices.'
  },
  {
    name: 'AI & Machine Learning',
    description: 'Dive deep into artificial intelligence, machine learning algorithms, and neural networks.'
  },
  {
    name: 'Career Guidance Hub',
    description: 'Share career advice, interview experiences, and professional development tips for computer science students.'
  }
];

// Sample messages for group chats
const sampleMessages = [
  'Hello everyone! Excited to be part of this group.',
  'Has anyone worked with React.js recently? I need some help with state management.',
  'Just completed a project using Python and Django. Happy to share my experience!',
  'Looking for study partners for the upcoming semester. Anyone interested?',
  'Found this amazing tutorial on YouTube. Highly recommend checking it out!',
  'What are your thoughts on the latest JavaScript frameworks?',
  'Planning to attend a tech conference next month. Anyone else going?',
  'Just got an internship offer! Thanks to everyone for the support and guidance.',
  'Working on a machine learning project. Would love to get some feedback.',
  'Does anyone have experience with cloud platforms like AWS or Azure?'
];

// Week data with sample summaries
const weekData = [
  {
    weekNumber: 1,
    summary: 'Introduction to Computer Science Program - Overview of curriculum, faculty introductions, and campus tour. Students learned about programming fundamentals and got familiar with the development environment.',
    photos: [], // Will be populated with GridFS IDs if files exist
    reportPdf: null // Will be populated with GridFS ID if file exists
  },
  {
    weekNumber: 2,
    summary: 'Programming Fundamentals - Deep dive into programming concepts, variables, data types, and control structures. Hands-on coding sessions with Python and basic algorithm implementation.',
    photos: [],
    reportPdf: null
  },
  {
    weekNumber: 3,
    summary: 'Data Structures and Algorithms - Introduction to arrays, linked lists, stacks, and queues. Students implemented basic sorting algorithms and learned about time complexity analysis.',
    photos: [],
    reportPdf: null
  },
  {
    weekNumber: 4,
    summary: 'Web Development Basics - HTML, CSS, and JavaScript fundamentals. Students created their first web pages and learned about responsive design principles and modern web development practices.',
    photos: [],
    reportPdf: null
  },
  {
    weekNumber: 5,
    summary: 'Database Management and Project Work - Introduction to databases, SQL queries, and database design. Students worked on capstone projects integrating all learned concepts.',
    photos: [],
    reportPdf: null
  }
];

class DatabaseSeeder {
  constructor() {
    this.users = [];
    this.groups = [];
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      console.log('✅ Connected to MongoDB for seeding');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }

  async clearExistingData() {
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Group.deleteMany({});
    await Message.deleteMany({});
    await Week.deleteMany({});
    console.log('✅ Existing data cleared');
  }

  async createUsers() {
    console.log('👥 Creating users...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@csp.edu',
      password: adminPassword,
      role: 'admin'
    });
    await admin.save();
    this.users.push(admin);
    console.log('✅ Admin user created');

    // Create student users with Indian names
    for (let i = 0; i < indianNames.length; i++) {
      const name = indianNames[i];
      const email = `${name.toLowerCase().replace(' ', '.')}@student.csp.edu`;
      const password = await bcrypt.hash('student123', 10);
      
      const user = new User({
        name: name,
        email: email,
        password: password,
        role: 'student'
      });
      
      await user.save();
      this.users.push(user);
    }
    
    console.log(`✅ Created ${indianNames.length} student users`);
  }

  async createGroups() {
    console.log('👥 Creating groups...');
    
    for (const groupInfo of groupData) {
      // Create group
      const group = new Group({
        name: groupInfo.name,
        description: groupInfo.description,
        members: []
      });
      
      // Add random members (excluding admin)
      const studentUsers = this.users.filter(user => user.role === 'student');
      const memberCount = Math.floor(Math.random() * 8) + 3; // 3-10 members per group
      const selectedMembers = this.getRandomElements(studentUsers, memberCount);
      
      group.members = selectedMembers.map(user => user._id);
      await group.save();
      this.groups.push(group);
      
      console.log(`✅ Created group: ${group.name} with ${memberCount} members`);
    }
  }

  async createMessages() {
    console.log('💬 Creating sample messages...');
    
    for (const group of this.groups) {
      const messageCount = Math.floor(Math.random() * 15) + 5; // 5-20 messages per group
      
      for (let i = 0; i < messageCount; i++) {
        // Select random member from the group
        const randomMemberIndex = Math.floor(Math.random() * group.members.length);
        const userId = group.members[randomMemberIndex];
        
        // Select random message
        const randomMessage = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
        
        const message = new Message({
          groupId: group._id,
          userId: userId,
          content: randomMessage
        });
        
        await message.save();
      }
      
      console.log(`✅ Created ${messageCount} messages for group: ${group.name}`);
    }
  }

  async createWeeks() {
    console.log('📅 Creating week data...');
    
    for (const weekInfo of weekData) {
      const week = new Week(weekInfo);
      await week.save();
      console.log(`✅ Created week ${week.weekNumber}: ${week.summary.substring(0, 50)}...`);
    }
  }

  getRandomElements(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }

  async seed() {
    try {
      await this.connect();
      await this.clearExistingData();
      await this.createUsers();
      await this.createGroups();
      await this.createMessages();
      await this.createWeeks();
      
      console.log('\n🎉 Database seeding completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`   Users: ${this.users.length} (1 admin, ${this.users.length - 1} students)`);
      console.log(`   Groups: ${this.groups.length}`);
      console.log(`   Weeks: ${weekData.length}`);
      console.log('\n🔐 Login credentials:');
      console.log('   Admin: admin@csp.edu / admin123');
      console.log('   Students: [name]@student.csp.edu / student123');
      console.log('   Example: aarav.sharma@student.csp.edu / student123');
      
    } catch (error) {
      console.error('❌ Seeding failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.seed().catch(console.error);
}

module.exports = DatabaseSeeder;