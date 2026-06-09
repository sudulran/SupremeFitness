const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getAdminProfile,
  createAdmin,
  registerAdmin  ,
  getDashboardStats
} = require('../controllers/adminController');
const { adminProtect, requireRole } = require('../middlewares/adminAuth');

// Public routes
router.post('/login', adminLogin);
router.post('/register', registerAdmin);  // ADD THIS ROUTE

// Protected routes
router.get('/profile',  getAdminProfile);
router.get('/stats',  getDashboardStats);


module.exports = router;