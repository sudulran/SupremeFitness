const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Book a trainer's time slot
router.post('/:trainerId/:slotId', bookingController.bookTrainer);

// Get all bookings
router.get('/', bookingController.getAllBookings);

// Get bookings for a specific trainer
router.get('/trainer/:trainerId', bookingController.getTrainerBookings);

// Update booking status
router.put('/status/:bookingId', bookingController.updateBookingStatus);

// DELETE booking by ID
router.delete('/:bookingId', bookingController.deleteBooking);

// Reschedule booking
router.put('/reschedule/:bookingId', bookingController.rescheduleBooking);

module.exports = router;
