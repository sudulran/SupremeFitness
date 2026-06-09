const mongoose = require('mongoose');

const workoutSessionSchema = new mongoose.Schema({
  workoutPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutPlan'
  },
  date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  caloriesBurned: {
    type: Number,
    required: true
  },
  exercises: [{
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise'
    },
    setsCompleted: Number,
    repsCompleted: Number,
    durationCompleted: Number
  }],
  notes: String
}, { _id: true });

const bodyMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 20,
    max: 300
  },
  height: {
    type: Number,
    required: true,
    min: 50,
    max: 300
  },
  bmi: {
    type: Number
  },
  bodyFat: {
    type: Number,
    min: 0,
    max: 100
  },
  muscleMass: {
    type: Number,
    min: 0
  },
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    arms: Number,
    thighs: Number
  }
}, { _id: true });

const progressTrackingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  workoutSessions: [workoutSessionSchema],
  bodyMetrics: [bodyMetricsSchema],
  totalWorkouts: {
    type: Number,
    default: 0
  },
  totalCaloriesBurned: {
    type: Number,
    default: 0
  },
  totalWorkoutTime: {
    type: Number, // in minutes
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate BMI before saving
progressTrackingSchema.pre('save', function(next) {
  this.bodyMetrics.forEach(metric => {
    if (metric.weight && metric.height) {
      const heightInMeters = metric.height / 100;
      metric.bmi = parseFloat((metric.weight / (heightInMeters * heightInMeters)).toFixed(2));
    }
  });
  next();
});

progressTrackingSchema.index({ 'workoutSessions.date': -1 });

module.exports = mongoose.model('ProgressTracking', progressTrackingSchema);
