const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Add a review to a trainer
router.post('/:trainerId', reviewController.addReview);

// Get all reviews for a trainer
router.get('/:trainerId', reviewController.getTrainerReviews);

// Get average rating and total reviews for a trainer
router.get('/:trainerId/summary', reviewController.getTrainerReviewsRate);

// Update a review
router.put('/:reviewId', reviewController.updateReview);

// Delete a review
router.delete('/:reviewId', reviewController.deleteReview);

router.get('/', reviewController.getAllReviews);

module.exports = router;
