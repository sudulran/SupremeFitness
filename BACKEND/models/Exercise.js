const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true,
    unique: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Cardio', 'Strength', 'Flexibility', 'Sports', 'Balance', 'HIIT'],
  },
  muscleGroup: {
    type: String,
    required: [true, 'Muscle group is required'],
    enum: ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Full Body', 'Upper Body', 'Lower Body', 'Cardio']
  },
  metValue: {
    type: Number,
    required: [true, 'MET value is required'],
    min: [0.5, 'MET value must be at least 0.5'],
    max: [20, 'MET value cannot exceed 20']
  },
  description: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  equipment: {
    type: String,
    enum: ['None', 'Dumbbells', 'Barbell', 'Machine', 'Cable', 'Resistance Band', 'Kettlebell', 'Other'],
    default: 'None'
  },
  instructions: {
    type: [String],
    default: []
  },
  videoUrl: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster search
exerciseSchema.index({ name: 'text', description: 'text' });
exerciseSchema.index({ category: 1, muscleGroup: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);
