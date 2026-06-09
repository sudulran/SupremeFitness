const TimeSlot = require('../models/timeSlotModel');
const Trainer = require('../models/trainerModel');

// Get all time slots for a specific trainer
exports.getTrainerTimeSlots = async (req, res) => {
  try {
    const trainerId = req.params.trainerId;
    const slots = await TimeSlot.find({ trainerId });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a time slot for a trainer
exports.addTimeSlot = async (req, res) => {
  try {
    const { day, startTime, endTime } = req.body;
    const trainerId = req.params.trainerId;

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });

    const newSlot = new TimeSlot({ trainerId, day, startTime, endTime });
    const savedSlot = await newSlot.save();
    res.status(201).json(savedSlot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update an existing time slot
exports.updateTimeSlot = async (req, res) => {
  try {
    const { day, startTime, endTime } = req.body;
    const { slotId } = req.params;

    const updatedSlot = await TimeSlot.findByIdAndUpdate(
      slotId,
      { day, startTime, endTime },
      { new: true, runValidators: true }
    );

    if (!updatedSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    res.json(updatedSlot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a time slot
exports.deleteTimeSlot = async (req, res) => {
  try {
    const deleted = await TimeSlot.findByIdAndDelete(req.params.slotId);
    if (!deleted) return res.status(404).json({ message: 'Time slot not found' });
    res.json({ message: 'Time slot deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
