
const Exercise = require('../models/Exercise');
const Food = require('../models/Food');
const WorkoutPlan = require('../models/WorkoutPlan');
const MealPlan = require('../models/MealPlan');

// Helper function to calculate BMI
const calculateBMI = (weight, height) => {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

// Helper function to calculate BMR (Basal Metabolic Rate)
const calculateBMR = (weight, height, age, gender) => {
  // Using Mifflin-St Jeor Equation
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

// Helper function to calculate TDEE (Total Daily Energy Expenditure)
const calculateTDEE = (bmr, activityLevel) => {
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  return bmr * (activityMultipliers[activityLevel] || 1.55);
};

// @desc    Generate AI workout plan
// @route   POST /api/ai-plans/workout
// @access  Private
const generateAIWorkoutPlan = async (req, res) => {
  try {
    const {
      age,
      weight,
      height,
      gender,
      fitnessLevel,
      goal,
      daysPerWeek,
      duration
    } = req.body;

    const userId = req.user._id;

    // Validate inputs
    if (!age || !weight || !height || !gender || !fitnessLevel || !goal) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Calculate BMI
    const bmi = calculateBMI(weight, height);

    // Determine difficulty based on fitness level
    let difficulty;
    if (fitnessLevel === 'beginner') difficulty = 'Beginner';
    else if (fitnessLevel === 'intermediate') difficulty = 'Intermediate';
    else difficulty = 'Advanced';

    // Select exercises based on goal and difficulty
    let selectedExercises = [];

    if (goal === 'Weight Loss') {
      // More cardio and HIIT
      const cardio = await Exercise.find({ 
        category: { $in: ['Cardio', 'HIIT'] }, 
        difficulty: { $in: ['Beginner', difficulty] },
        isActive: true 
      }).limit(4);
      
      const strength = await Exercise.find({ 
        category: 'Strength',
        difficulty: { $in: ['Beginner', difficulty] },
        isActive: true 
      }).limit(3);

      selectedExercises = [...cardio, ...strength];
    } else if (goal === 'Muscle Gain') {
      // More strength training
      const chest = await Exercise.find({ 
        muscleGroup: 'Chest', 
        difficulty: { $in: ['Beginner', difficulty] },
        isActive: true 
      }).limit(2);
      
      const back = await Exercise.find({ 
        muscleGroup: 'Back',
        difficulty: { $in: ['Beginner', difficulty] },
        isActive: true 
      }).limit(2);
      
      const legs = await Exercise.find({ 
        muscleGroup: 'Legs',
        difficulty: { $in: ['Beginner', difficulty] },
        isActive: true 
      }).limit(2);
      
      const arms = await Exercise.find({ 
        muscleGroup: 'Arms',
        difficulty: { $in: ['Beginner', difficulty] },
        isActive: true 
      }).limit(1);

      selectedExercises = [...chest, ...back, ...legs, ...arms];
    } else if (goal === 'Endurance') {
      // More cardio
      const cardio = await Exercise.find({ 
        category: 'Cardio',
        difficulty: { $in: ['Beginner', difficulty] },
        isActive: true 
      }).limit(5);
      
      const core = await Exercise.find({ 
        muscleGroup: 'Core',
        difficulty: { $in: ['Beginner', difficulty] },
        isActive: true 
      }).limit(2);

      selectedExercises = [...cardio, ...core];
    } else {
      // General Fitness - balanced
      const cardio = await Exercise.find({ 
        category: 'Cardio',
        difficulty: { $in: ['Beginner', difficulty] },
        isActive: true 
      }).limit(2);
      
      const strength = await Exercise.find({ 
        category: 'Strength',
        difficulty: { $in: ['Beginner', difficulty] },
        isActive: true 
      }).limit(4);
      
      const flexibility = await Exercise.find({ 
        category: 'Flexibility',
        isActive: true 
      }).limit(1);

      selectedExercises = [...cardio, ...strength, ...flexibility];
    }

    // Build workout plan exercises with sets and reps
    const workoutExercises = selectedExercises.map((exercise, index) => {
      let sets, reps, duration;

      if (exercise.category === 'Cardio' || exercise.category === 'HIIT') {
        sets = 1;
        reps = 1;
        duration = fitnessLevel === 'beginner' ? 15 : fitnessLevel === 'intermediate' ? 20 : 30;
      } else if (exercise.category === 'Flexibility') {
        sets = 1;
        reps = 1;
        duration = 10;
      } else {
        // Strength exercises
        if (goal === 'Muscle Gain') {
          sets = fitnessLevel === 'beginner' ? 3 : 4;
          reps = fitnessLevel === 'beginner' ? 8 : 10;
        } else if (goal === 'Endurance') {
          sets = 3;
          reps = 15;
        } else {
          sets = 3;
          reps = 12;
        }
        duration = 0;
      }

      return {
        exercise: exercise._id,
        sets,
        reps,
        duration,
        restTime: fitnessLevel === 'beginner' ? 90 : 60,
        order: index + 1
      };
    });

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (duration || 4) * 7);

    // Determine frequency
    let frequency;
    if (daysPerWeek === 3) frequency = '3 times/week';
    else if (daysPerWeek === 4) frequency = '4 times/week';
    else if (daysPerWeek === 5) frequency = '5 times/week';
    else if (daysPerWeek === 6) frequency = '6 times/week';
    else frequency = '3 times/week';

    // Create AI-generated plan
    const workoutPlan = await WorkoutPlan.create({
      user: userId,
      trainer: userId, // Self-generated
      planName: `AI Generated ${goal} Plan`,
      goal,
      difficulty,
      exercises: workoutExercises,
      frequency,
      duration: duration || 4,
      startDate,
      endDate,
      description: `AI-generated workout plan based on your profile: Age ${age}, BMI ${bmi.toFixed(1)}, Fitness Level: ${fitnessLevel}`
    });

    const populatedPlan = await WorkoutPlan.findById(workoutPlan._id)
      .populate('exercises.exercise');

    res.status(201).json({
      success: true,
      message: 'AI workout plan generated successfully',
      data: populatedPlan,
      insights: {
        bmi: bmi.toFixed(1),
        bmiCategory: bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese',
        recommendedDuration: `${duration || 4} weeks`,
        totalExercises: workoutExercises.length
      }
    });
  } catch (error) {
    console.error('Generate AI workout plan error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate AI workout plan'
    });
  }
};

