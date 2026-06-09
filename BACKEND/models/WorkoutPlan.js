const mongoose = require('mongoose');

const workoutExerciseSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  sets: {
    type: Number,
    required: [true, 'Number of sets is required'],
    min: [1, 'Sets must be at least 1']
  },
  reps: {
    type: Number,
    required: [true, 'Number of reps is required'],
    min: [1, 'Reps must be at least 1']
  },
  duration: {
    type: Number, // in minutes
    min: 0
  },
  restTime: {
    type: Number, // in seconds
    default: 60
  },
  notes: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true
  }
}, { _id: true });

const workoutPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  planName: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true
  },
  goal: {
    type: String,
    required: [true, 'Goal is required'],
    enum: ['Weight Loss', 'Muscle Gain', 'Endurance', 'Strength', 'Flexibility', 'General Fitness']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  exercises: [workoutExerciseSchema],
  frequency: {
    type: String,
    required: true,
    enum: ['Daily', '3 times/week', '4 times/week', '5 times/week', '6 times/week']
  },
  duration: {
    type: Number, // total plan duration in weeks
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 week']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled', 'Paused'],
    default: 'Active'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Validate end date is after start date
workoutPlanSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Index for efficient queries
workoutPlanSchema.index({ user: 1, status: 1 });
workoutPlanSchema.index({ goal: 1 });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);

/*
const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: Number, required: true },
  reps: { type: Number, required: true },
  durationMin: { type: Number }, // in minutes
  metValue: { type: Number }
});

const workoutPlanSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  trainerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  planName: { type: String, required: true },
  goal: { 
    type: String, 
    enum: ['weight_loss', 'muscle_gain', 'endurance', 'maintenance'],
    required: true 
  },
  bodyType: {
    type: String,
    enum: ['bulk', 'lean', 'toned', 'athletic'],
    required: true
  },
  duration: { type: Number, required: true }, // in weeks
  exercises: [exerciseSchema],
  isAIGenerated: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'paused'], 
    default: 'active' 
  },
  createdDate: { type: Date, default: Date.now },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
});

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
*/
