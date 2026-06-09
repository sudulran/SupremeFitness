const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot',
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  clientContact: {
    phone: String,
    email: String
  },
  status: {
    type: String,
    enum: ['pending', 'cancelled', 'confirmed', 'completed'],
    default: 'pending',
  },
  date: {
    type: Date,
    required: true, 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
