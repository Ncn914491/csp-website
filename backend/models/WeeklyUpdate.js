const mongoose = require('mongoose');

const WeeklyUpdateSchema = new mongoose.Schema({
  weekNumber: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  activities: {
    type: String,
    required: true
  },
  highlights: {
    type: String,
    required: true
  },
  gallery: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      default: ''
    }
  }],
  reportURL: {
    type: String,
    default: ''
  },
  summary: {
    type: String,
    default: ''
  },
  files: [{
    name: String,
    url: String,
    type: String
  }],
  pdfFiles: [{
    name: String,
    url: String
  }],
  // GridFS file references
  photos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fs.files'
  }],
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fs.files'
  }],
  reportPdf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fs.files'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WeeklyUpdate', WeeklyUpdateSchema);
