const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  experience: {
    type: Number, // years of experience
    required: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
  contact: {
    phone: String,
    email: String,
  },
  image: {
    data: Buffer,
    contentType: String, 
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Trainer', trainerSchema);
