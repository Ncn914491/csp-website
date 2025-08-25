const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const SchoolVisit = require('./models/SchoolVisit');
const WeeklyUpdate = require('./models/WeeklyUpdate');
const Resource = require('./models/Resource');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await SchoolVisit.deleteMany({});
    await WeeklyUpdate.deleteMany({});
    await Resource.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      username: 'admin',
      passwordHash: adminPassword,
      role: 'admin'
    });
    console.log('Created admin user (username: admin, password: admin123)');

    // Create sample student
    const studentPassword = await bcrypt.hash('student123', 10);
    await User.create({
      username: 'student',
      passwordHash: studentPassword,
      role: 'student'
    });
    console.log('Created student user (username: student, password: student123)');

    // Seed School Visits
    const schoolVisits = [
      {
        title: 'Delhi Public School Visit',
        date: new Date('2024-01-15'),
        description: 'Conducted career guidance session for 200+ students of classes 11-12. Discussed various career paths in technology and sciences.',
        images: [
          'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
          'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800'
        ]
      },
      {
        title: 'St. Mary\'s Convent School',
        date: new Date('2024-01-22'),
        description: 'Interactive workshop on emerging careers in AI and machine learning. Students showed great enthusiasm in hands-on coding activities.',
        images: [
          'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
          'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800'
        ]
      },
      {
        title: 'Government Senior Secondary School',
        date: new Date('2024-02-05'),
        description: 'Career counseling session focusing on competitive exams and scholarship opportunities. Distributed study materials and guidance booklets.',
        images: [
          'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800'
        ]
      },
      {
        title: 'International School of Excellence',
        date: new Date('2024-02-12'),
        description: 'Panel discussion with industry experts from various fields. Students got insights into real-world applications of their studies.',
        images: [
          'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=800',
          'https://images.unsplash.com/photo-1555436169-20e93ea9a7ff?w=800'
        ]
      },
      {
        title: 'Central Academy',
        date: new Date('2024-02-20'),
        description: 'STEM career showcase with live demonstrations and experiments. Special focus on women in STEM fields.',
        images: [
          'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800'
        ]
      }
    ];

    await SchoolVisit.insertMany(schoolVisits);
    console.log(`Created ${schoolVisits.length} school visits`);

    // Seed Weekly Updates with Photo Galleries
    const weeklyUpdates = [
      {
        weekNumber: 1,
        activities: 'Kick-off meeting with team members. Planned the semester schedule and assigned roles.',
        highlights: 'Successfully formed the career guidance team with 11 dedicated members.',
        summary: 'First week focused on team formation and planning. Set ambitious goals for reaching 1000+ students.',
        photoGallery: [
          { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', caption: 'Team planning session' },
          { url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800', caption: 'Initial brainstorming' }
        ]
      },
      {
        weekNumber: 2,
        activities: 'First school visit preparation. Created presentation materials and career guidance handbooks.',
        highlights: 'Developed comprehensive career guidance curriculum covering 15+ career paths.',
        summary: 'Intense preparation week with focus on content creation and material development.',
        photoGallery: [
          { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800', caption: 'Material preparation' },
          { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800', caption: 'Content development' }
        ]
      },
      {
        weekNumber: 3,
        activities: 'Conducted sessions at DPS and St. Mary\'s. Received excellent feedback from students and teachers.',
        highlights: 'Reached 400+ students in our first active week. 95% positive feedback rating.',
        summary: 'First successful implementation week with overwhelming positive response.',
        photoGallery: [
          { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', caption: 'DPS session in progress' },
          { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', caption: 'Interactive Q&A session' },
          { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800', caption: 'St. Mary\'s workshop' }
        ]
      },
      {
        weekNumber: 4,
        activities: 'Government school visit and scholarship awareness program. Distributed free study materials.',
        highlights: 'Helped 50+ underprivileged students apply for scholarships. Provided free career counseling.',
        summary: 'Focus on reaching underprivileged students with free resources and guidance.',
        photoGallery: [
          { url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800', caption: 'Scholarship guidance' },
          { url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', caption: 'Study material distribution' }
        ]
      },
      {
        weekNumber: 5,
        activities: 'Industry expert panel at International School. Virtual sessions for remote students.',
        highlights: 'Connected students with 8 industry professionals. Launched online career portal.',
        summary: 'Bridging the gap between education and industry through expert interactions.',
        photoGallery: [
          { url: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800', caption: 'Panel discussion' },
          { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', caption: 'Virtual session setup' },
          { url: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=800', caption: 'Student interactions' }
        ]
      }
    ];

    await WeeklyUpdate.insertMany(weeklyUpdates);
    console.log(`Created ${weeklyUpdates.length} weekly updates`);

    // Seed Resources
    const resources = [
      {
        title: 'Complete Career Guide 2024',
        type: 'PDF',
        url: 'https://example.com/career-guide-2024.pdf',
        tags: ['career', 'guidance', '2024', 'comprehensive']
      },
      {
        title: 'Engineering Entrance Exams Preparation',
        type: 'Video',
        url: 'https://youtube.com/watch?v=example1',
        tags: ['engineering', 'JEE', 'entrance', 'preparation']
      },
      {
        title: 'Top 10 Emerging Careers in AI',
        type: 'Article',
        url: 'https://medium.com/ai-careers-2024',
        tags: ['AI', 'technology', 'emerging', 'careers']
      },
      {
        title: 'Medical Career Pathways',
        type: 'PDF',
        url: 'https://example.com/medical-careers.pdf',
        tags: ['medical', 'NEET', 'doctor', 'healthcare']
      },
      {
        title: 'How to Crack UPSC',
        type: 'Video',
        url: 'https://youtube.com/watch?v=example2',
        tags: ['UPSC', 'civil services', 'IAS', 'preparation']
      },
      {
        title: 'Scholarship Opportunities for Students',
        type: 'Article',
        url: 'https://scholarships.gov.in/guide',
        tags: ['scholarship', 'financial aid', 'education', 'opportunities']
      },
      {
        title: 'Resume Building Workshop',
        type: 'Video',
        url: 'https://youtube.com/watch?v=example3',
        tags: ['resume', 'CV', 'job', 'application']
      },
      {
        title: 'Career in Data Science',
        type: 'PDF',
        url: 'https://example.com/data-science-career.pdf',
        tags: ['data science', 'analytics', 'technology', 'career']
      }
    ];

    await Resource.insertMany(resources);
    console.log(`Created ${resources.length} resources`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin - Username: admin, Password: admin123');
    console.log('Student - Username: student, Password: student123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
