const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // optional
  },
  payment: {
    type: Number,
    required: true, // stored in dollars
  },
  card_holder: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[A-Z\s]+$/i.test(v); // letters and spaces only
      },
      message: 'Card holder name should contain only letters and spaces.',
    },
  },
  card_number: {
    type: String,
    required: true, // masked like "**** **** **** 4242"
    validate: {
      validator: function (v) {
        return /^(\*{4}\s){3}\d{4}$/.test(v); // e.g., **** **** **** 4242
      },
      message: 'Card number must be masked as "**** **** **** 4242"',
    },
  },
  exp_date: {
    type: String,
    required: true, // format MM/YYYY
  },
  stripePaymentIntentId: {
    type: String,
    required: false,
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

module.exports = mongoose.model('Payment', paymentSchema);
