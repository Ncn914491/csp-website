const mongoose = require('mongoose');

const WeeklyUpdateSchema = new mongoose.Schema({
  weekNumber: {
    type: Number,
    required: true,
    unique: true
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
    type: String
  }],
  report: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WeeklyUpdate', WeeklyUpdateSchema);
