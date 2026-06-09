const express = require('express');
const { generateAIWorkoutPlan, generateAIMealPlan } = require('../controllers/aiPlanController');
const { protect } = require('../middlewares/authMiddleware'); // Changed from 'auth' to 'protect'
const router = express.Router();

// All routes require authentication
router.use(protect);

// AI generation routes
router.post('/workout', generateAIWorkoutPlan);
router.post('/meal', generateAIMealPlan);

module.exports = router;
