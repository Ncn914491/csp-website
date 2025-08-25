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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WeeklyUpdate', WeeklyUpdateSchema);
