const Booking = require('../models/bookingModel');
const TimeSlot = require('../models/timeSlotModel');
const Trainer = require('../models/trainerModel');
const sendEmail = require('../helpers/emailSend');

// Book a trainer's available time slot
exports.bookTrainer = async (req, res) => {
  const { trainerId, slotId } = req.params;// Extracts trainerId and slotId from the URL parameters
  const { clientName, clientContact, date } = req.body;

  if (!clientName || !date) { //checks if the required fields are missing.
    return res.status(400).json({ message: 'clientName and date are required' });
  }

  try {
    // Check if time slot exists for the trainer
    const slot = await TimeSlot.findOne({ _id: slotId, trainerId });
    if (!slot) return res.status(404).json({ message: 'Time slot not found for trainer' });

    // Normalize the date (optional but recommended)
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0); // Truncate time

    // Check if already booked for the same date
    const existingBooking = await Booking.findOne({
      slotId,
      date: bookingDate,
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return res.status(409).json({ message: 'Time slot already booked for this date' });
    }

    // Create booking
    const booking = new Booking({
      trainerId,// Assigns the trainer ID.
      slotId,
      clientName,
      clientContact,
      date: bookingDate,
    });

    const savedBooking = await booking.save();
    res.status(201).json(savedBooking);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('trainerId')
      .populate('slotId');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get bookings for a specific trainer
exports.getTrainerBookings = async (req, res) => {
  try {
    const trainerId = req.params.trainerId;
    const bookings = await Booking.find({ trainerId })
      .populate('slotId');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  // Only allow specific statuses
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid booking status' });
  }

  try {
    // Find and update booking
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    )
    .populate('trainerId', 'name')
    .populate('slotId', 'startTime endTime');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // If client email exists, send email
    const clientEmail = booking.clientContact?.email;
    if (clientEmail) {
      const trainerName = booking.trainerId?.name || 'your trainer';
      const slotTime = booking.slotId
        ? `${booking.slotId.startTime} - ${booking.slotId.endTime}`
        : 'scheduled time';
      const formattedDate = booking.date
        ? new Date(booking.date).toDateString()
        : 'Unknown date';

      //call function to send email
      await sendEmail({
        to: clientEmail,
        subject: 'Booking Status Updated',
        text: `Hello ${booking.clientName}, your booking status has been updated to: ${status}.`,
        html: `
          <p>Dear ${booking.clientName},</p>
          <p>Your booking with <strong>${trainerName}</strong> has been updated.</p>
          <p><strong>Status:</strong> ${status}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${slotTime}</p>
          <br />
          <p>Thank you for using our service!</p>
        `,
      });
    }

    res.json({ message: 'Booking status updated and email sent', booking });

  } catch (err) {
    console.error('Error updating booking or sending email:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await booking.deleteOne();
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update booking details (without affecting status)
exports.rescheduleBooking = async (req, res) => {
  const { bookingId } = req.params;
  const { date, slotId, clientContact } = req.body;

  try {
    if (!date && !slotId && !clientContact) {
      return res.status(400).json({ message: 'Provide new date, slotId, or contact information to update' });
    }

    // Find the existing booking first
    const existingBooking = await Booking.findById(bookingId)
      .populate('trainerId')
      .populate('slotId');
    
    if (!existingBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the booking is in a state that allows rescheduling
    if (existingBooking.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot reschedule ${existingBooking.status} appointments. Only pending appointments can be modified.` 
      });
    }

    // If date or slotId is being changed, check for conflicts
    if (date || slotId) {
      const newDate = date ? new Date(date) : existingBooking.date;
      const newSlotId = slotId || existingBooking.slotId._id || existingBooking.slotId;

      // Normalize the date (remove time part for accurate comparison)
      const normalizedDate = new Date(newDate);
      normalizedDate.setHours(0, 0, 0, 0);

      // Check for conflicts with other bookings (excluding the current one and cancelled/completed)
      const conflictingBooking = await Booking.findOne({
        _id: { $ne: bookingId }, // Exclude current booking
        slotId: newSlotId,
        date: normalizedDate,
        status: { $in: ['pending', 'confirmed'] } // Only check pending and confirmed status
      }).populate('slotId');

      if (conflictingBooking) {
        return res.status(409).json({ 
          message: 'This time slot is already booked. Please choose a different date or time.' 
        });
      }

      // Additional validation: Check if the selected slot belongs to the same trainer
      if (slotId) {
        const newSlot = await TimeSlot.findById(newSlotId);
        if (!newSlot) {
          return res.status(404).json({ message: 'Time slot not found' });
        }
        
        // Ensure the new slot belongs to the same trainer
        if (newSlot.trainerId.toString() !== existingBooking.trainerId._id.toString()) {
          return res.status(400).json({ 
            message: 'Cannot change trainer. Please select a time slot from the same trainer.' 
          });
        }

        // Validate that the selected date matches the slot's day
        const selectedDayName = normalizedDate.toLocaleDateString('en-US', { weekday: 'long' });
        if (newSlot.day !== selectedDayName) {
          return res.status(400).json({ 
            message: `Selected date must be a ${newSlot.day} for this time slot.` 
          });
        }
      }

      // Validate that date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (normalizedDate < today) {
        return res.status(400).json({ 
          message: 'Cannot select past dates. Please choose today or a future date.' 
        });
      }

      // Check if no changes are being made (same date and same slot)
      const currentDate = new Date(existingBooking.date);
      currentDate.setHours(0, 0, 0, 0);
      const currentSlotId = existingBooking.slotId._id || existingBooking.slotId;
      

    }

    // Prepare update object
    const update = {};
    if (date) {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      update.date = normalizedDate;
    }
    if (slotId) update.slotId = slotId;
    if (clientContact) update.clientContact = clientContact;

    // Update the booking
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      update,
      { new: true }
    ).populate('trainerId').populate('slotId');

    res.json({ 
      message: 'Booking updated successfully', 
      booking 
    });

  } catch (err) {
    console.error('Error updating booking:', err);
    
    // Handle specific error types
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid booking ID or time slot ID' });
    }
    
    res.status(500).json({ 
      message: 'Server error while updating booking',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get bookings by client name (for user dashboard)
exports.getClientBookings = async (req, res) => {
  try {
    const { clientName } = req.params;
    
    if (!clientName) {
      return res.status(400).json({ message: 'Client name is required' });
    }

    const bookings = await Booking.find({ clientName })
      .populate('trainerId', 'name specialization experience')
      .populate('slotId', 'day startTime endTime')
      .sort({ date: 1, createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching client bookings:', err);
    res.status(500).json({ 
      message: 'Server error while fetching bookings',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get upcoming appointments (for notifications)
exports.getUpcomingBookings = async (req, res) => {
  try {
    const { hours = 24 } = req.query; // Default to next 24 hours
    const now = new Date();
    const timeThreshold = new Date(now.getTime() + (hours * 60 * 60 * 1000));

    const upcomingBookings = await Booking.find({
      date: { 
        $gte: now,
        $lte: timeThreshold
      },
      status: { $in: ['pending', 'confirmed'] }
    })
    .populate('trainerId', 'name specialization')
    .populate('slotId', 'startTime endTime day')
    .sort({ date: 1, 'slotId.startTime': 1 });

    res.json(upcomingBookings);
  } catch (err) {
    console.error('Error fetching upcoming bookings:', err);
    res.status(500).json({ 
      message: 'Server error while fetching upcoming bookings',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};