const express = require('express');
const {
  createMealPlan,
  getMealPlans,
  getMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getUserActiveMealPlan
} = require('../controllers/MealPlanController');
const { protect } = require('../middlewares/authMiddleware'); // Changed from 'auth' to 'protect'
const router = express.Router();

// All routes require authentication
router.use(protect);

// Main routes
router.route('/')
  .get(getMealPlans)
  .post(createMealPlan);

router.route('/:id')
  .get(getMealPlan)
  .put(updateMealPlan)
  .delete(deleteMealPlan);

// Get user's active meal plan
router.get('/user/:userId/active', getUserActiveMealPlan);

module.exports = router;
