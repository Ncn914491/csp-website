const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const fs = require('fs');
const path = require('path');
let Week; // Will bind to the SAME mongoose instance in this script
require('dotenv').config({ path: './backend/.env' });

// Configuration
const CSP_DIR = path.join(__dirname, 'public', 'csp');
const CSP_DIST_DIR = path.join(__dirname, 'dist', 'csp');
const CAREER_PPTX_PRIMARY = path.join(__dirname, 'public', 'csp', 'csp.pptx');
const CAREER_PPTX_FALLBACK = path.join(__dirname, 'dist', 'csp.pptx');

console.log('🚀 Starting final migration from /csp folder to GridFS using native MongoDB...\n');

const migrateTinalToGridFS = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
    if (!mongoUri) {
      throw new Error('Missing MONGO_URI/MONGO_URL in environment');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');

    // Define Week model on this mongoose instance to avoid multi-instance mismatch
    if (!Week) {
      const weekSchema = new mongoose.Schema({
        weekNumber: { type: Number, required: true, unique: true },
        summary: { type: String, required: true },
        photos: [{ type: String }],
        reportPdf: { type: String }
      }, { timestamps: true });
      Week = mongoose.model('Week', weekSchema);
    }

    // Initialize GridFS using native MongoDB
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log('✅ GridFS bucket initialized');

    // Check if csp directory exists
    if (!fs.existsSync(CSP_DIR)) {
      console.log('❌ CSP directory not found at:', CSP_DIR);
      return;
    }

    // Verify GridFS collections exist and warn if empty
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    if (!collectionNames.includes('uploads.files') || !collectionNames.includes('uploads.chunks')) {
      console.log('⚠️  GridFS collections not found yet (uploads.files/uploads.chunks will be created on first upload).');
    } else {
      const filesCount = await db.collection('uploads.files').countDocuments();
      const chunksCount = await db.collection('uploads.chunks').countDocuments();
      if (filesCount === 0 || chunksCount === 0) {
        console.log('⚠️  GridFS collections exist but are empty. Migration will populate them.');
      } else {
        console.log(`ℹ️  Existing GridFS state: uploads.files=${filesCount}, uploads.chunks=${chunksCount}`);
      }
    }

    // Get all week directories from public and dist (fallback)
    const publicWeekDirs = fs.existsSync(CSP_DIR)
      ? fs.readdirSync(CSP_DIR).filter(dir => {
          const fullPath = path.join(CSP_DIR, dir);
          return fs.statSync(fullPath).isDirectory() && /^week\d+$/i.test(dir);
        })
      : [];

    const distWeekDirs = fs.existsSync(CSP_DIST_DIR)
      ? fs.readdirSync(CSP_DIST_DIR).filter(dir => {
          const fullPath = path.join(CSP_DIST_DIR, dir);
          return fs.statSync(fullPath).isDirectory() && /^week\d+$/i.test(dir);
        })
      : [];

    const uniqueWeekSet = new Set([...publicWeekDirs, ...distWeekDirs]);
    // Ensure weeks 1-5 exist (even if folder missing)
    for (let i = 1; i <= 5; i++) {
      uniqueWeekSet.add(`week${i}`);
    }
    const weekDirs = Array.from(uniqueWeekSet).sort((a,b) => extractWeekNumber(a) - extractWeekNumber(b));

    console.log(`📁 Found ${weekDirs.length} week directories:`);
    weekDirs.forEach(dir => console.log(`   - ${dir}`));
    console.log();

    let totalUploadedWeeks = 0;
    let expectedFileCount = 0;
    let actuallyUploadedFileCount = 0;

    // Process each week directory
    for (const weekDir of weekDirs) {
      // Detect sources for this week (public first, then dist)
      const publicWeekPath = path.join(CSP_DIR, weekDir);
      const distWeekPath = path.join(CSP_DIST_DIR, weekDir);
      const activePath = fs.existsSync(publicWeekPath)
        ? publicWeekPath
        : (fs.existsSync(distWeekPath) ? distWeekPath : null);

      let imageFiles = [];
      let pdfFiles = [];
      if (activePath) {
        const files = fs.readdirSync(activePath);
        imageFiles = files.filter(f => ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(f).toLowerCase()));
        pdfFiles = files.filter(f => path.extname(f).toLowerCase() === '.pdf');
      }

      expectedFileCount += imageFiles.length + 1; // count images + 1 pdf (real or placeholder)

      const result = await migrateWeekToGridFS(weekDir, bucket, (numUploaded) => {
        actuallyUploadedFileCount += numUploaded;
      });
      if (result) totalUploadedWeeks++;
    }

    // Upload Career Resources PPTX as special Week 0 entry
    const careerPptxPath = fs.existsSync(CAREER_PPTX_PRIMARY)
      ? CAREER_PPTX_PRIMARY
      : (fs.existsSync(CAREER_PPTX_FALLBACK) ? CAREER_PPTX_FALLBACK : null);

    if (careerPptxPath) {
      console.log('📚 Uploading Career Resources PPTX...');
      const uploadStream = bucket.openUploadStream(`career-resources.pptx`, { contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      const pptxStream = fs.createReadStream(careerPptxPath);
      const careerPptxId = await new Promise((resolve, reject) => {
        pptxStream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', () => resolve(uploadStream.id));
      });
      actuallyUploadedFileCount += 1;
      expectedFileCount += 1;

      // Upsert Week 0 document
      const existingCareer = await Week.findOne({ weekNumber: 0 });
      if (!existingCareer) {
        const careerDoc = new Week({
          weekNumber: 0,
          summary: 'Career Resources - downloadable PPT',
          photos: [],
          reportPdf: careerPptxId.toString()
        });
        await careerDoc.save();
        console.log(`   ✅ Created Career Resources entry with PPTX ID: ${careerPptxId}`);
      } else {
        existingCareer.reportPdf = careerPptxId.toString();
        await existingCareer.save();
        console.log(`   🔄 Updated Career Resources entry with new PPTX ID: ${careerPptxId}`);
      }
    } else {
      console.log('⚠️  Career Resources PPTX not found at /public/csp/csp.pptx or /dist/csp.pptx. Skipping.');
    }

    console.log('🎉 Migration completed successfully!');
    console.log(`📋 Migration Summary:`);
    console.log(`   ✅ Processed ${weekDirs.length} weeks`);
    console.log(`   ✅ Successfully uploaded ${totalUploadedWeeks} weeks`);
    console.log(`   📦 Expected files: ${expectedFileCount}`);
    console.log(`   📥 Actually uploaded files: ${actuallyUploadedFileCount}`);
    console.log('   ✅ Files uploaded to GridFS');
    console.log('   ✅ Week documents created in MongoDB');

    // Verification
    await verifyMigration(db);

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Migrate a single week directory
const migrateWeekToGridFS = async (weekDir, bucket, onUploadedFiles) => {
  const weekPath = path.join(CSP_DIR, weekDir);
  const distWeekPath = path.join(CSP_DIST_DIR, weekDir);
  const weekNumber = extractWeekNumber(weekDir);
  
  console.log(`📦 Processing ${weekDir} (Week ${weekNumber})...`);

  try {
    // Get files in the week directory (public first, then dist fallback)
    let files = [];
    if (fs.existsSync(weekPath)) {
      files = fs.readdirSync(weekPath);
    } else if (fs.existsSync(distWeekPath)) {
      files = fs.readdirSync(distWeekPath);
    }
    const imageFiles = files.filter(file => ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(file).toLowerCase()));
    const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');

    console.log(`   📸 Found ${imageFiles.length} images`);
    console.log(`   📄 Found ${pdfFiles.length} PDFs`);

    // Upload images to GridFS
    const photoIds = [];
    let uploadedCount = 0;
    for (const imageFile of imageFiles) {
      const imagePath = fs.existsSync(path.join(weekPath, imageFile))
        ? path.join(weekPath, imageFile)
        : path.join(distWeekPath, imageFile);
      console.log(`   📤 Uploading ${imageFile}...`);
      
      const imageStream = fs.createReadStream(imagePath);
      const uploadStream = bucket.openUploadStream(`week${weekNumber}-${imageFile}`, {
        contentType: getContentType(imageFile)
      });

      const imageId = await new Promise((resolve, reject) => {
        imageStream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', () => resolve(uploadStream.id));
      });

      photoIds.push(imageId.toString());
      console.log(`   ✅ Uploaded ${imageFile} with ID: ${imageId}`);
      uploadedCount += 1;
    }

    // Upload PDF to GridFS
    let reportId = null;
    if (pdfFiles.length > 0) {
      const pdfFile = pdfFiles[0]; // Take the first PDF
      const pdfPath = path.join(weekPath, pdfFile);
      console.log(`   📤 Uploading ${pdfFile}...`);

      const pdfStream = fs.createReadStream(pdfPath);
      const uploadStream = bucket.openUploadStream(`week${weekNumber}-${pdfFile}`, {
        contentType: 'application/pdf'
      });

      reportId = await new Promise((resolve, reject) => {
        pdfStream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', () => resolve(uploadStream.id));
      });

      console.log(`   ✅ Uploaded ${pdfFile} with ID: ${reportId}`);
      uploadedCount += 1;
    } else {
      // Create a dummy PDF
      console.log('   📝 Creating placeholder PDF...');
      const dummyPdfContent = createDummyPdf(weekNumber);
      const tempPdfPath = path.join(__dirname, `temp-week-${weekNumber}.pdf`);
      fs.writeFileSync(tempPdfPath, dummyPdfContent);

      const pdfStream = fs.createReadStream(tempPdfPath);
      const uploadStream = bucket.openUploadStream(`week${weekNumber}-report.pdf`, {
        contentType: 'application/pdf'
      });

      reportId = await new Promise((resolve, reject) => {
        pdfStream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', () => {
            fs.unlinkSync(tempPdfPath); // Cleanup temp file
            resolve(uploadStream.id);
          });
      });

      console.log(`   ✅ Created placeholder PDF with ID: ${reportId}`);
      uploadedCount += 1;
    }

    // Create week document
    const newWeek = new Week({
      weekNumber,
      summary: `Week ${weekNumber} activities and highlights from the CSP program.`,
      photos: photoIds,
      reportPdf: reportId.toString()
    });

    await newWeek.save();
    console.log(`   ✅ Created week document with ID: ${newWeek._id}`);
    if (typeof onUploadedFiles === 'function') {
      onUploadedFiles(uploadedCount);
    }
    console.log(); // Empty line for readability

    return true;

  } catch (error) {
    console.log(`   ❌ Failed to migrate ${weekDir}`);
    console.log(`   Error: ${error.message}`);
    console.log(); // Empty line for readability
    return false;
  }
};

