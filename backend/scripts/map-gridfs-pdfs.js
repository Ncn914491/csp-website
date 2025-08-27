/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
  if (!mongoUri) {
    console.error('Missing MONGO_URI/MONGO_URL');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const filesColl = db.collection('uploads.files');

  const Week = require('../models/weekModel');

  // Fetch PDFs from GridFS
  const pdfs = await filesColl.find({ contentType: { $regex: '^application/pdf' } }).project({ _id: 1, filename: 1 }).toArray();

  // Build weekNumber -> ObjectId mapping by filename heuristics
  const weekToFileId = new Map();
  for (const f of pdfs) {
    const lower = String(f.filename || '').toLowerCase();
    const m = lower.match(/week\s*([0-9]+)/);
    if (!m) continue;
    const weekNumber = parseInt(m[1], 10);
    if (Number.isNaN(weekNumber)) continue;
    // Prefer first seen; do not overwrite
    if (!weekToFileId.has(weekNumber)) {
      weekToFileId.set(weekNumber, f._id.toString());
    }
  }

  const report = { linked: [], skipped: [], candidates: pdfs.length };

  for (const [weekNumber, fileId] of weekToFileId.entries()) {
    const week = await Week.findOne({ weekNumber });
    if (!week) {
      report.skipped.push({ weekNumber, reason: 'Week not found' });
      continue;
    }
    if (week.reportPdf) {
      report.skipped.push({ weekNumber, reason: 'reportPdf already set' });
      continue;
    }
    week.reportPdf = fileId;
    await week.save();
    report.linked.push({ weekId: week._id.toString(), weekNumber, reportPdf: fileId });
  }

  console.log(JSON.stringify({ summary: report }, null, 2));
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Mapping failed:', err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});


