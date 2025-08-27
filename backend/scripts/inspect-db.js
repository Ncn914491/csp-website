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

  // Lazy import models to use same connection
  const Week = require('../models/weekModel');
  const User = require('../models/User');

  const result = {
    connection: {
      ok: true,
      dbName: db.databaseName,
      uriHost: new URL(mongoUri).host,
    },
    counts: {},
    samples: {},
  };

  // Weeks
  const weekCount = await Week.countDocuments();
  const weekDocs = await Week.find({}).sort({ weekNumber: 1 }).limit(20).lean();
  result.counts.weeks = weekCount;
  result.samples.weeks = weekDocs.map(w => ({
    _id: w._id,
    weekNumber: w.weekNumber,
    summary: w.summary,
    photosCount: Array.isArray(w.photos) ? w.photos.length : 0,
    photos: Array.isArray(w.photos) ? w.photos : [],
    reportPdf: w.reportPdf || null,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }));

  // Users
  const userCount = await User.countDocuments();
  const userDocs = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).limit(20).lean();
  result.counts.users = userCount;
  result.samples.users = userDocs.map(u => ({
    _id: u._id,
    username: u.username,
    role: u.role,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));

  // GridFS buckets
  const filesColl = db.collection('uploads.files');
  const chunksColl = db.collection('uploads.chunks');
  const filesCount = await filesColl.countDocuments();
  const chunksCount = await chunksColl.countDocuments();
  const fileDocs = await filesColl.find({}).project({ filename: 1, contentType: 1, length: 1, uploadDate: 1 }).limit(50).toArray();
  result.counts.gridfs = { files: filesCount, chunks: chunksCount };
  result.samples.gridfsFiles = fileDocs.map(f => ({
    _id: f._id,
    filename: f.filename,
    contentType: f.contentType,
    length: f.length,
    uploadDate: f.uploadDate,
  }));

  // Cross-check: ensure week file IDs exist in GridFS
  const allIds = [];
  for (const w of weekDocs) {
    if (Array.isArray(w.photos)) allIds.push(...w.photos);
    if (w.reportPdf) allIds.push(w.reportPdf);
  }
  const uniqueIds = [...new Set(allIds)].filter(Boolean);
  const validObjectIds = uniqueIds
    .map(id => {
      try { return new mongoose.Types.ObjectId(id); } catch { return null; }
    })
    .filter(Boolean);
  const existingFiles = await filesColl.find({ _id: { $in: validObjectIds } }).project({ _id: 1 }).toArray();
  const existingIdSet = new Set(existingFiles.map(f => f._id.toString()));
  result.validation = {
    referencedFileIds: uniqueIds.length,
    existingFilesFound: existingIdSet.size,
    missingFileIds: uniqueIds.filter(id => !existingIdSet.has(id)).slice(0, 50),
  };

  console.log(JSON.stringify(result, null, 2));
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Inspection failed:', err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});


