const Food = require('../models/Food');
const User = require('../models/userModel');

const getCurrentUser = async (req) => {
  if (!req.user || !req.user._id) {
    return null;
  }

  return User.findById(req.user._id).select('role');
};

// @desc    Create food
// @route   POST /api/foods
// @access  Private (Trainer/Admin only)
const createFood = async (req, res) => {
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
        message: 'Only trainers and admins can create foods'
      });
    }

    const food = await Food.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Food created successfully',
      data: food
    });
  } catch (error) {
    console.error('Create food error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create food'
    });
  }
};

// @desc    Get all foods (with filters and search)
// @route   GET /api/foods
// @access  Private
const getFoods = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      page = 1, 
      limit = 50,
      sortBy = 'name'
    } = req.query;
    
    const query = { isActive: true };

    // Apply filters
    if (category) query.category = category;

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
    else if (sortBy === 'calories') sortOptions = { 'nutrition.calories': 1 };
    else sortOptions = { createdAt: -1 };

    const foods = await Food.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber);

    const total = await Food.countDocuments(query);

    res.status(200).json({
      success: true,
      count: foods.length,
      total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      data: foods
    });
  } catch (error) {
    console.error('Get foods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch foods'
    });
  }
};

// @desc    Get single food
// @route   GET /api/foods/:id
// @access  Private
const getFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food || !food.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Food not found'
      });
    }

    res.status(200).json({
      success: true,
      data: food
    });
  } catch (error) {
    console.error('Get food error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food'
    });
  }
};

// @desc    Update food
// @route   PUT /api/foods/:id
// @access  Private (Trainer/Admin only)
const updateFood = async (req, res) => {
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
        message: 'Only trainers and admins can update foods'
      });
    }

    const food = await Food.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Food updated successfully',
      data: food
    });
  } catch (error) {
    console.error('Update food error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update food'
    });
  }
};

// @desc    Delete food (soft delete)
// @route   DELETE /api/foods/:id
// @access  Private (Admin only)
const deleteFood = async (req, res) => {
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
        message: 'Only admins can delete foods'
      });
    }

    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found'
      });
    }

    food.isActive = false;
    await food.save();

    res.status(200).json({
      success: true,
      message: 'Food deleted successfully'
    });
  } catch (error) {
    console.error('Delete food error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete food'
    });
  }
};

// @desc    Get food categories
// @route   GET /api/foods/meta/categories
// @access  Private
const getFoodCategories = async (req, res) => {
  try {
    const categories = await Food.distinct('category', { isActive: true });
    
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

module.exports = {
  createFood,
  getFoods,
  getFood,
  updateFood,
  deleteFood,
  getFoodCategories
};
