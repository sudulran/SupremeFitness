const express = require('express');
const {
  createWorkoutPlan,
  getWorkoutPlans,
  getWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  getUserActiveWorkoutPlan
} = require('../controllers/WorkoutPlanController');
const { protect } = require('../middlewares/authMiddleware'); // Changed from 'auth' to 'protect'
const { validateWorkoutPlan, validate } = require('../middlewares/validationMiddleware');
const router = express.Router();

// All routes require authentication
router.use(protect);

// Main routes
router.route('/')
  .get(getWorkoutPlans)
  .post(validateWorkoutPlan, validate, createWorkoutPlan);

router.route('/:id')
  .get(getWorkoutPlan)
  .put(updateWorkoutPlan)
  .delete(deleteWorkoutPlan);

// Get user's active workout plan
router.get('/user/:userId/active', getUserActiveWorkoutPlan);

module.exports = router;


/*
const express = require('express');
const router = express.Router();
const workoutPlanController = require('../controllers/WorkoutPlanController');
const auth = require('../middlewares/auth');

// Trainer routes
router.post('/trainer/create', auth, workoutPlanController.createWorkoutPlan);
router.put('/trainer/update/:id', auth, workoutPlanController.updateWorkoutPlan);
router.delete('/trainer/delete/:id', auth, workoutPlanController.deleteWorkoutPlan);

// User routes
router.get('/user/:userId', auth, workoutPlanController.getUserWorkoutPlans);
router.post('/user/generate-ai', auth, workoutPlanController.generateAIWorkoutPlan);
router.post('/user/track-progress', auth, workoutPlanController.trackWorkoutProgress);
router.get('/user/progress/:userId', auth, workoutPlanController.getProgressHistory);

module.exports = router;
*/
