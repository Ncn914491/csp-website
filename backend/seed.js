const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const User = require('./models/User');
const SchoolVisit = require('./models/SchoolVisit');
const WeeklyUpdate = require('./models/WeeklyUpdate');
const Resource = require('./models/Resource');
const bcrypt = require('bcryptjs');

// Helpers
const imageExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const pdfExts = new Set(['.pdf']);

const exists = (p) => {
  try { return fs.existsSync(p); } catch { return false; }
};

const isDir = (p) => {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
};

const listFiles = (dir) => {
  try { return fs.readdirSync(dir).map((name) => path.join(dir, name)); } catch { return []; }
};

const listFilesRecursive = (dir) => {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(d); } catch { continue; }
    for (const name of entries) {
      const full = path.join(d, name);
      try {
        const st = fs.statSync(full);
        if (st.isDirectory()) stack.push(full);
        else out.push(full);
      } catch {}
    }
  }
  return out;
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error?.message || error);
    process.exit(1);
  }
};

(async () => {
  await connectDB();

  try {
    // Clear existing data
    await User.deleteMany({});
    await SchoolVisit.deleteMany({});
    await WeeklyUpdate.deleteMany({});
    await Resource.deleteMany({});

    // Create sample users
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const users = [
      {
        name: 'Admin User',
        email: 'admin@csp.com',
        password: hashedPassword,
        role: 'admin'
      },
      {
        name: 'Student User',
        email: 'student@csp.com',
        password: await bcrypt.hash('student123', 10),
        role: 'student'
      }
    ];
    await User.insertMany(users);

    const projectRoot = path.resolve(__dirname, '..');
    const publicDir = path.join(projectRoot, 'public');
    const cspDir = path.join(publicDir, 'csp');
    const photosDir = path.join(cspDir, 'photos');
    const reportsDir = path.join(cspDir, 'reports');

    const toWebPath = (absPath) => {
      let rel = absPath.replace(publicDir, '').replace(/\\/g, '/');
      if (!rel.startsWith('/')) rel = '/' + rel;
      return rel;
    };

    // Collect week folders if present (e.g., /public/csp/week1,...)
    let weekDirs = [];
    if (isDir(cspDir)) {
      weekDirs = listFiles(cspDir).filter((p) => isDir(p) && /week\d+/i.test(path.basename(p)));
      weekDirs.sort((a, b) => {
        const getN = (p) => parseInt((path.basename(p).match(/week(\d+)/i) || [])[1] || '0', 10);
        return getN(a) - getN(b);
      });
    }

    // Build SchoolVisits from photosDir or weekDirs
    const visitDocs = [];

    if (isDir(photosDir)) {
      // Flat photos folder: one visit with all images (or grouped by subfolders if present)
      const subdirs = listFiles(photosDir).filter(isDir);
      if (subdirs.length > 0) {
        for (const sub of subdirs) {
          const images = listFilesRecursive(sub)
            .filter((f) => imageExts.has(path.extname(f).toLowerCase()))
            .map(toWebPath);
          if (images.length) {
            const name = path.basename(sub);
            visitDocs.push({
              title: `School Visit - ${name}`,
              date: new Date(),
              description: `Auto-imported images from ${name}.`,
              images,
            });
          }
        }
      } else {
        const images = listFilesRecursive(photosDir)
          .filter((f) => imageExts.has(path.extname(f).toLowerCase()))
          .map(toWebPath);
        if (images.length) {
          visitDocs.push({
            title: 'School Visit - Photos',
            date: new Date(),
            description: 'Auto-imported images from csp/photos.',
            images,
          });
        }
      }
    } else if (weekDirs.length) {
      // One visit per week folder, images inside each
      for (const wdir of weekDirs) {
        const weekName = path.basename(wdir); // e.g., week1
        const images = listFilesRecursive(wdir)
          .filter((f) => imageExts.has(path.extname(f).toLowerCase()))
          .map(toWebPath);
        if (images.length) {
          const weekNum = parseInt((weekName.match(/week(\d+)/i) || [])[1] || '0', 10);
          visitDocs.push({
            title: `CSP Week ${weekNum} - School Visit`,
            date: new Date(),
            description: `Auto-imported images for ${weekName}.`,
            images,
          });
        }
      }
    }

    // Build Resources from reportsDir or PDFs under week folders, plus career.pdf if present
    const resourceDocs = [];

    const addPdfResource = (absPath) => {
      const web = toWebPath(absPath);
      const base = path.basename(absPath);
      const weekMatch = absPath.toLowerCase().match(/week(\d+)/);
      const title = weekMatch
        ? `CSP Week ${parseInt(weekMatch[1], 10)} Report`
        : base.replace(/_/g, ' ').replace(/\.[^.]+$/, '');
      resourceDocs.push({
        title,
        type: 'PDF',
        url: web,
        tags: weekMatch ? [`week${parseInt(weekMatch[1], 10)}`, 'report'] : ['report'],
      });
    };

    if (isDir(reportsDir)) {
      const pdfs = listFilesRecursive(reportsDir).filter((f) => pdfExts.has(path.extname(f).toLowerCase()));
      pdfs.forEach(addPdfResource);
    } else if (weekDirs.length) {
      for (const wdir of weekDirs) {
        const pdfs = listFilesRecursive(wdir).filter((f) => pdfExts.has(path.extname(f).toLowerCase()));
        pdfs.forEach(addPdfResource);
      }
    }

    const careerPdf = path.join(publicDir, 'career.pdf');
    if (exists(careerPdf)) addPdfResource(careerPdf);

    // Weekly updates: from week numbers if available, otherwise sample 3 weeks
    const weekUpdates = [];
    let weekNumbers = weekDirs
      .map((d) => parseInt(((path.basename(d).match(/week(\d+)/i) || [])[1] || '0'), 10))
      .filter((n) => !Number.isNaN(n));
    if (weekNumbers.length === 0) {
      weekNumbers = [1, 2, 3];
    }

    for (const wn of weekNumbers) {
      const weekDir = weekDirs.find(d => {
        const num = parseInt((path.basename(d).match(/week(\d+)/i) || [])[1] || '0', 10);
        return num === wn;
      });
      
      let gallery = [];
      let report = null;
      
      if (weekDir) {
        // Get images for gallery
        gallery = listFilesRecursive(weekDir)
          .filter(f => imageExts.has(path.extname(f).toLowerCase()))
          .map(toWebPath);
        
        // Get PDF report
        const pdf = listFilesRecursive(weekDir)
          .find(f => pdfExts.has(path.extname(f).toLowerCase()));
        if (pdf) report = toWebPath(pdf);
      }
      
      weekUpdates.push({
        weekNumber: wn,
        activities: `Week ${wn} activities included school visits, career guidance sessions, and interactive workshops with students.`,
        highlights: `Key achievements in week ${wn}: Enhanced student engagement, successful career counseling sessions, and positive feedback from faculty.`,
        gallery,
        report
      });
    }

    // Insert data
    if (visitDocs.length) await SchoolVisit.insertMany(visitDocs);
    if (weekUpdates.length) await WeeklyUpdate.insertMany(weekUpdates);
    if (resourceDocs.length) await Resource.insertMany(resourceDocs);

    console.log('✅ Database seeded successfully!');
    console.log(`👤 ${users.length} users added`);
    console.log(`📚 ${visitDocs.length} school visits added`);
    console.log(`📅 ${weekUpdates.length} weekly updates added`);
    console.log(`📄 ${resourceDocs.length} resources added`);
  } catch (error) {
    console.error('❌ Seeding error:', error?.message || error);
  } finally {
    await mongoose.connection.close();
  }
})();
