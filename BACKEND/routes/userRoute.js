const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  updatePaymentStatus,
  getPendingUsers,
  sendTestEmail ,
    updateUserProfile, 
   getExpiringSoonMemberships,
  getExpiredMemberships,
  renewMembership,
  checkMemberships
} = require('../controllers/userController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/payments');
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Public routes
router.post('/register', upload.single('paymentReceipt'), registerUser);
router.post('/login', loginUser);

// Protected routes
router.get("/profile/:id", getUserProfile);
router.put('/profile',  updateUserProfile); // Add this route

router.get('/', getAllUsers);
router.put('/payment-status',  updatePaymentStatus);
router.post('/test-email',  sendTestEmail);
router.get('/pending',  getPendingUsers);
router.get('/expiring-soon', getExpiringSoonMemberships);
router.get('/expired',  getExpiredMemberships);
router.put('/renew-membership',  renewMembership);
router.get('/check-memberships', checkMemberships);
module.exports = router;