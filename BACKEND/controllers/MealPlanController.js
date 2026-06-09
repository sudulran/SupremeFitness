const MealPlan = require('../models/MealPlan');
const Food = require('../models/Food');
const User = require('../models/userModel');

// @desc    Create meal plan
// @route   POST /api/meal-plans
// @access  Private (Trainer only)
const createMealPlan = async (req, res) => {
  try {
    const {
      user,
      planName,
      goal,
      targetCalories,
      meals,
      duration,
      startDate,
      endDate,
      dietType,
      restrictions,
      description,
      status
    } = req.body;

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

    // Validate trainer role
    if (currentUser.role !== 'trainer' && currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only trainers can create meal plans'
      });
    }

    // Validate foods exist
    const foodIds = meals.flatMap(meal => meal.items.map(item => item.food));
    const validFoods = await Food.find({ _id: { $in: foodIds }, isActive: true });
    
    if (validFoods.length !== foodIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more food items are invalid or inactive'
      });
    }

    // Create meal plan
    const mealPlan = await MealPlan.create({
      user,
      planName,
      goal,
      targetCalories,
      meals,
      duration,
      startDate,
      endDate,
      dietType,
      restrictions,
      description,
      status
    });

    const populatedPlan = await MealPlan.findById(mealPlan._id)
  .populate('user', 'name email role')
      .populate('meals.items.food');

    res.status(201).json({
      success: true,
      message: 'Meal plan created successfully',
      data: populatedPlan
    });
  } catch (error) {
    console.error('Create meal plan error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create meal plan'
    });
  }
};

// @desc    Get all meal plans (with filters)
// @route   GET /api/meal-plans
// @access  Private
const getMealPlans = async (req, res) => {
  try {
    const { user, goal, status, dietType, page = 1, limit = 10, search } = req.query;

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

    // Apply filters
    if (goal) query.goal = goal;
    if (status) query.status = status;
    if (dietType) query.dietType = dietType;

    // Search by plan name
    if (search) {
      query.planName = { $regex: search, $options: 'i' };
    }

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const mealPlans = await MealPlan.find(query)
  .populate('user', 'name email role')
      .populate('meals.items.food')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await MealPlan.countDocuments(query);

    res.status(200).json({
      success: true,
      count: mealPlans.length,
      total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      data: mealPlans
    });
  } catch (error) {
    console.error('Get meal plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal plans'
    });
  }
};

// @desc    Get single meal plan
// @route   GET /api/meal-plans/:id
// @access  Private
const getMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id)
  .populate('user', 'name email role')
      .populate('meals.items.food');

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
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
      mealPlan.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this meal plan'
      });
    }

    res.status(200).json({
      success: true,
      data: mealPlan
    });
  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal plan'
    });
  }
};

// @desc    Update meal plan
// @route   PUT /api/meal-plans/:id
// @access  Private (Trainer only)
const updateMealPlan = async (req, res) => {
  try {
    let mealPlan = await MealPlan.findById(req.params.id);

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
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
        message: 'Only trainers can update meal plans'
      });
    }

    // Validate foods if provided
    if (req.body.meals) {
      const foodIds = req.body.meals.flatMap(meal => meal.items.map(item => item.food));
      const validFoods = await Food.find({ _id: { $in: foodIds }, isActive: true });
      
      if (validFoods.length !== foodIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more food items are invalid or inactive'
        });
      }
    }

    mealPlan = await MealPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
  .populate('user', 'name email role')
      .populate('meals.items.food');

    res.status(200).json({
      success: true,
      message: 'Meal plan updated successfully',
      data: mealPlan
    });
  } catch (error) {
    console.error('Update meal plan error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update meal plan'
    });
  }
};

// @desc    Delete meal plan (soft delete)
// @route   DELETE /api/meal-plans/:id
// @access  Private (Trainer only)
const deleteMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id);

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
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
        message: 'Only trainers can delete meal plans'
      });
    }

    mealPlan.isActive = false;
    await mealPlan.save();

    res.status(200).json({
      success: true,
      message: 'Meal plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meal plan'
    });
  }
};

// @desc    Get user's active meal plan
// @route   GET /api/meal-plans/user/:userId/active
// @access  Private
const getUserActiveMealPlan = async (req, res) => {
  try {
    const userId = req.params.userId;

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
    if (currentUser.role === 'member' && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const mealPlan = await MealPlan.findOne({
      user: userId,
      status: 'Active',
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    })
      .populate('meals.items.food')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: mealPlan
    });
  } catch (error) {
    console.error('Get active meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active meal plan'
    });
  }
}

module.exports = {
  createMealPlan,
  getMealPlans,
  getMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getUserActiveMealPlan
};

/*
const MealPlan = require('../models/WorkoutPlan');
const Progress = require('../models/Progress');
const User = require('../models/userModel');
const axios = require('axios');

// Create meal plan (Trainer)
exports.createMealPlan = async (req, res) => {
    try {
        const body = req.body;
        body.createdAt = new Date();

        const plan = new MealPlan(body);
        await plan.save();

        res.status(201).json({ message: 'Workout plan created successfully', plan });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update meal plan
exports.updateMealPlan = async (req, res) => {
    try {
        const plan = await MealPlan.findByIdAndUpdate(
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

// Delete meal plan
exports.deleteMealPlan = async (req, res) => {
    try {
        const deletedPlan = await MealPlan.findByIdAndDelete(req.params.id);

        if(!deletedPlan){
            return res.status(404).json({message: 'Plan not found'});
        }

        res.json({ message: 'Workout plan deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all meal plans
exports.getUserMealPlans = async (req, res) => {
    try {
        const plans = await MealPlan.find()
        
        if (!plans || plans.length === 0) {
            console.log("No plans found in the database."); // Debugging log for empty results
            return res.status(404).json({ message: "No plans found" });
        }

        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get meal plans by id
exports.getMealPlanById = async (req, res) => {
    try {
        const plan = await MealPlan.findById(req.params.id);
        if (plan) {
            res.json(plan);
        } else {
            return res.status(404).json({ message: "Plan not found" });
        }
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};
*/
