const express = require('express');
const router = express.Router();
const timeSlotController = require('../controllers/timeSlotController');

router.get('/:trainerId', timeSlotController.getTrainerTimeSlots);
router.post('/:trainerId', timeSlotController.addTimeSlot);
router.put('/slot/:slotId', timeSlotController.updateTimeSlot);
router.delete('/slot/:slotId', timeSlotController.deleteTimeSlot);

module.exports = router;
