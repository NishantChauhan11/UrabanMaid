const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  helperID: { type: mongoose.Schema.Types.ObjectId, ref: 'Helper', required: true },
  bookingDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  duration: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  address: {
    street: String,
    area: String,
    city: String,
    pincode: String
  },
  specialInstructions: { type: String },
  status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'confirmed' },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', BookingSchema);
