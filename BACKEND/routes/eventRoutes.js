// routes/eventRoutes.js
const express = require("express");
const {
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
  myProgress,
} = require("../controllers/eventController.js");
const adminAuth = require("../middlewares/adminAuth.js");
const userAuth = require("../middlewares/userAuth.js");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads/events');
    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router.use(express.json());

// Admin CRUD with file upload
router.post("/",  upload.single('image'), addEvent);
router.get("/", listEvents);
router.get("/:id", singleEvent);
router.put("/:id",  upload.single('image'), updateEvent);
router.delete("/:id",  removeEvent);
router.get("/:id/leaderboard-pdf", generateLeaderboardPDF);

// Participation
router.post("/:id/enroll", userAuth, enrollParticipant);
router.put("/:eventId/participants/:participantId", updateScore);
router.delete("/:eventId/participants/:participantId",  removeParticipant);
router.delete("/:id/enroll", userAuth, unenrollSelf);

// Leaderboard & Progress
router.get("/my", userAuth, myEnrollments);
router.get("/:id/leaderboard", leaderboard);
router.post("/:id/progress", userAuth, addProgress);
router.get("/:id/my-progress", userAuth, myProgress);

module.exports = router;