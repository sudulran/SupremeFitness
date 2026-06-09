// controllers/eventController.js
const EventModel = require("../models/eventModel.js");
const User = require("../models/userModel.js");
const path = require("path");
const fs = require("fs");

// ---------------- Admin CRUD ----------------
const addEvent = async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, type } = req.body;
    
    // Validation
    if (!title || !description || !date || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required: title, description, date, startTime, endTime" 
      });
    }

    // Validate time logic
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    
    if (endDateTime <= startDateTime) {
      return res.status(400).json({ 
        success: false, 
        message: "End time must be after start time" 
      });
    }

    // Validate event is not in the past
    const now = new Date();
    if (startDateTime < now) {
      return res.status(400).json({ 
        success: false, 
        message: "Event cannot be scheduled in the past" 
      });
    }

    let imagePath = "";
    if (req.file) {
      imagePath = `/uploads/events/${req.file.filename}`;
    }

    const eventData = {
      title,
      description,
      date,
      startTime,
      endTime,
      type: type || "event",
      image: imagePath
    };

    const event = new EventModel(eventData);
    await event.save();
    
    return res.json({ 
      success: true, 
      message: "Event created successfully", 
      event 
    });
  } catch (err) {
    console.error("[addEvent]", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error creating event", 
      error: err.message 
    });
  }
};

const listEvents = async (req, res) => {
  try {
    const events = await EventModel.find().sort({ date: 1 });
    return res.json({ success: true, events });
  } catch (err) {
    console.error("[listEvents]", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching events", 
      error: err.message 
    });
  }
};

const singleEvent = async (req, res) => {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ 
      success: false, 
      message: "Event not found" 
    });
    return res.json({ success: true, event });
  } catch (err) {
    console.error("[singleEvent]", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching event", 
      error: err.message 
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, type } = req.body;
    
    // Validation
    if (!title || !description || !date || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required: title, description, date, startTime, endTime" 
      });
    }

    // Validate time logic
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    
    if (endDateTime <= startDateTime) {
      return res.status(400).json({ 
        success: false, 
        message: "End time must be after start time" 
      });
    }

    const updateData = {
      title,
      description,
      date,
      startTime,
      endTime,
      type: type || "event"
    };

    // Handle image upload
    if (req.file) {
      updateData.image = `/uploads/events/${req.file.filename}`;
      
      // Delete old image if exists
      const existingEvent = await EventModel.findById(req.params.id);
      if (existingEvent && existingEvent.image) {
        const oldImagePath = path.join(__dirname, '..', 'public', existingEvent.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    const updated = await EventModel.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    
    if (!updated) return res.status(404).json({ 
      success: false, 
      message: "Event not found" 
    });
    
    return res.json({ 
      success: true, 
      message: "Event updated", 
      event: updated 
    });
  } catch (err) {
    console.error("[updateEvent]", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error updating event", 
      error: err.message 
    });
  }
};

const removeEvent = async (req, res) => {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ 
      success: false, 
      message: "Event not found" 
    });

    // Delete associated image
    if (event.image) {
      const imagePath = path.join(__dirname, '..', 'public', event.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await EventModel.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    console.error("[removeEvent]", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error deleting event", 
      error: err.message 
    });
  }
};

// ---------------- User Participation ----------------
const myEnrollments = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ 
      success: false, 
      message: "Unauthorized" 
    });

    const events = await EventModel.find(
      { "participants.userId": userId },
      { title: 1, description: 1, date: 1, startTime: 1, endTime: 1, type: 1, image: 1, participants: 1 }
    ).sort({ date: 1 });

    const data = events.map(ev => {
      const me = ev.participants.find(p => String(p.userId) === String(userId));
      return {
        _id: ev._id,
        title: ev.title,
        description: ev.description,
        date: ev.date,
        startTime: ev.startTime,
        endTime: ev.endTime,
        type: ev.type,
        image: ev.image,
        my: me ? { participantId: me._id, score: me.score ?? 0 } : null
      };
    });

    return res.json({ success: true, events: data });
  } catch (err) {
    console.error("[myEnrollments]", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching enrollments", 
      error: err.message 
    });
  }
};

const unenrollSelf = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ 
      success: false, 
      message: "Unauthorized" 
    });

    const event = await EventModel.findById(id);
    if (!event) return res.status(404).json({ 
      success: false, 
      message: "Event not found" 
    });

    const before = event.participants.length;
    event.participants = event.participants.filter(p => String(p.userId) !== String(userId));
    const after = event.participants.length;

    if (before === after) {
      return res.json({ 
        success: true, 
        message: "You were not enrolled in this event" 
      });
    }

    await event.save();
    return res.json({ success: true, message: "Unenrolled successfully" });
  } catch (err) {
    console.error("[unenrollSelf]", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error unenrolling", 
      error: err.message 
    });
  }
};

const addProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { value, note = "", mode = "add" } = req.body;

    if (!userId) return res.status(401).json({ 
      success: false, 
      message: "Unauthorized" 
    });

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid value" 
      });
    }
    if (!["add", "set"].includes(mode)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid mode" 
      });
    }

    const event = await EventModel.findById(id);
    if (!event) return res.status(404).json({ 
      success: false, 
      message: "Event not found" 
    });

    const participant = event.participants.find(p => String(p.userId) === String(userId));
    if (!participant) {
      return res.status(400).json({ 
        success: false, 
        message: "You are not enrolled in this event" 
      });
    }

    participant.progress.push({ value: numeric, note, type: mode });

    if (mode === "add") {
      participant.score = (participant.score || 0) + numeric;
    } else {
      participant.score = numeric;
    }

    await event.save();
    return res.json({
      success: true,
      message: "Progress recorded",
      participant: {
        _id: participant._id,
        score: participant.score,
        progress: participant.progress.slice(-10),
      },
    });
  } catch (err) {
    console.error("[addProgress]", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error adding progress", 
      error: err.message 
    });
  }
};

const myProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ 
      success: false, 
      message: "Unauthorized" 
    });

    const event = await EventModel.findById(id);
    if (!event) return res.status(404).json({ 
      success: false, 
      message: "Event not found" 
    });

    const participant = event.participants.find(p => String(p.userId) === String(userId));
    if (!participant) {
      return res.status(404).json({ 
        success: false, 
        message: "Not enrolled in this event" 
      });
    }

    return res.json({
      success: true,
      participant: {
        _id: participant._id,
        score: participant.score || 0
      },
    });
  } catch (err) {
    console.error("[myProgress]", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching progress", 
      error: err.message 
    });
  }
};

const enrollParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await EventModel.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // 🔒 Require login
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Please login to enroll",
      });
    }

    // ✅ Logged-in user flow
    const user = await User.findById(req.user.id).select("name email");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🚫 Prevent duplicate enrollment
    const already = event.participants.some(
      (p) => String(p.userId) === String(req.user.id)
    );
    if (already) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this event",
      });
    }

    // ✅ Add participant
    event.participants.push({
      userId: req.user.id,
      name: user.name || "Member",
      email: user.email || "",
      score: 0,
    });

    await event.save();

    return res.json({
      success: true,
      message: "Participant enrolled successfully",
      event,
    });
  } catch (err) {
    console.error("[enrollParticipant]", err);
    return res.status(500).json({
      success: false,
      message: "Error enrolling participant",
      error: err.message,
    });
  }
};

const updateScore = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    const { score } = req.body;

    const event = await EventModel.findById(eventId);
    if (!event) return res.status(404).json({ 
      success: false, 
      message: "Event not found" 
    });

    const participant = event.participants.id(participantId);
    if (!participant) return res.status(404).json({ 
      success: false, 
      message: "Participant not found" 
    });

    participant.score = typeof score === "number" ? score : Number(score) || 0;
    await event.save();

    return res.json({ 
      success: true, 
      message: "Score updated", 
      participant 
    });
  } catch (err) {
    console.error("[updateScore]", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error updating score", 
      error: err.message 
    });
  }
};

const removeParticipant = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    const event = await EventModel.findById(eventId);
    if (!event) return res.status(404).json({ 
      success: false, 
      message: "Event not found" 
    });

    const p = event.participants.id(participantId);
    if (!p) return res.status(404).json({ 
      success: false, 
      message: "Participant not found" 
    });

    p.deleteOne();
    await event.save();
    return res.json({ 
      success: true, 
      message: "Participant removed" 
    });
  } catch (err) {
    console.error("[removeParticipant]", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error removing participant", 
      error: err.message 
    });
  }
};

const leaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await EventModel.findById(id).populate("participants.userId", "name email");
    if (!event) return res.status(404).json({ 
      success: false, 
      message: "Event not found" 
    });

    const normalized = event.participants
      .map((p) => ({
        _id: p._id,
        name: p.userId?.name || p.name || "Unknown",
        email: p.userId?.email || p.email || "—",
        score: typeof p.score === "number" ? p.score : 0,
      }))
      .sort((a, b) => b.score - a.score);

    return res.json({ 
      success: true, 
      leaderboard: normalized 
    });
  } catch (err) {
    console.error("[leaderboard]", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching leaderboard", 
      error: err.message 
    });
  }
};

// Add to eventController.js
const generateLeaderboardPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await EventModel.findById(id).populate("participants.userId", "name email");
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: "Event not found" 
      });
    }

    const leaderboard = event.participants
      .map((p) => ({
        name: p.userId?.name || p.name || "Unknown",
        email: p.userId?.email || p.email || "—",
        score: typeof p.score === "number" ? p.score : 0,
      }))
      .sort((a, b) => b.score - a.score);

    // You'll need to install a PDF library like pdfkit, jspdf, or pdfmake
    // Here's an example using pdfkit (you'll need to install it: npm install pdfkit)
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=leaderboard-${event.title}-${new Date().toISOString().split('T')[0]}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text(`${event.title} - Leaderboard`, { align: 'center' });
    doc.moveDown();
    
    if (event.date) {
      doc.fontSize(12).text(`Event Date: ${new Date(event.date).toDateString()}`, { align: 'center' });
      doc.moveDown();
    }

    // Add leaderboard table
    if (leaderboard.length === 0) {
      doc.text('No participants yet.');
    } else {
      // Table headers
      doc.fontSize(12);
      doc.text('Rank', 50, doc.y);
      doc.text('Name', 100, doc.y);
      doc.text('Email', 250, doc.y);
      doc.text('Score', 400, doc.y);
      doc.moveDown(0.5);

      // Table rows
      leaderboard.forEach((participant, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        
        doc.text(`${rank} ${medal}`, 50, doc.y);
        doc.text(participant.name, 100, doc.y);
        doc.text(participant.email, 250, doc.y);
        doc.text(participant.score.toString(), 400, doc.y);
        doc.moveDown(0.5);
      });
    }

    // Finalize PDF
    doc.end();

  } catch (err) {
    console.error("[generateLeaderboardPDF]", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error generating PDF", 
      error: err.message 
    });
  }
};

module.exports = {
  addEvent,
  listEvents,
  singleEvent,
  updateEvent,
  removeEvent,
  enrollParticipant,
  updateScore,
  removeParticipant,
  leaderboard,
  myEnrollments,
  unenrollSelf,
  addProgress,
  generateLeaderboardPDF ,
  myProgress
};