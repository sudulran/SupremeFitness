const express = require('express');
const {
  createExercise,
  getExercises,
  getExercise,
  updateExercise,
  deleteExercise,
  getExerciseCategories,
  getMuscleGroups
} = require('../controllers/exerciseController');
const { protect } = require('../middlewares/authMiddleware'); // Changed from 'auth' to 'protect'
const router = express.Router();

// All routes require authentication
router.use(protect);

// Meta routes (must come before /:id)
router.get('/meta/categories', getExerciseCategories);
router.get('/meta/muscle-groups', getMuscleGroups);

// Main routes
router.route('/')
  .get(getExercises)
  .post(createExercise);

router.route('/:id')
  .get(getExercise)
  .put(updateExercise)
  .delete(deleteExercise);

module.exports = router;
