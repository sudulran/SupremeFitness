// controllers/reviewController.js

const Review = require('../models/reviewModel');

// Add a review to a trainer
exports.addReview = async (req, res) => {
  const { trainerId } = req.params;
  const { clientName, rating, comment } = req.body;

  try {
    const review = new Review({ trainerId, clientName, rating, comment });
    const savedReview = await review.save();
    res.status(201).json(savedReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all reviews for a trainer
exports.getTrainerReviews = async (req, res) => {
  const { trainerId } = req.params;

  try {
    const reviews = await Review.find({ trainerId });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a review by its ID
exports.updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  try {
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { rating, comment },
      { new: true }
    );

    if (!updatedReview) return res.status(404).json({ message: 'Review not found' });

    res.json(updatedReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a review by its ID
exports.deleteReview = async (req, res) => {
  const { reviewId } = req.params;

  try {
    const deleted = await Review.findByIdAndDelete(reviewId);
    if (!deleted) return res.status(404).json({ message: 'Review not found' });

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTrainerReviewsRate = async (req, res) => {
  const { trainerId } = req.params;

  try {
    // Validate trainerId (optional but recommended)
    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Fetch reviews by trainer ID
    const reviews = await Review.find({ trainerId });

    // If no reviews are found, return default response
    if (!reviews.length) {
      return res.json({ averageRating: 0, totalReviews: 0 });
    }

    // Calculate total and average rating
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = parseFloat((totalRating / reviews.length).toFixed(2)); // rounded to 2 decimals

    // Respond with calculated values
    res.json({ averageRating, totalReviews: reviews.length });

  } catch (err) {
    // Handle errors
    console.error('Error fetching trainer reviews:', err);
    res.status(500).json({ error: 'Server error while fetching reviews' });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate('trainerId', 'name'); // Populate trainer details if needed
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}