// Extract week number from directory name
const extractWeekNumber = (weekDir) => {
  const match = weekDir.match(/week(\d+)/i);
  return match ? parseInt(match[1]) : 1;
};

// Get content type for file
const getContentType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf'
  };
  return contentTypes[ext] || 'application/octet-stream';
};

// Create a dummy PDF for weeks without reports
const createDummyPdf = (weekNumber) => {
  return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 120
>>
stream
BT
/F1 12 Tf
72 720 Td
(Week ${weekNumber} Report) Tj
0 -20 Td
(This is a placeholder report for Week ${weekNumber}) Tj
0 -20 Td
(Generated during GridFS migration) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
376
%%EOF`;
};

// Verify migration results
const verifyMigration = async (db) => {
  console.log('\n🔍 Verifying migration results...');
  
  try {
    // Check week documents
    const weekCount = await db.collection('weeks').countDocuments();
    console.log(`✅ Found ${weekCount} week documents`);

    // Check GridFS files
    const filesCount = await db.collection('uploads.files').countDocuments();
    const chunksCount = await db.collection('uploads.chunks').countDocuments();
    
    console.log(`✅ Found ${filesCount} files in GridFS`);
    console.log(`✅ Found ${chunksCount} chunks in GridFS`);

    // List week details
    const weeks = await db.collection('weeks').find({}).sort({ weekNumber: 1 }).toArray();
    console.log('\n📊 Migration Results:');
    weeks.forEach(week => {
      console.log(`   Week ${week.weekNumber}: ${week.photos.length} photos, ${week.reportPdf ? 'Report available' : 'No report'}`);
    });

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Available collections:', collections.map(c => c.name));

    console.log('\n🎯 Next Steps:');
    console.log('1. ✅ Check your MongoDB Atlas dashboard');
    console.log('2. ✅ Look for these collections:');
    console.log('   - weeks (contains week documents)');
    console.log('   - uploads.files (contains file metadata)');
    console.log('   - uploads.chunks (contains file chunks)');
    console.log('3. 🔄 Update your server to use native MongoDB GridFS');
    console.log('4. 🧪 Test the frontend components');
    
    if (weekCount > 0) {
      console.log('\n✨ Migration successful! You can now remove the /csp folder as files are stored in GridFS!');
    }

    return weekCount;
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
    return 0;
  }
};

// Run migration
migrateTinalToGridFS()
  .then(() => {
    console.log('\n🎉 Migration process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration process failed:', error);
    process.exit(1);
  });
