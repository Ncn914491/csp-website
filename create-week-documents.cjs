const mongoose = require('mongoose');
const Week = require('./backend/models/weekModel');
require('dotenv').config({ path: './backend/.env' });

console.log('📝 Creating Week documents from GridFS files...\n');

const createWeekDocuments = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected');

    const db = mongoose.connection.db;

    // Get all uploaded files from GridFS
    const files = await db.collection('uploads.files').find({}).toArray();
    console.log(`📁 Found ${files.length} files in GridFS`);

    // Group files by week number
    const weekFiles = {};
    files.forEach(file => {
      const match = file.filename.match(/week(\d+)/i);
      if (match) {
        const weekNumber = parseInt(match[1]);
        if (!weekFiles[weekNumber]) {
          weekFiles[weekNumber] = { photos: [], reportPdf: null };
        }

        if (file.contentType.startsWith('image/')) {
          weekFiles[weekNumber].photos.push(file._id.toString());
        } else if (file.contentType === 'application/pdf') {
          weekFiles[weekNumber].reportPdf = file._id.toString();
        }
      }
    });

    console.log('📋 Grouped files by week:', Object.keys(weekFiles));

    // Create Week documents
    for (const [weekNumber, weekData] of Object.entries(weekFiles)) {
      console.log(`\n📦 Creating document for Week ${weekNumber}...`);

      // Check if week document already exists
      const existingWeek = await Week.findOne({ weekNumber: parseInt(weekNumber) });
      if (existingWeek) {
        console.log(`   ⚠️  Week ${weekNumber} document already exists, skipping...`);
        continue;
      }

      const newWeek = new Week({
        weekNumber: parseInt(weekNumber),
        summary: `Week ${weekNumber} activities and highlights from the CSP program.`,
        photos: weekData.photos,
        reportPdf: weekData.reportPdf
      });

      await newWeek.save();
      console.log(`   ✅ Created Week ${weekNumber} document with ID: ${newWeek._id}`);
      console.log(`   📸 Photos: ${weekData.photos.length}`);
      console.log(`   📄 PDF: ${weekData.reportPdf ? 'Yes' : 'No'}`);
    }

    // Verify final results
    const totalWeeks = await Week.countDocuments();
    const allWeeks = await Week.find({}).sort({ weekNumber: 1 });

    console.log(`\n🎉 Final Results:`);
    console.log(`   ✅ Created ${totalWeeks} week documents`);
    
    allWeeks.forEach(week => {
      console.log(`   Week ${week.weekNumber}: ${week.photos.length} photos, ${week.reportPdf ? 'PDF available' : 'No PDF'}`);
    });

    console.log('\n✨ Week documents created successfully!');
    console.log('🔗 Files are now linked and ready to use in the frontend!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Failed to create week documents:', error.message);
    console.error(error);
    process.exit(1);
  }
};

createWeekDocuments();