// @desc    Generate AI meal plan
// @route   POST /api/ai-plans/meal
// @access  Private
const generateAIMealPlan = async (req, res) => {
  try {
    const {
      age,
      weight,
      height,
      gender,
      activityLevel,
      goal,
      dietType,
      duration
    } = req.body;

    const userId = req.user._id;

    // Validate inputs
    if (!age || !weight || !height || !gender || !activityLevel || !goal) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Calculate BMR and TDEE
    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activityLevel);

    // Adjust calories based on goal
    let targetCalories;
    if (goal === 'Weight Loss') {
      targetCalories = Math.round(tdee - 500); // 500 calorie deficit
    } else if (goal === 'Muscle Gain') {
      targetCalories = Math.round(tdee + 300); // 300 calorie surplus
    } else {
      targetCalories = Math.round(tdee); // Maintenance
    }

    // Calculate macros
    let proteinGrams, carbsGrams, fatsGrams;

    if (goal === 'Muscle Gain') {
      proteinGrams = weight * 2; // 2g per kg
      fatsGrams = (targetCalories * 0.25) / 9; // 25% of calories
      carbsGrams = (targetCalories - (proteinGrams * 4) - (fatsGrams * 9)) / 4;
    } else if (goal === 'Weight Loss') {
      proteinGrams = weight * 1.8; // 1.8g per kg
      fatsGrams = (targetCalories * 0.30) / 9; // 30% of calories
      carbsGrams = (targetCalories - (proteinGrams * 4) - (fatsGrams * 9)) / 4;
    } else {
      proteinGrams = weight * 1.5; // 1.5g per kg
      fatsGrams = (targetCalories * 0.25) / 9; // 25% of calories
      carbsGrams = (targetCalories - (proteinGrams * 4) - (fatsGrams * 9)) / 4;
    }

    // Select foods based on diet type
    let query = { isActive: true };
    if (dietType === 'Vegetarian') {
      query.category = { $nin: ['Protein'] }; // Exclude meat
    } else if (dietType === 'Vegan') {
      query.category = { $nin: ['Protein', 'Dairy'] }; // Exclude meat and dairy
    }

    const proteins = await Food.find({ ...query, category: 'Protein' }).limit(5);
    const carbs = await Food.find({ ...query, category: 'Carbohydrate' }).limit(5);
    const vegetables = await Food.find({ category: 'Vegetable', isActive: true }).limit(5);
    const fruits = await Food.find({ category: 'Fruit', isActive: true }).limit(3);
    const fats = await Food.find({ ...query, category: 'Fat' }).limit(3);

    // Build meals
    const meals = [
      {
        mealType: 'Breakfast',
        time: '07:00',
        items: [
          { food: carbs[0]?._id, quantity: 50, unit: 'g', notes: 'Cooked' },
          { food: proteins[0]?._id, quantity: 2, unit: 'piece', notes: '' },
          { food: fruits[0]?._id, quantity: 1, unit: 'piece', notes: '' }
        ],
        instructions: 'Start your day with a balanced breakfast'
      },
      {
        mealType: 'Mid-Morning Snack',
        time: '10:00',
        items: [
          { food: fruits[1]?._id, quantity: 1, unit: 'piece', notes: '' },
          { food: fats[0]?._id, quantity: 15, unit: 'g', notes: '' }
        ],
        instructions: 'Light snack to maintain energy'
      },
      {
        mealType: 'Lunch',
        time: '13:00',
        items: [
          { food: proteins[1]?._id, quantity: 150, unit: 'g', notes: 'Grilled' },
          { food: carbs[1]?._id, quantity: 100, unit: 'g', notes: 'Cooked' },
          { food: vegetables[0]?._id, quantity: 100, unit: 'g', notes: 'Steamed' }
        ],
        instructions: 'Main meal with protein, carbs, and vegetables'
      },
      {
        mealType: 'Afternoon Snack',
        time: '16:00',
        items: [
          { food: fats[1]?._id, quantity: 28, unit: 'g', notes: '' }
        ],
        instructions: 'Healthy fats for sustained energy'
      },
      {
        mealType: 'Dinner',
        time: '19:00',
        items: [
          { food: proteins[2]?._id, quantity: 150, unit: 'g', notes: 'Cooked' },
          { food: vegetables[1]?._id, quantity: 150, unit: 'g', notes: 'Mixed' },
          { food: carbs[2]?._id, quantity: 80, unit: 'g', notes: 'Cooked' }
        ],
        instructions: 'Lighter dinner to aid digestion'
      }
    ];

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (duration || 4) * 7);

    // Create AI-generated meal plan
    const mealPlan = await MealPlan.create({
      user: userId,
      trainer: userId, // Self-generated
      planName: `AI Generated ${goal} Meal Plan`,
      goal,
      targetCalories,
      meals,
      duration: duration || 4,
      startDate,
      endDate,
      dietType: dietType || 'Regular',
      description: `AI-generated meal plan: ${targetCalories} calories/day, ${proteinGrams.toFixed(0)}g protein, ${carbsGrams.toFixed(0)}g carbs, ${fatsGrams.toFixed(0)}g fats`
    });

    const populatedPlan = await MealPlan.findById(mealPlan._id)
      .populate('meals.items.food');

    res.status(201).json({
      success: true,
      message: 'AI meal plan generated successfully',
      data: populatedPlan,
      insights: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories,
        macros: {
          protein: Math.round(proteinGrams),
          carbs: Math.round(carbsGrams),
          fats: Math.round(fatsGrams)
        },
        calorieAdjustment: goal === 'Weight Loss' ? '-500 cal' : goal === 'Muscle Gain' ? '+300 cal' : 'Maintenance'
      }
    });
  } catch (error) {
    console.error('Generate AI meal plan error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate AI meal plan'
    });
  }
};

module.exports = {
  generateAIWorkoutPlan,
  generateAIMealPlan
};
