/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
  if (!mongoUri) {
    console.error('Missing MONGO_URI/MONGO_URL');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

  const Week = require('../models/weekModel');

  // Locate PDFs under public/csp (relative to backend)
  const publicDir = path.join(__dirname, '..', '..', 'public', 'csp');
  if (!fs.existsSync(publicDir)) {
    console.error(`Public CSP directory not found at ${publicDir}`);
    process.exit(1);
  }

  // Collect pdf files and derive week number e.g., week1_*.pdf or 1.pdf
  const allFiles = fs.readdirSync(publicDir);
  const pdfFiles = allFiles.filter(f => f.toLowerCase().endsWith('.pdf'));

  const weekToPdfPath = new Map();
  for (const file of pdfFiles) {
    const lower = file.toLowerCase();
    const match = lower.match(/week\s*([0-9]+)/) || lower.match(/^([0-9]+)\./);
    if (!match) continue;
    const weekNumber = parseInt(match[1], 10);
    if (Number.isNaN(weekNumber)) continue;
    // Prefer first match; do not overwrite existing mapping
    if (!weekToPdfPath.has(weekNumber)) {
      weekToPdfPath.set(weekNumber, path.join(publicDir, file));
    }
  }

  const report = { uploaded: [], linked: [], skipped: [] };

  for (const [weekNumber, pdfPath] of weekToPdfPath.entries()) {
    const week = await Week.findOne({ weekNumber });
    if (!week) {
      report.skipped.push({ weekNumber, reason: 'Week not found' });
      continue;
    }
    if (week.reportPdf) {
      report.skipped.push({ weekNumber, reason: 'reportPdf already set' });
      continue;
    }

    // Upload PDF to GridFS
    const uploadStream = bucket.openUploadStream(`${Date.now()}-${path.basename(pdfPath)}`, {
      contentType: 'application/pdf',
    });
    await new Promise((resolve, reject) => {
      fs.createReadStream(pdfPath)
        .on('error', reject)
        .pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    const fileId = uploadStream.id.toString();
    week.reportPdf = fileId;
    await week.save();
    report.uploaded.push({ weekNumber, fileId, filename: path.basename(pdfPath) });
    report.linked.push({ weekId: week._id.toString(), weekNumber, reportPdf: fileId });
  }

  console.log(JSON.stringify({ summary: report, foundPdfs: pdfFiles.length }, null, 2));
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Import failed:', err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});


