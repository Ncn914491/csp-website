const mongoose = require('mongoose');
const Week = require('./models/weekModel');
require('dotenv').config();

async function createTestWeeks() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Remove existing test weeks
    await Week.deleteMany({ weekNumber: { $in: [1, 2, 3] } });

    // Create test weeks
    const weeks = [
      {
        weekNumber: 1,
        summary: 'Introduction to Community Service - We started our journey by understanding the importance of community service and identifying local needs.',
        photos: [], // Empty for now since we don't have actual GridFS files
        reportPdf: null
      },
      {
        weekNumber: 2,
        summary: 'Planning and Preparation - This week we planned our activities, formed teams, and prepared materials for our community service projects.',
        photos: [],
        reportPdf: null
      },
      {
        weekNumber: 3,
        summary: 'First Community Outreach - We conducted our first community outreach program, visiting local schools and distributing educational materials.',
        photos: [],
        reportPdf: null
      }
    ];

    await Week.insertMany(weeks);
    console.log('✅ Test weeks created successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test weeks:', error);
    process.exit(1);
  }
}

createTestWeeks();