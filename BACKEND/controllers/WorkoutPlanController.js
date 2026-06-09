const WorkoutPlan = require('../models/WorkoutPlan');
const Exercise = require('../models/Exercise');
const User = require('../models/userModel');

// @desc    Create workout plan
// @route   POST /api/workout-plans
// @access  Private (Trainer only)
const createWorkoutPlan = async (req, res) => {
  try {
    const {
      user,
      planName,
      goal,
      difficulty,
      exercises,
      frequency,
      duration,
      startDate,
      endDate,
      description,
      status,
    } = req.body;

    // Support both regular user tokens and admin tokens. authMiddleware sets
    // `req.admin` when an admin token is used and `req.user` for users.
    let currentUser = null;
    if (req.admin) {
      currentUser = req.admin; // already contains role
    } else if (req.user && req.user._id) {
      currentUser = await User.findById(req.user._id).select('role');
    }

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate trainer role
    if (currentUser.role !== 'trainer' && currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only trainers can create workout plans'
      });
    }

    // Validate exercises exist
    const exerciseIds = exercises.map(e => e.exercise);
    const validExercises = await Exercise.find({ _id: { $in: exerciseIds }, isActive: true });
    
    if (validExercises.length !== exerciseIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more exercises are invalid or inactive'
      });
    }

    // Create workout plan
    const workoutPlan = await WorkoutPlan.create({
      user,
      planName,
      goal,
      difficulty,
      exercises,
      frequency,
      duration,
      startDate,
      endDate,
      description,
      status,
    });

    const populatedPlan = await WorkoutPlan.findById(workoutPlan._id)
  .populate('user', 'name email role')
      .populate('exercises.exercise');

    res.status(201).json({
      success: true,
      message: 'Workout plan created successfully',
      data: populatedPlan
    });
  } catch (error) {
    console.error('Create workout plan error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create workout plan'
    });
  }
};

// @desc    Get all workout plans (with filters)
// @route   GET /api/workout-plans
// @access  Private
const getWorkoutPlans = async (req, res) => {
  try {
    const { user, goal, status, difficulty, page = 1, limit = 10, search } = req.query;

    // Support admin or regular user
    let currentUser = null;
    if (req.admin) {
      currentUser = req.admin;
    } else if (req.user && req.user._id) {
      currentUser = await User.findById(req.user._id).select('role');
    }

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const query = { isActive: true };

    // Filter by user if provided
    if (user) query.user = user;

    // If user is not trainer/admin, only show their plans
    if (currentUser.role === 'member') {
      query.user = currentUser._id;
    }

    // If user is trainer, show plans they created
    // Apply filters
    if (goal) query.goal = goal;
    if (status) query.status = status;
    if (difficulty) query.difficulty = difficulty;

    // Search by plan name
    if (search) {
      query.planName = { $regex: search, $options: 'i' };
    }

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const workoutPlans = await WorkoutPlan.find(query)
  .populate('user', 'name email role')
      .populate('exercises.exercise')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await WorkoutPlan.countDocuments(query);

    res.status(200).json({
      success: true,
      count: workoutPlans.length,
      total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      data: workoutPlans
    });
  } catch (error) {
    console.error('Get workout plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout plans'
    });
  }
};

// @desc    Get single workout plan
// @route   GET /api/workout-plans/:id
// @access  Private
const getWorkoutPlan = async (req, res) => {
  try {
    const workoutPlan = await WorkoutPlan.findById(req.params.id)
  .populate('user', 'name email role')
      .populate('exercises.exercise');

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    // Support admin or regular user
    let currentUser = null;
    if (req.admin) {
      currentUser = req.admin;
    } else if (req.user && req.user._id) {
      currentUser = await User.findById(req.user._id).select('role');
    }

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check authorization
    if (
      currentUser.role === 'member' &&
      workoutPlan.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this workout plan'
      });
    }

    res.status(200).json({
      success: true,
      data: workoutPlan
    });
  } catch (error) {
    console.error('Get workout plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout plan'
    });
  }
};

// @desc    Update workout plan
// @route   PUT /api/workout-plans/:id
// @access  Private (Trainer only)
const updateWorkoutPlan = async (req, res) => {
  try {
    let workoutPlan = await WorkoutPlan.findById(req.params.id);

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    // Support admin or regular user
    let currentUser = null;
    if (req.admin) {
      currentUser = req.admin;
    } else if (req.user && req.user._id) {
      currentUser = await User.findById(req.user._id).select('role');
    }

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (currentUser.role !== 'trainer' && currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only trainers can update workout plans'
      });
    }

    // Validate exercises if provided
    if (req.body.exercises) {
      const exerciseIds = req.body.exercises.map(e => e.exercise);
      const validExercises = await Exercise.find({ _id: { $in: exerciseIds }, isActive: true });
      
      if (validExercises.length !== exerciseIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more exercises are invalid or inactive'
        });
      }
    }

    workoutPlan = await WorkoutPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
  .populate('user', 'name email role')
      .populate('exercises.exercise');

    res.status(200).json({
      success: true,
      message: 'Workout plan updated successfully',
      data: workoutPlan
    });
  } catch (error) {
    console.error('Update workout plan error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update workout plan'
    });
  }
};

// @desc    Delete workout plan (soft delete)
// @route   DELETE /api/workout-plans/:id
// @access  Private (Trainer only)
const deleteWorkoutPlan = async (req, res) => {
  try {
    const workoutPlan = await WorkoutPlan.findById(req.params.id);

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    // Support admin or regular user
    let currentUser = null;
    if (req.admin) {
      currentUser = req.admin;
    } else if (req.user && req.user._id) {
      currentUser = await User.findById(req.user._id).select('role');
    }

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (currentUser.role !== 'trainer' && currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only trainers can delete workout plans'
      });
    }

    workoutPlan.isActive = false;
    await workoutPlan.save();

    res.status(200).json({
      success: true,
      message: 'Workout plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete workout plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workout plan'
    });
  }
};

