const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxMembers: { type: Number, default: 50 }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);


