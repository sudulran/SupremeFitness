const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactNumber: { 
    type: String, 
    required: [true, 'Contact number is required'],
    validate: {
      validator: function(v) {
        return /^0\d{9}$/.test(v);
      },
      message: 'Contact number must start with 0 and contain exactly 10 digits'
    }
  },
  gender: { 
    type: String, 
    required: [true, 'Gender is required'],
    enum: ['male', 'female']
  },
  age: { 
    type: Number, 
    required: [true, 'Age is required'],
    min: [1, 'Age must be at least 1'],
    max: [100, 'Age cannot exceed 100']
  },
  height: {
    type: Number,
    min: [50, 'Height must be at least 50cm'],
    max: [250, 'Height cannot exceed 250cm'],
    default: null
  },
  weight: {
    type: Number,
    min: [20, 'Weight must be at least 20kg'],
    max: [300, 'Weight cannot exceed 300kg'],
    default: null
  },
  membershipType: { 
    type: String, 
    required: [true, 'Membership type is required'],
    enum: ['monthly', '3months', '6months', 'annual']
  },
  paymentReceipt: { 
    type: String, 
    required: [true, 'Payment receipt is required']
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'expired'], 
    default: 'pending' 
  },
  membershipStartDate: {
    type: Date,
    default: null
  },
  membershipEndDate: {
    type: Date,
    default: null
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Calculate membership end date based on type
userSchema.methods.calculateMembershipEndDate = function() {
  const startDate = this.membershipStartDate || new Date();
  const durationMap = {
    'monthly': 30, // 30 days
    '3months': 90, // 90 days
    '6months': 180, // 180 days
    'annual': 365 // 365 days
  };
  
  const days = durationMap[this.membershipType] || 30;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);
  
  return endDate;
};

// Check if membership is expired
userSchema.methods.isMembershipExpired = function() {
  if (!this.membershipEndDate) return true;
  return new Date() > this.membershipEndDate;
};

// Check if membership is expiring soon (within 7 days)
userSchema.methods.isExpiringSoon = function() {
  if (!this.membershipEndDate) return false;
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  return this.membershipEndDate <= sevenDaysFromNow && this.membershipEndDate > new Date();
};

// Virtual for days until expiration
userSchema.virtual('daysUntilExpiration').get(function() {
  if (!this.membershipEndDate) return null;
  const now = new Date();
  const diffTime = this.membershipEndDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ paymentStatus: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ membershipEndDate: 1 }); // For efficient expiration queries
userSchema.index({ paymentStatus: 1, membershipEndDate: 1 }); // For dashboard queries

module.exports = mongoose.models.User || mongoose.model('User', userSchema);