// @desc    Get user's active workout plan
// @route   GET /api/workout-plans/user/:userId/active
// @access  Private
const getUserActiveWorkoutPlan = async (req, res) => {
  try {
    const userId = req.params.userId;

    const currentUser = await User.findById(req.user?._id).select('role');

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check authorization
    if (currentUser.role === 'member' && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const workoutPlan = await WorkoutPlan.findOne({
      user: userId,
      status: 'Active',
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    })
      .populate('exercises.exercise')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: workoutPlan
    });
  } catch (error) {
    console.error('Get active workout plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active workout plan'
    });
  }
};

module.exports = {
  createWorkoutPlan,
  getWorkoutPlans,
  getWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  getUserActiveWorkoutPlan
};


/*
const WorkoutPlan = require('../models/WorkoutPlan');
const Progress = require('../models/Progress');
const User = require('../models/userModel');
const axios = require('axios');

// Create workout plan (Trainer)
exports.createWorkoutPlan = async (req, res) => {
    try {
        const body = req.body;
        body.createdAt = new Date();

        const plan = new WorkoutPlan(body);
        await plan.save();

        res.status(201).json({ message: 'Workout plan created successfully', plan });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update workout plan
exports.updateWorkoutPlan = async (req, res) => {
    try {
        const plan = await WorkoutPlan.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if(!plan){
            return res.status(404).json({message: 'Plan not found or no changes made'});
        }

        res.json({ message: 'Workout plan updated successfully', plan });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete workout plan
exports.deleteWorkoutPlan = async (req, res) => {
    try {
        const deletedPlan = await WorkoutPlan.findByIdAndDelete(req.params.id);

        if(!deletedPlan){
            return res.status(404).json({message: 'Plan not found'});
        }

        res.json({ message: 'Workout plan deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all workout plans
exports.getUserWorkoutPlans = async (req, res) => {
    try {
        const plans = await WorkoutPlan.find()
        
        if (!plans || plans.length === 0) {
            console.log("No plans found in the database."); // Debugging log for empty results
            return res.status(404).json({ message: "No plans found" });
        }

        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get workout plans by id
exports.getWorkoutPlanById = async (req, res) => {
    try {
        const plan = await WorkoutPlan.findById(req.params.id);
        if (plan) {
            res.json(plan);
        } else {
            return res.status(404).json({ message: "Plan not found" });
        }
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};

/*
// Create workout plan (Trainer)
exports.createWorkoutPlan = async (req, res) => {
  try {
    const workoutPlan = new WorkoutPlan({
      ...req.body,
      trainerId: req.user.id
    });
    await workoutPlan.save();
    res.status(201).json({ message: 'Workout plan created successfully', workoutPlan });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get workout plans for user
exports.getUserWorkoutPlans = async (req, res) => {
  try {
    const plans = await WorkoutPlan.find({ userId: req.params.userId })
      .populate('trainerId', 'name email')
      .sort({ createdDate: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update workout plan
exports.updateWorkoutPlan = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ message: 'Workout plan updated successfully', plan });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete workout plan
exports.deleteWorkoutPlan = async (req, res) => {
  try {
    await WorkoutPlan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Workout plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
*/


///////////////////////////////////////////////////////////////////////

/*
//////////////////
// AI Generated Workout Plan
exports.generateAIWorkoutPlan = async (req, res) => {
  try {
    const { bodyType, currentWeight, height, goal, age, gender, duration } = req.body;
    
    // Calculate BMI
    const bmi = (currentWeight / ((height / 100) ** 2)).toFixed(2);
    
    // AI Prompt for workout plan
    const aiPrompt = `
      Create a ${duration}-week ${bodyType} workout plan for a ${age}-year-old ${gender} 
      with current weight ${currentWeight}kg, height ${height}cm, BMI ${bmi}, and goal: ${goal}.
      Provide specific exercises with sets, reps, and duration.
    `;

    // Call OpenAI API (you'll need to set up OpenAI API key)
    const aiResponse = await generateWithOpenAI(aiPrompt);
    
    const workoutPlan = new WorkoutPlan({
      userId: req.user.id,
      planName: `AI Generated ${bodyType} Plan`,
      goal,
      bodyType,
      duration,
      exercises: parseAIWorkoutResponse(aiResponse),
      isAIGenerated: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + duration * 7 * 24 * 60 * 60 * 1000)
    });

    await workoutPlan.save();
    res.json({ message: 'AI workout plan generated successfully', workoutPlan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Track workout progress
exports.trackWorkoutProgress = async (req, res) => {
  try {
    const { weight, height, caloriesBurned, workoutsCompleted, notes } = req.body;
    
    const progress = new Progress({
      userId: req.user.id,
      weight,
      height,
      caloriesBurned,
      workoutsCompleted,
      notes
    });

    await progress.save();
    res.json({ message: 'Progress tracked successfully', progress });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get user progress history
exports.getProgressHistory = async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.params.userId })
      .sort({ date: -1 });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper functions
async function generateWithOpenAI(prompt) {
  // Implement OpenAI API call
  // This is a placeholder - you'll need to set up actual OpenAI integration
  return "AI generated workout plan placeholder";
}

function parseAIWorkoutResponse(response) {
  // Parse AI response into exercise format
  return [
    { name: "Bench Press", sets: 3, reps: 10, duration: 30, calories: 200 },
    { name: "Squats", sets: 4, reps: 12, duration: 25, calories: 250 }
  ];
}
*/
