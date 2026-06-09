const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.1, 'Quantity must be positive']
  },
  unit: {
    type: String,
    required: true,
    enum: ['g', 'ml', 'cup', 'piece', 'tbsp', 'tsp', 'oz', 'scoop', 'slice']
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const mealSchema = new mongoose.Schema({
  mealType: {
    type: String,
    required: true,
    enum: ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack']
  },
  time: {
    type: String, // Format: "HH:MM"
    required: true
  },
  items: [mealItemSchema],
  instructions: {
    type: String,
    trim: true
  }
}, { _id: true });

const mealPlanSchema = new mongoose.Schema({
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
    enum: ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Energy Boost', 'General Health']
  },
  targetCalories: {
    type: Number,
    required: [true, 'Target calories is required'],
    min: [1000, 'Target calories must be at least 1000']
  },
  meals: [mealSchema],
  duration: {
    type: Number, // duration in weeks
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
  dietType: {
    type: String,
    enum: ['Regular', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Low Carb', 'High Protein'],
    default: 'Regular'
  },
  restrictions: {
    type: [String],
    default: []
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

// Validate end date
mealPlanSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Index
mealPlanSchema.index({ user: 1, status: 1 });
mealPlanSchema.index({ goal: 1 });

module.exports = mongoose.model('MealPlan', mealPlanSchema);

/*
const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  mealType: { 
    type: String, 
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true 
  },
  foodName: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fats: { type: Number, required: true },
  quantity: { type: String, required: true } // grams/servings
});

const mealPlanSchema = new mongoose.Schema({
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
  dailyCalories: { type: Number, required: true },
  goal: { 
    type: String, 
    enum: ['weight_loss', 'muscle_gain', 'maintenance'],
    required: true 
  },
  meals: [mealItemSchema],
  isAIGenerated: { type: Boolean, default: false },
  duration: { type: Number, required: true }, // in weeks
  createdDate: { type: Date, default: Date.now },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
});

module.exports = mongoose.model('MealPlan', mealPlanSchema);
*/
