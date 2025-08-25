// Temporary local data store for development when MongoDB is not available
const bcrypt = require('bcryptjs');

// In-memory data store
let users = [];
let schoolVisits = [];
let weeklyUpdates = [];
let resources = [];

// Initialize with sample data
const initializeData = async () => {
  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  users.push({
    _id: 'admin-id-1',
    username: 'admin',
    passwordHash: adminPasswordHash,
    role: 'admin',
    createdAt: new Date()
  });

  // Sample school visits
  schoolVisits = [
    {
      _id: 'visit-1',
      title: 'Government High School Visit',
      date: new Date('2024-01-15'),
      description: 'Career guidance session for Class 10 and 12 students covering engineering and medical career paths.',
      images: ['/images/school1-1.jpg', '/images/school1-2.jpg']
    },
    {
      _id: 'visit-2',
      title: 'St. Mary\'s Convent School',
      date: new Date('2024-01-22'),
      description: 'Interactive workshop on career opportunities in technology and business fields.',
      images: ['/images/school2-1.jpg', '/images/school2-2.jpg']
    },
    {
      _id: 'visit-3',
      title: 'City Public School',
      date: new Date('2024-02-05'),
      description: 'Comprehensive career counseling session with focus on entrance exam preparation.',
      images: ['/images/school3-1.jpg']
    },
    {
      _id: 'visit-4',
      title: 'Modern English School',
      date: new Date('2024-02-12'),
      description: 'Career awareness program covering diverse fields including arts, commerce, and science.',
      images: ['/images/school4-1.jpg', '/images/school4-2.jpg', '/images/school4-3.jpg']
    }
  ];

  // Sample weekly updates
  weeklyUpdates = [
    {
      _id: 'week-1',
      weekNumber: 1,
      activities: 'Conducted career guidance sessions at 3 schools. Reached approximately 250 students across Class 10 and 12. Distributed career guidance booklets and conducted interactive Q&A sessions.',
      highlights: 'High engagement from students, particularly in engineering and medical career discussions. Teachers appreciated the comprehensive approach.',
      summary: 'Successful launch week with positive feedback from students and faculty.',
      photoGallery: [
        { url: '/images/week1-1.jpg', caption: 'Students engaged in career discussion' },
        { url: '/images/week1-2.jpg', caption: 'Interactive Q&A session' }
      ]
    },
    {
      _id: 'week-2',
      weekNumber: 2,
      activities: 'Expanded outreach to 4 additional schools. Introduced new modules on entrepreneurship and skill development. Conducted one-on-one counseling sessions for interested students.',
      highlights: 'Introduction of entrepreneurship module was well-received. Several students expressed interest in startup opportunities.',
      summary: 'Expanded reach with new innovative modules showing great promise.',
      photoGallery: [
        { url: '/images/week2-1.jpg', caption: 'Entrepreneurship workshop' },
        { url: '/images/week2-2.jpg', caption: 'One-on-one counseling' },
        { url: '/images/week2-3.jpg', caption: 'Group discussion on career paths' }
      ]
    },
    {
      _id: 'week-3',
      weekNumber: 3,
      activities: 'Focus on entrance exam preparation strategies. Conducted mock interview sessions. Distributed study materials and exam preparation guides.',
      highlights: 'Mock interviews helped students build confidence. Study materials were highly appreciated by both students and parents.',
      summary: 'Practical preparation focus yielded excellent student engagement and positive outcomes.',
      photoGallery: [
        { url: '/images/week3-1.jpg', caption: 'Mock interview session' },
        { url: '/images/week3-2.jpg', caption: 'Study material distribution' }
      ]
    }
  ];

  // Sample resources
  resources = [
    {
      _id: 'resource-1',
      title: 'Career Guidance Handbook 2024',
      type: 'PDF',
      url: '/documents/career-handbook-2024.pdf',
      tags: ['handbook', 'career', 'guidance'],
      description: 'Comprehensive guide covering all major career paths after 12th grade.'
    },
    {
      _id: 'resource-2',
      title: 'Engineering Entrance Exam Guide',
      type: 'PDF',
      url: '/documents/engineering-exam-guide.pdf',
      tags: ['engineering', 'entrance', 'exam'],
      description: 'Complete preparation guide for engineering entrance examinations.'
    },
    {
      _id: 'resource-3',
      title: 'Medical Career Pathways',
      type: 'PDF',
      url: '/documents/medical-career-guide.pdf',
      tags: ['medical', 'career', 'healthcare'],
      description: 'Detailed information about medical career opportunities and requirements.'
    },
    {
      _id: 'resource-4',
      title: 'Week 1 Activity Report',
      type: 'PDF',
      url: '/documents/week1-report.pdf',
      tags: ['week1', 'report', 'activities'],
      description: 'Detailed report of activities conducted during week 1.'
    },
    {
      _id: 'resource-5',
      title: 'Week 2 Activity Report',
      type: 'PDF',
      url: '/documents/week2-report.pdf',
      tags: ['week2', 'report', 'activities'],
      description: 'Comprehensive report covering week 2 activities and outcomes.'
    }
  ];

  console.log('✅ Local data initialized successfully!');
  console.log(`📚 ${schoolVisits.length} school visits loaded`);
  console.log(`📅 ${weeklyUpdates.length} weekly updates loaded`);
  console.log(`📄 ${resources.length} resources loaded`);
  console.log(`👥 ${users.length} users loaded (admin: admin/admin123)`);
};

// Data access functions
const getUsers = () => users;
const getSchoolVisits = () => schoolVisits;
const getWeeklyUpdates = () => weeklyUpdates;
const getResources = () => resources;

const findUserByUsername = (username) => users.find(u => u.username === username);
const findUserById = (id) => users.find(u => u._id === id);

const addUser = (user) => {
  user._id = `user-${Date.now()}`;
  user.createdAt = new Date();
  users.push(user);
  return user;
};

const addSchoolVisit = (visit) => {
  visit._id = `visit-${Date.now()}`;
  visit.createdAt = new Date();
  schoolVisits.push(visit);
  return visit;
};

const addWeeklyUpdate = (update) => {
  update._id = `week-${Date.now()}`;
  update.createdAt = new Date();
  weeklyUpdates.push(update);
  return update;
};

const addResource = (resource) => {
  resource._id = `resource-${Date.now()}`;
  resource.createdAt = new Date();
  resources.push(resource);
  return resource;
};

module.exports = {
  initializeData,
  getUsers,
  getSchoolVisits,
  getWeeklyUpdates,
  getResources,
  findUserByUsername,
  findUserById,
  addUser,
  addSchoolVisit,
  addWeeklyUpdate,
  addResource
};