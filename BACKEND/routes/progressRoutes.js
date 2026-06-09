const express = require('express');
const {
  logWorkoutSession,
  logBodyMetrics,
  getUserProgress,
  getWorkoutHistory,
  getBodyMetricsHistory,
  getProgressStats,
  generateProgressReport,
  deleteWorkoutSession
} = require('../controllers/progressController');
const { protect } = require('../middlewares/authMiddleware'); // Changed from 'auth' to 'protect'
const router = express.Router();

// All routes require authentication
router.use(protect);

// Log data
router.post('/workout-session', logWorkoutSession);
router.post('/body-metrics', logBodyMetrics);

// Get progress data
router.get('/:userId', getUserProgress);
router.get('/:userId/workout-history', getWorkoutHistory);
router.get('/:userId/body-metrics', getBodyMetricsHistory);
router.get('/:userId/stats', getProgressStats);
router.get('/:userId/report', generateProgressReport);

// Delete workout session
router.delete('/workout-session/:sessionId', deleteWorkoutSession);

module.exports = router;
