const Exercise = require('../models/Exercise');
const User = require('../models/userModel');

const getCurrentUser = async (req) => {
  if (!req.user || !req.user._id) {
    return null;
  }

  return User.findById(req.user._id).select('role');
};

// @desc    Create exercise
// @route   POST /api/exercises
// @access  Private (Trainer/Admin only)
const createExercise = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate trainer/admin role
    if (currentUser.role !== 'trainer' && currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only trainers and admins can create exercises'
      });
    }

    const exercise = await Exercise.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Exercise created successfully',
      data: exercise
    });
  } catch (error) {
    console.error('Create exercise error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Exercise with this name already exists'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create exercise'
    });
  }
};

// @desc    Get all exercises (with filters and search)
// @route   GET /api/exercises
// @access  Private
const getExercises = async (req, res) => {
  try {
    const { 
      category, 
      muscleGroup, 
      difficulty, 
      equipment,
      search, 
      page = 1, 
      limit = 50,
      sortBy = 'name'
    } = req.query;
    
    const query = { isActive: true };

    // Apply filters
    if (category) query.category = category;
    if (muscleGroup) query.muscleGroup = muscleGroup;
    if (difficulty) query.difficulty = difficulty;
    if (equipment) query.equipment = equipment;

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 50;
    const skip = (pageNumber - 1) * limitNumber;

    // Sort options
    let sortOptions = {};
    if (sortBy === 'name') sortOptions = { name: 1 };
    else if (sortBy === 'category') sortOptions = { category: 1, name: 1 };
    else if (sortBy === 'muscleGroup') sortOptions = { muscleGroup: 1, name: 1 };
    else sortOptions = { createdAt: -1 };

    const exercises = await Exercise.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber);

    const total = await Exercise.countDocuments(query);

    res.status(200).json({
      success: true,
      count: exercises.length,
      total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      data: exercises
    });
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exercises'
    });
  }
};

// @desc    Get single exercise
// @route   GET /api/exercises/:id
// @access  Private
const getExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise || !exercise.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    res.status(200).json({
      success: true,
      data: exercise
    });
  } catch (error) {
    console.error('Get exercise error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exercise'
    });
  }
};

// @desc    Update exercise
// @route   PUT /api/exercises/:id
// @access  Private (Trainer/Admin only)
const updateExercise = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate trainer/admin role
    if (currentUser.role !== 'trainer' && currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only trainers and admins can update exercises'
      });
    }

    const exercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Exercise updated successfully',
      data: exercise
    });
  } catch (error) {
    console.error('Update exercise error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Exercise with this name already exists'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update exercise'
    });
  }
};

// @desc    Delete exercise (soft delete)
// @route   DELETE /api/exercises/:id
// @access  Private (Admin only)
const deleteExercise = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate admin role
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete exercises'
      });
    }

    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    exercise.isActive = false;
    await exercise.save();

    res.status(200).json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete exercise'
    });
  }
};

// @desc    Get exercise categories
// @route   GET /api/exercises/meta/categories
// @access  Private
const getExerciseCategories = async (req, res) => {
  try {
    const categories = await Exercise.distinct('category', { isActive: true });
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

// @desc    Get muscle groups
// @route   GET /api/exercises/meta/muscle-groups
// @access  Private
const getMuscleGroups = async (req, res) => {
  try {
    const muscleGroups = await Exercise.distinct('muscleGroup', { isActive: true });
    
    res.status(200).json({
      success: true,
      data: muscleGroups
    });
  } catch (error) {
    console.error('Get muscle groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch muscle groups'
    });
  }
};

module.exports = {
  createExercise,
  getExercises,
  getExercise,
  updateExercise,
  deleteExercise,
  getExerciseCategories,
  getMuscleGroups
};
