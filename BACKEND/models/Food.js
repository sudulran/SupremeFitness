const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Protein', 'Carbohydrate', 'Vegetable', 'Fruit', 'Dairy', 'Fat', 'Beverage', 'Snack']
  },
  servingSize: {
    amount: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
      enum: ['g', 'ml', 'cup', 'piece', 'tbsp', 'tsp', 'oz', 'scoop', 'slice']
    }
  },
  nutrition: {
    calories: {
      type: Number,
      required: [true, 'Calories are required'],
      min: 0
    },
    protein: {
      type: Number,
      required: true,
      min: 0
    },
    carbs: {
      type: Number,
      required: true,
      min: 0
    },
    fats: {
      type: Number,
      required: true,
      min: 0
    },
    fiber: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  description: {
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

// Index for search
foodSchema.index({ name: 'text', description: 'text' });
foodSchema.index({ category: 1 });

module.exports = mongoose.model('Food', foodSchema);
