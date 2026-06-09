const mongoose = require('mongoose');
const Exercise = require('../models/Exercise');
const Food = require('../models/Food');
const dotenv = require('dotenv');
dotenv.config();

/**
 * EXERCISES
 */
const ALLOWED_EQUIPMENT = new Set(['None', 'Dumbbells', 'Barbell', 'Machine', 'Cable', 'Resistance Band', 'Kettlebell', 'Other']);

const EQUIPMENT_MAP = {
  'Smith Machine': 'Machine',
  Bodyweight: 'None',
  'Medicine Ball': 'Other',
  'TRX': 'Other',
  'Cable Machine': 'Machine',
  'Row Machine': 'Machine',
  'Kettlebell Swing': 'Kettlebell',
  'Bar': 'Barbell'
};

const normaliseEquipment = (value = 'None') => {
  const mapped = EQUIPMENT_MAP[value] || value;
  return ALLOWED_EQUIPMENT.has(mapped) ? mapped : 'Other';
};

const exercises = [
  // Cardio (Gym machines)
  { name: 'Treadmill Running (8 km/h)', category: 'Cardio', muscleGroup: 'Cardio', metValue: 8.3, difficulty: 'Intermediate', equipment: 'Machine', description: 'Steady-pace run on treadmill' },
  { name: 'Treadmill Jogging (6 km/h)', category: 'Cardio', muscleGroup: 'Cardio', metValue: 6.0, difficulty: 'Beginner', equipment: 'Machine', description: 'Light jog on treadmill' },
  { name: 'Stationary Bike (Moderate)', category: 'Cardio', muscleGroup: 'Cardio', metValue: 6.8, difficulty: 'Beginner', equipment: 'Machine', description: 'Moderate-intensity cycling on upright bike' },
  { name: 'Rowing Machine (Moderate)', category: 'Cardio', muscleGroup: 'Full Body', metValue: 7.0, difficulty: 'Intermediate', equipment: 'Machine', description: 'Steady rowing focusing on drive and recovery' },
  { name: 'Stair Climber', category: 'Cardio', muscleGroup: 'Legs', metValue: 8.8, difficulty: 'Intermediate', equipment: 'Machine', description: 'Continuous climbing intervals' },
  { name: 'Elliptical (Intervals)', category: 'Cardio', muscleGroup: 'Cardio', metValue: 6.0, difficulty: 'Beginner', equipment: 'Machine', description: 'Work/rest intervals on elliptical' },
  { name: 'Treadmill Incline Walk (8–12%)', category: 'Cardio', muscleGroup: 'Cardio', metValue: 4.8, difficulty: 'Beginner', equipment: 'Machine', description: 'Brisk incline walking for steady burn' },
  { name: 'Rowing Machine (Sprints)', category: 'Cardio', muscleGroup: 'Full Body', metValue: 9.0, difficulty: 'Intermediate', equipment: 'Machine', description: 'Short, powerful rowing sprints' },
  { name: 'Upright Bike (HIIT)', category: 'Cardio', muscleGroup: 'Cardio', metValue: 8.0, difficulty: 'Intermediate', equipment: 'Machine', description: 'All-out bike intervals' },
  { name: 'Stair Climber (Intervals)', category: 'Cardio', muscleGroup: 'Legs', metValue: 9.0, difficulty: 'Intermediate', equipment: 'Machine', description: 'Fast steps with short rests' },
  
  // Chest
  { name: 'Barbell Bench Press', category: 'Strength', muscleGroup: 'Chest', metValue: 6.0, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Compound chest press on flat bench' },
  { name: 'Dumbbell Bench Press', category: 'Strength', muscleGroup: 'Chest', metValue: 6.0, difficulty: 'Intermediate', equipment: 'Dumbbells', description: 'Flat bench press using dumbbells' },
  { name: 'Incline Bench Press', category: 'Strength', muscleGroup: 'Chest', metValue: 6.5, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Upper chest emphasis on incline bench' },
  { name: 'Cable Chest Fly', category: 'Strength', muscleGroup: 'Chest', metValue: 5.5, difficulty: 'Intermediate', equipment: 'Cable', description: 'Chest isolation with standing cable fly' },
  { name: 'Push-ups', category: 'Strength', muscleGroup: 'Chest', metValue: 3.8, difficulty: 'Beginner', equipment: 'None', description: 'Bodyweight chest press' },
  { name: 'Incline Dumbbell Press', category: 'Strength', muscleGroup: 'Chest', metValue: 6.2, difficulty: 'Intermediate', equipment: 'Dumbbells', description: 'Upper-chest focused pressing' },
  { name: 'Decline Barbell Bench Press', category: 'Strength', muscleGroup: 'Chest', metValue: 6.2, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Lower-chest emphasis press' },
  { name: 'Pec Deck Machine', category: 'Strength', muscleGroup: 'Chest', metValue: 5.0, difficulty: 'Beginner', equipment: 'Machine', description: 'Chest fly on machine for isolation' },
  { name: 'Cable Low-to-High Fly', category: 'Strength', muscleGroup: 'Chest', metValue: 5.2, difficulty: 'Intermediate', equipment: 'Cable', description: 'Cable fly angled upward' },
  { name: 'Smith Machine Bench Press', category: 'Strength', muscleGroup: 'Chest', metValue: 5.8, difficulty: 'Beginner', equipment: 'Smith Machine', description: 'Guided bar path chest press' },

  // Back
  { name: 'Conventional Deadlift', category: 'Strength', muscleGroup: 'Back', metValue: 6.0, difficulty: 'Advanced', equipment: 'Barbell', description: 'Full posterior-chain pull from floor' },
  { name: 'Bent-over Barbell Row', category: 'Strength', muscleGroup: 'Back', metValue: 6.0, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Horizontal row with hip hinge' },
  { name: 'Lat Pulldown', category: 'Strength', muscleGroup: 'Back', metValue: 5.0, difficulty: 'Beginner', equipment: 'Machine', description: 'Vertical pull for lats' },
  { name: 'Seated Cable Row', category: 'Strength', muscleGroup: 'Back', metValue: 5.5, difficulty: 'Beginner', equipment: 'Cable', description: 'Controlled row for mid-back' },
  { name: 'Pull-ups', category: 'Strength', muscleGroup: 'Back', metValue: 8.0, difficulty: 'Advanced', equipment: 'None', description: 'Bodyweight vertical pulling' },
  { name: 'T-Bar Row', category: 'Strength', muscleGroup: 'Back', metValue: 6.0, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Chest-supported or landmine row' },
  { name: 'Chest-Supported Row (Machine)', category: 'Strength', muscleGroup: 'Back', metValue: 5.8, difficulty: 'Beginner', equipment: 'Machine', description: 'Supported horizontal pulling' },
  { name: 'Single-Arm Dumbbell Row', category: 'Strength', muscleGroup: 'Back', metValue: 5.5, difficulty: 'Beginner', equipment: 'Dumbbells', description: 'Unilateral row for lats' },
  { name: 'Straight-Arm Cable Pulldown', category: 'Strength', muscleGroup: 'Back', metValue: 5.0, difficulty: 'Beginner', equipment: 'Cable', description: 'Lat isolation with straight arms' },
  { name: 'Rack Pull', category: 'Strength', muscleGroup: 'Back', metValue: 6.0, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Partial deadlift from pins or rack' },

  // Legs
  { name: 'Back Squat', category: 'Strength', muscleGroup: 'Legs', metValue: 5.5, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Compound squat with bar on back' },
  { name: 'Front Squat', category: 'Strength', muscleGroup: 'Legs', metValue: 5.8, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Quad-emphasis squat with front rack' },
  { name: 'Leg Press', category: 'Strength', muscleGroup: 'Legs', metValue: 6.0, difficulty: 'Beginner', equipment: 'Machine', description: 'Machine-based compound leg press' },
  { name: 'Romanian Deadlift', category: 'Strength', muscleGroup: 'Legs', metValue: 6.0, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Hip hinge targeting hamstrings' },
  { name: 'Dumbbell Walking Lunges', category: 'Strength', muscleGroup: 'Legs', metValue: 5.0, difficulty: 'Intermediate', equipment: 'Dumbbells', description: 'Alternating forward lunges while walking' },
  { name: 'Hack Squat (Machine)', category: 'Strength', muscleGroup: 'Legs', metValue: 5.8, difficulty: 'Beginner', equipment: 'Machine', description: 'Quad-focused machine squat' },
  { name: 'Bulgarian Split Squat', category: 'Strength', muscleGroup: 'Legs', metValue: 5.5, difficulty: 'Intermediate', equipment: 'Dumbbells', description: 'Rear-foot elevated split squat' },
  { name: 'Leg Extension', category: 'Strength', muscleGroup: 'Legs', metValue: 4.5, difficulty: 'Beginner', equipment: 'Machine', description: 'Quad isolation knee extension' },
  { name: 'Seated Leg Curl', category: 'Strength', muscleGroup: 'Legs', metValue: 4.5, difficulty: 'Beginner', equipment: 'Machine', description: 'Hamstring isolation curl' },
  { name: 'Standing Calf Raise', category: 'Strength', muscleGroup: 'Legs', metValue: 4.0, difficulty: 'Beginner', equipment: 'Machine', description: 'Gastrocnemius-focused calf raise' },
  { name: 'Hip Thrust (Barbell)', category: 'Strength', muscleGroup: 'Legs', metValue: 5.5, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Glute-dominant hip extension' },
  { name: 'Trap Bar Deadlift', category: 'Strength', muscleGroup: 'Legs', metValue: 6.0, difficulty: 'Intermediate', equipment: 'Other', description: 'Neutral-grip deadlift with hex bar' },

  // Shoulders
  { name: 'Overhead Barbell Press', category: 'Strength', muscleGroup: 'Shoulders', metValue: 6.2, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Standing strict press' },
  { name: 'Dumbbell Shoulder Press', category: 'Strength', muscleGroup: 'Shoulders', metValue: 6.0, difficulty: 'Intermediate', equipment: 'Dumbbells', description: 'Seated or standing overhead press' },
  { name: 'Lateral Raise', category: 'Strength', muscleGroup: 'Shoulders', metValue: 5.0, difficulty: 'Beginner', equipment: 'Dumbbells', description: 'Medial delt isolation' },
  { name: 'Rear Delt Fly (Machine/Cable)', category: 'Strength', muscleGroup: 'Shoulders', metValue: 4.8, difficulty: 'Beginner', equipment: 'Machine', description: 'Posterior delt isolation' },
  { name: 'Arnold Press', category: 'Strength', muscleGroup: 'Shoulders', metValue: 6.2, difficulty: 'Intermediate', equipment: 'Dumbbells', description: 'Rotational overhead press for delts' },
  { name: 'Machine Shoulder Press', category: 'Strength', muscleGroup: 'Shoulders', metValue: 5.8, difficulty: 'Beginner', equipment: 'Machine', description: 'Guided overhead press' },
  { name: 'Cable Lateral Raise', category: 'Strength', muscleGroup: 'Shoulders', metValue: 5.0, difficulty: 'Beginner', equipment: 'Cable', description: 'Deltoid isolation with constant tension' },
  { name: 'Upright Row (EZ-Bar)', category: 'Strength', muscleGroup: 'Shoulders', metValue: 5.2, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Vertical pull for traps/delts' },
  { name: 'Face Pull (Rope)', category: 'Strength', muscleGroup: 'Shoulders', metValue: 4.8, difficulty: 'Beginner', equipment: 'Cable', description: 'Rear delt and rotator cuff focus' },
  { name: 'Landmine Press', category: 'Strength', muscleGroup: 'Shoulders', metValue: 5.5, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Angled single-arm press with landmine' },

  // Biceps
  { name: 'Barbell Curl', category: 'Strength', muscleGroup: 'Biceps', metValue: 4.5, difficulty: 'Beginner', equipment: 'Barbell', description: 'Standing biceps curl with bar' },
  { name: 'Hammer Curl', category: 'Strength', muscleGroup: 'Biceps', metValue: 4.0, difficulty: 'Beginner', equipment: 'Dumbbells', description: 'Neutral-grip curl targeting brachialis' },
  { name: 'Preacher Curl (Machine)', category: 'Strength', muscleGroup: 'Biceps', metValue: 4.2, difficulty: 'Beginner', equipment: 'Machine', description: 'Supported curl for strict form' },
  { name: 'Cable Biceps Curl', category: 'Strength', muscleGroup: 'Biceps', metValue: 4.2, difficulty: 'Beginner', equipment: 'Cable', description: 'Constant-tension curls on cable stack' },
  { name: 'Incline Dumbbell Curl', category: 'Strength', muscleGroup: 'Biceps', metValue: 4.5, difficulty: 'Intermediate', equipment: 'Dumbbells', description: 'Curl on incline bench for long head' },
  { name: 'EZ-Bar Curl', category: 'Strength', muscleGroup: 'Biceps', metValue: 4.5, difficulty: 'Beginner', equipment: 'Barbell', description: 'Comfortable-grip bar curl' },
  { name: 'Concentration Curl', category: 'Strength', muscleGroup: 'Biceps', metValue: 4.2, difficulty: 'Beginner', equipment: 'Dumbbells', description: 'Seated, elbow braced on thigh' },
  { name: 'Spider Curl', category: 'Strength', muscleGroup: 'Biceps', metValue: 4.3, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Prone curl on incline bench' },
  { name: 'Cable Rope Hammer Curl', category: 'Strength', muscleGroup: 'Biceps', metValue: 4.2, difficulty: 'Beginner', equipment: 'Cable', description: 'Neutral-grip rope hammer curl' },
  { name: 'Preacher Curl (Barbell)', category: 'Strength', muscleGroup: 'Biceps', metValue: 4.3, difficulty: 'Beginner', equipment: 'Barbell', description: 'Strict curl on preacher bench' },

  // Triceps
  { name: 'Tricep Dips', category: 'Strength', muscleGroup: 'Triceps', metValue: 4.0, difficulty: 'Intermediate', equipment: 'None', description: 'Bodyweight dips for triceps' },
  { name: 'Cable Tricep Pushdown', category: 'Strength', muscleGroup: 'Triceps', metValue: 4.2, difficulty: 'Beginner', equipment: 'Cable', description: 'Straight bar or rope pushdowns' },
  { name: 'Overhead Triceps Extension', category: 'Strength', muscleGroup: 'Triceps', metValue: 4.2, difficulty: 'Beginner', equipment: 'Dumbbells', description: 'Single or double DB overhead extension' },
  { name: 'Close-Grip Bench Press', category: 'Strength', muscleGroup: 'Triceps', metValue: 5.5, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Narrow grip to emphasize triceps' },
  { name: 'Skull Crushers (EZ-Bar)', category: 'Strength', muscleGroup: 'Triceps', metValue: 4.8, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Lying triceps extensions' },
  { name: 'Rope Overhead Triceps Extension', category: 'Strength', muscleGroup: 'Triceps', metValue: 4.2, difficulty: 'Beginner', equipment: 'Cable', description: 'Standing overhead rope extension' },
  { name: 'EZ-Bar Skull Crushers', category: 'Strength', muscleGroup: 'Triceps', metValue: 4.8, difficulty: 'Intermediate', equipment: 'Barbell', description: 'Lying extension to forehead' },
  { name: 'Bench Dips (Weighted)', category: 'Strength', muscleGroup: 'Triceps', metValue: 4.5, difficulty: 'Intermediate', equipment: 'Other', description: 'Feet elevated, optional plate on lap' },
  { name: 'Reverse-Grip Triceps Pushdown', category: 'Strength', muscleGroup: 'Triceps', metValue: 4.2, difficulty: 'Beginner', equipment: 'Cable', description: 'Underhand cable press-down' },
  { name: 'Close-Grip Push-ups', category: 'Strength', muscleGroup: 'Triceps', metValue: 4.0, difficulty: 'Beginner', equipment: 'None', description: 'Diamond/close hand position' },

  // Core
  { name: 'Plank', category: 'Strength', muscleGroup: 'Core', metValue: 4.0, difficulty: 'Beginner', equipment: 'None', description: 'Isometric core stabilization' },
  { name: 'Hanging Leg Raise', category: 'Strength', muscleGroup: 'Core', metValue: 4.5, difficulty: 'Intermediate', equipment: 'None', description: 'Hip flexion from bar hang' },
  { name: 'Cable Woodchoppers', category: 'Strength', muscleGroup: 'Core', metValue: 4.2, difficulty: 'Intermediate', equipment: 'Cable', description: 'Rotational anti-rotation training' },
  { name: 'Ab Wheel Rollout', category: 'Strength', muscleGroup: 'Core', metValue: 5.0, difficulty: 'Advanced', equipment: 'Other', description: 'Rollouts with ab wheel from knees/toes' },
  { name: 'Bicycle Crunches', category: 'Strength', muscleGroup: 'Core', metValue: 3.8, difficulty: 'Beginner', equipment: 'None', description: 'Alternating elbow-to-knee crunch' },

  // HIIT (Gym-friendly)
  { name: 'Burpees', category: 'HIIT', muscleGroup: 'Full Body', metValue: 8.0, difficulty: 'Advanced', equipment: 'None', description: 'Full-body explosive conditioning' },
  { name: 'Battle Ropes (Intervals)', category: 'HIIT', muscleGroup: 'Upper Body', metValue: 7.0, difficulty: 'Intermediate', equipment: 'Other', description: '30–60 sec intervals of slams/waves' },
  { name: 'Box Jumps', category: 'HIIT', muscleGroup: 'Lower Body', metValue: 8.0, difficulty: 'Advanced', equipment: 'Other', description: 'Explosive jumps onto plyo box' },
  { name: 'Kettlebell Swings', category: 'HIIT', muscleGroup: 'Full Body', metValue: 7.5, difficulty: 'Intermediate', equipment: 'Kettlebell', description: 'Hip-dominant swings for power' },
  { name: 'Assault Bike Sprints', category: 'HIIT', muscleGroup: 'Full Body', metValue: 11.0, difficulty: 'Advanced', equipment: 'Machine', description: 'All-out intervals on air bike' },
];

/**
 * FOODS
 */
const foods = [
  // Proteins
  { name: 'Chicken Breast', category: 'Protein', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0 }, description: 'Lean protein source' },
  { name: 'Salmon', category: 'Protein', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 208, protein: 20, carbs: 0, fats: 13, fiber: 0 }, description: 'Rich in omega-3' },
  { name: 'Eggs', category: 'Protein', servingSize: { amount: 1, unit: 'piece' }, nutrition: { calories: 72, protein: 6.3, carbs: 0.4, fats: 4.8, fiber: 0 }, description: 'Complete protein' },
  { name: 'Tuna', category: 'Protein', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 132, protein: 28, carbs: 0, fats: 1.3, fiber: 0 }, description: 'Lean fish protein' },
  { name: 'Lean Beef', category: 'Protein', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 250, protein: 26, carbs: 0, fats: 15, fiber: 0 }, description: 'Red meat protein' },
  { name: 'Tofu', category: 'Protein', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 76, protein: 8, carbs: 1.9, fats: 4.8, fiber: 0.3 }, description: 'Plant-based protein' },
  { name: 'Turkey Breast', category: 'Protein', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 135, protein: 29, carbs: 0, fats: 1, fiber: 0 }, description: 'Very lean poultry' },
  { name: 'Prawns', category: 'Protein', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 99, protein: 24, carbs: 0.2, fats: 0.3, fiber: 0 }, description: 'Lean seafood' },
  { name: 'Cottage Cheese', category: 'Protein', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 98, protein: 11, carbs: 3.4, fats: 4.3, fiber: 0 }, description: 'Casein-rich dairy' },
  { name: 'Chickpeas (Boiled)', category: 'Protein', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 164, protein: 8.9, carbs: 27.4, fats: 2.6, fiber: 7.6 }, description: 'Legume protein & fiber' },
  { name: 'Lentils (Boiled)', category: 'Protein', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 116, protein: 9, carbs: 20, fats: 0.4, fiber: 7.9 }, description: 'Legume protein & fiber' },
  { name: 'Whey Protein', category: 'Protein', servingSize: { amount: 1, unit: 'scoop' }, nutrition: { calories: 120, protein: 24, carbs: 3, fats: 1.5, fiber: 0 }, description: 'Fast-digesting protein powder' },

  // Carbohydrates
  { name: 'Brown Rice', category: 'Carbohydrate', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 111, protein: 2.6, carbs: 23, fats: 0.9, fiber: 1.8 }, description: 'Whole grain' },
  { name: 'Oatmeal', category: 'Carbohydrate', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 71, protein: 2.5, carbs: 12, fats: 1.5, fiber: 1.7 }, description: 'Heart-healthy grain' },
  { name: 'Sweet Potato', category: 'Carbohydrate', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 86, protein: 1.6, carbs: 20, fats: 0.1, fiber: 3 }, description: 'Complex carb' },
  { name: 'Quinoa', category: 'Carbohydrate', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 120, protein: 4.4, carbs: 21, fats: 1.9, fiber: 2.8 }, description: 'Complete protein grain' },
  { name: 'Whole Wheat Bread', category: 'Carbohydrate', servingSize: { amount: 1, unit: 'piece' }, nutrition: { calories: 69, protein: 3.6, carbs: 11.6, fats: 0.9, fiber: 1.9 }, description: 'Whole grain bread' },
  { name: 'Pasta', category: 'Carbohydrate', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 131, protein: 5, carbs: 25, fats: 1.1, fiber: 1.8 }, description: 'Italian staple' },
  { name: 'White Rice (Cooked)', category: 'Carbohydrate', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 130, protein: 2.4, carbs: 28, fats: 0.3, fiber: 0.4 }, description: 'Quick-digesting carb' },
  { name: 'Multigrain Bread', category: 'Carbohydrate', servingSize: { amount: 1, unit: 'slice' }, nutrition: { calories: 69, protein: 3.5, carbs: 12, fats: 1, fiber: 2 }, description: 'Mixed grains bread' },
  { name: 'Couscous (Cooked)', category: 'Carbohydrate', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 112, protein: 3.8, carbs: 23.2, fats: 0.2, fiber: 1.4 }, description: 'Semolina-based carb' },
  { name: 'Barley (Cooked)', category: 'Carbohydrate', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 123, protein: 2.3, carbs: 28.2, fats: 0.4, fiber: 3.8 }, description: 'High-fiber grain' },

  // Vegetables
  { name: 'Broccoli', category: 'Vegetable', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 34, protein: 2.8, carbs: 7, fats: 0.4, fiber: 2.6 }, description: 'Cruciferous vegetable' },
  { name: 'Spinach', category: 'Vegetable', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, fiber: 2.2 }, description: 'Leafy green' },
  { name: 'Carrots', category: 'Vegetable', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 41, protein: 0.9, carbs: 10, fats: 0.2, fiber: 2.8 }, description: 'Root vegetable' },
  { name: 'Bell Peppers', category: 'Vegetable', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 20, protein: 0.9, carbs: 4.6, fats: 0.2, fiber: 1.7 }, description: 'Colorful vegetable' },
  { name: 'Tomatoes', category: 'Vegetable', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2, fiber: 1.2 }, description: 'Versatile vegetable' },
  { name: 'Kale', category: 'Vegetable', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 49, protein: 4.3, carbs: 8.8, fats: 0.9, fiber: 3.6 }, description: 'Nutrient-dense leafy green' },
  { name: 'Cauliflower', category: 'Vegetable', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 25, protein: 1.9, carbs: 5, fats: 0.3, fiber: 2 }, description: 'Low-calorie crucifer' },
  { name: 'Green Beans', category: 'Vegetable', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 31, protein: 1.8, carbs: 7, fats: 0.1, fiber: 3.4 }, description: 'Fiber-rich veg' },
  { name: 'Cucumber', category: 'Vegetable', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 16, protein: 0.7, carbs: 3.6, fats: 0.1, fiber: 0.5 }, description: 'Hydrating veg' },
  { name: 'Zucchini', category: 'Vegetable', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 17, protein: 1.2, carbs: 3.1, fats: 0.3, fiber: 1, }, description: 'Low-calorie squash' },

  // Fruits
  { name: 'Banana', category: 'Fruit', servingSize: { amount: 1, unit: 'piece' }, nutrition: { calories: 89, protein: 1.1, carbs: 23, fats: 0.3, fiber: 2.6 }, description: 'Potassium-rich fruit' },
  { name: 'Apple', category: 'Fruit', servingSize: { amount: 1, unit: 'piece' }, nutrition: { calories: 52, protein: 0.3, carbs: 14, fats: 0.2, fiber: 2.4 }, description: 'Fiber-rich fruit' },
  { name: 'Blueberries', category: 'Fruit', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 57, protein: 0.7, carbs: 14, fats: 0.3, fiber: 2.4 }, description: 'Antioxidant-rich' },
  { name: 'Strawberries', category: 'Fruit', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 32, protein: 0.7, carbs: 7.7, fats: 0.3, fiber: 2 }, description: 'Vitamin C rich' },
  { name: 'Orange', category: 'Fruit', servingSize: { amount: 1, unit: 'piece' }, nutrition: { calories: 47, protein: 0.9, carbs: 12, fats: 0.1, fiber: 2.4 }, description: 'Citrus fruit' },
  { name: 'Pineapple', category: 'Fruit', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 50, protein: 0.5, carbs: 13, fats: 0.1, fiber: 1.4 }, description: 'Tropical fruit' },
  { name: 'Mango', category: 'Fruit', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 60, protein: 0.8, carbs: 15, fats: 0.4, fiber: 1.6 }, description: 'Tropical, vitamin A/C' },
  { name: 'Pear', category: 'Fruit', servingSize: { amount: 1, unit: 'piece' }, nutrition: { calories: 101, protein: 0.6, carbs: 27, fats: 0.3, fiber: 5.5 }, description: 'High-fiber fruit' },
  { name: 'Grapes', category: 'Fruit', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 69, protein: 0.7, carbs: 18, fats: 0.2, fiber: 0.9 }, description: 'Convenient snack fruit' },
  { name: 'Watermelon', category: 'Fruit', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 30, protein: 0.6, carbs: 7.6, fats: 0.2, fiber: 0.4 }, description: 'Hydrating fruit' },

  // Fats
  { name: 'Avocado', category: 'Fat', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 160, protein: 2, carbs: 8.5, fats: 14.7, fiber: 6.7 }, description: 'Healthy fats' },
  { name: 'Almonds', category: 'Fat', servingSize: { amount: 28, unit: 'g' }, nutrition: { calories: 164, protein: 6, carbs: 6, fats: 14, fiber: 3.5 }, description: 'Nut snack' },
  { name: 'Olive Oil', category: 'Fat', servingSize: { amount: 1, unit: 'tbsp' }, nutrition: { calories: 119, protein: 0, carbs: 0, fats: 13.5, fiber: 0 }, description: 'Cooking oil' },
  { name: 'Peanut Butter', category: 'Fat', servingSize: { amount: 2, unit: 'tbsp' }, nutrition: { calories: 188, protein: 8, carbs: 7, fats: 16, fiber: 2 }, description: 'Nut butter' },
  { name: 'Walnuts', category: 'Fat', servingSize: { amount: 28, unit: 'g' }, nutrition: { calories: 185, protein: 4.3, carbs: 3.9, fats: 18.5, fiber: 1.9 }, description: 'Omega-3 rich nuts' },
  { name: 'Chia Seeds', category: 'Fat', servingSize: { amount: 28, unit: 'g' }, nutrition: { calories: 138, protein: 4.7, carbs: 12, fats: 8.7, fiber: 9.8 }, description: 'Seeds high in fiber' },
  { name: 'Flaxseed Oil', category: 'Fat', servingSize: { amount: 1, unit: 'tbsp' }, nutrition: { calories: 120, protein: 0, carbs: 0, fats: 13.6, fiber: 0 }, description: 'ALA omega-3 oil' },
  { name: 'Cashews', category: 'Fat', servingSize: { amount: 28, unit: 'g' }, nutrition: { calories: 157, protein: 5.2, carbs: 8.6, fats: 12.4, fiber: 0.9 }, description: 'Buttery nuts' },
  { name: 'Ghee', category: 'Fat', servingSize: { amount: 1, unit: 'tbsp' }, nutrition: { calories: 112, protein: 0, carbs: 0, fats: 12.7, fiber: 0 }, description: 'Clarified butter' },

  // Dairy
  { name: 'Milk (Whole)', category: 'Dairy', servingSize: { amount: 1, unit: 'cup' }, nutrition: { calories: 149, protein: 7.7, carbs: 11.7, fats: 8, fiber: 0 }, description: 'Dairy beverage' },
  { name: 'Cheese', category: 'Dairy', servingSize: { amount: 28, unit: 'g' }, nutrition: { calories: 113, protein: 7, carbs: 0.4, fats: 9, fiber: 0 }, description: 'Dairy product' },
  { name: 'Skim Milk', category: 'Dairy', servingSize: { amount: 1, unit: 'cup' }, nutrition: { calories: 83, protein: 8.3, carbs: 12.5, fats: 0.2, fiber: 0 }, description: 'Low-fat milk' },
  { name: 'Low-Fat Yogurt', category: 'Dairy', servingSize: { amount: 170, unit: 'g' }, nutrition: { calories: 145, protein: 13, carbs: 17, fats: 3.5, fiber: 0 }, description: 'Probiotic dairy' },
  { name: 'Paneer', category: 'Dairy', servingSize: { amount: 100, unit: 'g' }, nutrition: { calories: 321, protein: 21, carbs: 3.6, fats: 25, fiber: 0 }, description: 'Fresh cheese (cottage style)' },

  // Beverages
  { name: 'Water', category: 'Beverage', servingSize: { amount: 1, unit: 'cup' }, nutrition: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }, description: 'Essential hydration' },
  { name: 'Green Tea', category: 'Beverage', servingSize: { amount: 1, unit: 'cup' }, nutrition: { calories: 2, protein: 0, carbs: 0, fats: 0, fiber: 0 }, description: 'Antioxidant beverage' },
  { name: 'Protein Shake', category: 'Beverage', servingSize: { amount: 1, unit: 'cup' }, nutrition: { calories: 120, protein: 24, carbs: 3, fats: 1.5, fiber: 0 }, description: 'Protein supplement' },
  { name: 'Black Coffee', category: 'Beverage', servingSize: { amount: 1, unit: 'cup' }, nutrition: { calories: 2, protein: 0.3, carbs: 0, fats: 0, fiber: 0 }, description: 'Caffeinated beverage' },
  { name: 'Coconut Water (Unsweetened)', category: 'Beverage', servingSize: { amount: 240, unit: 'ml' }, nutrition: { calories: 44, protein: 0.7, carbs: 10.4, fats: 0, fiber: 0 }, description: 'Natural electrolytes' },
];

/**
 * Seed script
 */
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Clear existing data
    await Exercise.deleteMany({});
    await Food.deleteMany({});
    console.log('Cleared existing data');

    // Insert exercises
    const preparedExercises = exercises.map(exercise => ({
      ...exercise,
      equipment: normaliseEquipment(exercise.equipment)
    }));

    await Exercise.insertMany(preparedExercises);
    console.log(`${exercises.length} exercises seeded`);

    // Insert foods
    await Food.insertMany(foods);
    console.log(`${foods.length} foods seeded`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

