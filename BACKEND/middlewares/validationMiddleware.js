const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Workout Plan Validation
const validateWorkoutPlan = [
  body('user').notEmpty().withMessage('User is required').isMongoId().withMessage('Invalid user ID'),
  body('planName').notEmpty().withMessage('Plan name is required').trim().isLength({ min: 3, max: 100 }).withMessage('Plan name must be 3-100 characters'),
  body('goal').notEmpty().withMessage('Goal is required').isIn(['Weight Loss', 'Muscle Gain', 'Endurance', 'Strength', 'Flexibility', 'General Fitness']).withMessage('Invalid goal'),
  body('difficulty').notEmpty().withMessage('Difficulty is required').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid difficulty'),
  body('exercises').isArray({ min: 1 }).withMessage('At least one exercise is required'),
  body('exercises.*.exercise').notEmpty().withMessage('Exercise ID is required').isMongoId().withMessage('Invalid exercise ID'),
  body('exercises.*.sets').isInt({ min: 1 }).withMessage('Sets must be at least 1'),
  body('exercises.*.reps').isInt({ min: 1 }).withMessage('Reps must be at least 1'),
  body('exercises.*.order').isInt({ min: 1 }).withMessage('Order must be at least 1'),
  body('frequency').notEmpty().withMessage('Frequency is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 week'),
  body('startDate').notEmpty().withMessage('Start date is required').isISO8601().withMessage('Invalid start date'),
  body('endDate').notEmpty().withMessage('End date is required').isISO8601().withMessage('Invalid end date')
];

// Meal Plan Validation
const validateMealPlan = [
  body('user').notEmpty().withMessage('User is required').isMongoId().withMessage('Invalid user ID'),
  body('planName').notEmpty().withMessage('Plan name is required').trim().isLength({ min: 3, max: 100 }).withMessage('Plan name must be 3-100 characters'),
  body('goal').notEmpty().withMessage('Goal is required').isIn(['Weight Loss', 'Muscle Gain', 'Maintenance', 'Energy Boost', 'General Health']).withMessage('Invalid goal'),
  body('targetCalories').isInt({ min: 1000 }).withMessage('Target calories must be at least 1000'),
  body('meals').isArray({ min: 1 }).withMessage('At least one meal is required'),
  body('meals.*.mealType').notEmpty().withMessage('Meal type is required'),
  body('meals.*.time').notEmpty().withMessage('Meal time is required').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('meals.*.items').isArray({ min: 1 }).withMessage('At least one food item is required per meal'),
  body('meals.*.items.*.food').notEmpty().withMessage('Food ID is required').isMongoId().withMessage('Invalid food ID'),
  body('meals.*.items.*.quantity').isFloat({ min: 0.1 }).withMessage('Quantity must be positive'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 week'),
  body('startDate').notEmpty().withMessage('Start date is required').isISO8601().withMessage('Invalid start date'),
  body('endDate').notEmpty().withMessage('End date is required').isISO8601().withMessage('Invalid end date')
];

// Exercise Validation
const validateExercise = [
  body('name').notEmpty().withMessage('Exercise name is required').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('category').notEmpty().withMessage('Category is required').isIn(['Cardio', 'Strength', 'Flexibility', 'Sports', 'Balance', 'HIIT']).withMessage('Invalid category'),
  body('muscleGroup').notEmpty().withMessage('Muscle group is required').isIn(['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Cardio']).withMessage('Invalid muscle group'),
  body('metValue').isFloat({ min: 0.5, max: 20 }).withMessage('MET value must be between 0.5 and 20'),
  body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid difficulty'),
  body('equipment').optional().isIn(['None', 'Dumbbells', 'Barbell', 'Machine', 'Resistance Band', 'Kettlebell', 'Other']).withMessage('Invalid equipment')
];

// Food Validation
const validateFood = [
  body('name').notEmpty().withMessage('Food name is required').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('category').notEmpty().withMessage('Category is required').isIn(['Protein', 'Carbohydrate', 'Vegetable', 'Fruit', 'Dairy', 'Fat', 'Beverage', 'Snack']).withMessage('Invalid category'),
  body('servingSize.amount').isFloat({ min: 0.1 }).withMessage('Serving size amount must be positive'),
  body('servingSize.unit').notEmpty().withMessage('Serving size unit is required').isIn(['g', 'ml', 'cup', 'piece', 'tbsp', 'tsp']).withMessage('Invalid unit'),
  body('nutrition.calories').isFloat({ min: 0 }).withMessage('Calories must be non-negative'),
  body('nutrition.protein').isFloat({ min: 0 }).withMessage('Protein must be non-negative'),
  body('nutrition.carbs').isFloat({ min: 0 }).withMessage('Carbs must be non-negative'),
  body('nutrition.fats').isFloat({ min: 0 }).withMessage('Fats must be non-negative')
];

// Workout Session Validation
const validateWorkoutSession = [
  body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Invalid date'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('exercises').isArray({ min: 1 }).withMessage('At least one exercise is required'),
  body('exercises.*.exercise').notEmpty().withMessage('Exercise ID is required').isMongoId().withMessage('Invalid exercise ID')
];

// Body Metrics Validation
const validateBodyMetrics = [
  body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Invalid date'),
  body('weight').isFloat({ min: 20, max: 300 }).withMessage('Weight must be between 20 and 300 kg'),
  body('height').isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50 and 300 cm'),
  body('bodyFat').optional().isFloat({ min: 0, max: 100 }).withMessage('Body fat must be between 0 and 100%')
];

module.exports = {
  validate,
  validateWorkoutPlan,
  validateMealPlan,
  validateExercise,
  validateFood,
  validateWorkoutSession,
  validateBodyMetrics
};
