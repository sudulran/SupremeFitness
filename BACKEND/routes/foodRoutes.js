const express = require('express');
const {
  createFood,
  getFoods,
  getFood,
  updateFood,
  deleteFood,
  getFoodCategories
} = require('../controllers/foodController');
const { protect } = require('../middlewares/authMiddleware'); // Changed from 'auth' to 'protect'
const router = express.Router();

// All routes require authentication
router.use(protect);

// Meta routes (must come before /:id)
router.get('/meta/categories', getFoodCategories);

// Main routes
router.route('/')
  .get(getFoods)
  .post(createFood);

router.route('/:id')
  .get(getFood)
  .put(updateFood)
  .delete(deleteFood);

module.exports = router;
