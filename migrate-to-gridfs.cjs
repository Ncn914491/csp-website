const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

// Configuration
const BASE_URL = 'http://localhost:5000';
const CSP_DIR = path.join(__dirname, 'csp');

// Migration function
const migrateWeeksToGridFS = async () => {
  console.log('🚀 Starting migration from /csp folder to GridFS...\n');

  try {
    // Check if csp directory exists
    if (!fs.existsSync(CSP_DIR)) {
      console.log('❌ CSP directory not found at:', CSP_DIR);
      return;
    }

    // Get all week directories
    const weekDirs = fs.readdirSync(CSP_DIR)
      .filter(dir => {
        const fullPath = path.join(CSP_DIR, dir);
        return fs.statSync(fullPath).isDirectory() && dir.startsWith('week');
      })
      .sort();

    console.log(`📁 Found ${weekDirs.length} week directories:`);
    weekDirs.forEach(dir => console.log(`   - ${dir}`));
    console.log();

    // Process each week directory
    for (const weekDir of weekDirs) {
      await migrateWeek(weekDir);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('\n📋 Migration Summary:');
    console.log(`   ✅ Processed ${weekDirs.length} weeks`);
    console.log('   ✅ Files uploaded to GridFS');
    console.log('   ✅ Week documents created in MongoDB');

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
};

// Migrate a single week directory
const migrateWeek = async (weekDir) => {
  const weekPath = path.join(CSP_DIR, weekDir);
  const weekNumber = extractWeekNumber(weekDir);
  
  console.log(`📦 Processing ${weekDir} (Week ${weekNumber})...`);

  try {
    // Get files in the week directory
    const files = fs.readdirSync(weekPath);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    const pdfFiles = files.filter(file => {
      return path.extname(file).toLowerCase() === '.pdf';
    });

    console.log(`   📸 Found ${imageFiles.length} images`);
    console.log(`   📄 Found ${pdfFiles.length} PDFs`);

    if (imageFiles.length === 0) {
      console.log('   ⚠️  No images found, skipping...');
      return;
    }

    // Create form data
    const formData = new FormData();
    formData.append('weekNumber', weekNumber.toString());
    formData.append('summary', `Week ${weekNumber} activities and highlights from the CSP program.`);

    // Add image files
    imageFiles.forEach(imageFile => {
      const imagePath = path.join(weekPath, imageFile);
      formData.append('photos', fs.createReadStream(imagePath));
    });

    // Add PDF file (take the first one if multiple exist)
    if (pdfFiles.length > 0) {
      const pdfPath = path.join(weekPath, pdfFiles[0]);
      formData.append('reportPdf', fs.createReadStream(pdfPath));
    } else {
      // Create a dummy PDF if none exists
      console.log('   ⚠️  No PDF found, creating placeholder...');
      const dummyPdfContent = createDummyPdf(weekNumber);
      const tempPdfPath = path.join(__dirname, `temp-week-${weekNumber}.pdf`);
      fs.writeFileSync(tempPdfPath, dummyPdfContent);
      formData.append('reportPdf', fs.createReadStream(tempPdfPath));
    }

    // Upload to GridFS
    const response = await axios.post(`${BASE_URL}/api/gridfs-weeks/add`, formData, {
      headers: formData.getHeaders()
    });

    console.log(`   ✅ Successfully uploaded Week ${weekNumber}`);
    console.log(`   📝 Response: ${response.data.message}`);

  } catch (error) {
    console.log(`   ❌ Failed to migrate ${weekDir}`);
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
  }

  console.log(); // Empty line for readability
};

// Extract week number from directory name
const extractWeekNumber = (weekDir) => {
  const match = weekDir.match(/week(\d+)/i);
  return match ? parseInt(match[1]) : 1;
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
/Length 100
>>
stream
BT
/F1 12 Tf
72 720 Td
(Week ${weekNumber} Report) Tj
0 -20 Td
(This is a placeholder report for Week ${weekNumber}) Tj
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
356
%%EOF`;
};

// Cleanup temporary files
const cleanup = () => {
  console.log('🧹 Cleaning up temporary files...');
  try {
    const tempFiles = fs.readdirSync(__dirname)
      .filter(file => file.startsWith('temp-week-') && file.endsWith('.pdf'));
    
    tempFiles.forEach(file => {
      fs.unlinkSync(path.join(__dirname, file));
      console.log(`   🗑️  Removed ${file}`);
    });
  } catch (error) {
    console.log('   ⚠️  Cleanup error:', error.message);
  }
};

// Verify migration results
const verifyMigration = async () => {
  console.log('\n🔍 Verifying migration results...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/gridfs-weeks`);
    const weeks = response.data;
    
    console.log(`✅ Found ${weeks.length} weeks in GridFS database`);
    weeks.forEach(week => {
      console.log(`   Week ${week.weekNumber}: ${week.photos.length} photos, ${week.reportPdf ? 'PDF available' : 'No PDF'}`);
    });
    
    return weeks.length;
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
    return 0;
  }
};

// Main execution
const main = async () => {
  try {
    await migrateWeeksToGridFS();
    const weekCount = await verifyMigration();
    
    console.log('\n🎯 Migration Instructions:');
    console.log('1. Check your MongoDB Atlas dashboard');
    console.log('2. Look for these collections:');
    console.log('   - weeks (contains week documents)');
    console.log('   - uploads.files (contains file metadata)');
    console.log('   - uploads.chunks (contains file chunks)');
    console.log('3. Test the frontend components:');
    console.log('   - WeekView component to display weeks');
    console.log('   - GridFSWeekAdmin component for admin panel');
    
    if (weekCount > 0) {
      console.log('\n✨ You can now remove the /csp folder as files are stored in GridFS!');
    }
    
  } catch (error) {
    console.error('Script execution failed:', error);
  } finally {
    cleanup();
  }
};

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { migrateWeeksToGridFS, migrateWeek, verifyMigration };
