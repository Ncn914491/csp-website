const mongoose = require("mongoose");

const weekSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true, unique: true },
  summary: { type: String, required: true },
  photos: [{ type: String }], // GridFS file IDs
  videos: [{ type: String }], // GridFS file IDs for videos
  reportPdf: { type: String } // GridFS file ID
}, {
  timestamps: true
});

module.exports = mongoose.model("Week", weekSchema);
