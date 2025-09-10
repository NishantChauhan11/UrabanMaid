const mongoose = require('mongoose');

const helperSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['maid', 'cook', 'babysitter', 'cleaner', 'plumber', 'electrician', 'gardener', 'driver']
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  availability: {
    type: String,
    enum: ['available', 'busy'],
    default: 'available'
  },
  location: {
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true
    }
  },
  imageURL: {
    type: String,
    default: 'https://via.placeholder.com/200x200?text=No+Image'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    min: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better search performance
helperSchema.index({ category: 1, availability: 1, 'location.city': 1 });

module.exports = mongoose.model('Helper', helperSchema);
