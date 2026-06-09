const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/emailService');

// Generate JWT Token for Admin
const generateAdminToken = (adminId) => {
  return jwt.sign(
    { 
      id: adminId,
      type: 'admin'
    }, 
    process.env.JWT_SECRET || 'supreme_fitness_secret_2024',
    { expiresIn: '8h' } // Shorter session for admin
  );
};

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find admin with password selected
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (admin.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed attempts'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await admin.incrementLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    if (admin.loginAttempts > 0 || admin.lockUntil) {
      await Admin.findByIdAndUpdate(admin._id, {
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
      });
    }

    // Update last login
    await Admin.findByIdAndUpdate(admin._id, {
      lastLogin: new Date()
    });

    // Generate token
    const token = generateAdminToken(admin._id);

    res.json({
      success: true,
      message: 'Admin login successful!',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          permissions: admin.permissions
        },
        token
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    
    res.json({
      success: true,
      data: { admin }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new admin (Super Admin only)
// @route   POST /api/admin/create
// @access  Private/SuperAdmin
exports.createAdmin = async (req, res) => {
  try {
    const { username, email, password, fullName, role, permissions } = req.body;

    // Check if admin exists
    const adminExists = await Admin.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email or username already exists'
      });
    }

    // Create admin
    const admin = await Admin.create({
      username,
      email,
      password,
      fullName,
      role: role || 'admin',
      permissions: permissions || {
        userManagement: true,
        contentManagement: true,
        paymentManagement: true,
        systemSettings: false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          permissions: admin.permissions
        }
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email or username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during admin creation'
    });
  }
};

// @desc    Get all admins
// @route   GET /api/admin
// @access  Private/SuperAdmin
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: admins.length,
      data: { admins }
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const User = require('../models/User');
    
    const totalUsers = await User.countDocuments();
    const pendingUsers = await User.countDocuments({ paymentStatus: 'pending' });
    const approvedUsers = await User.countDocuments({ paymentStatus: 'accepted' });
    const rejectedUsers = await User.countDocuments({ paymentStatus: 'rejected' });
    
    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          pendingUsers,
          approvedUsers,
          rejectedUsers,
          recentRegistrations
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Register first admin (for initial setup)
// @route   POST /api/admin/register
// @access  Public (should be disabled in production after first use)
exports.registerAdmin = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Check if any admin already exists (optional security)
    const adminExists = await Admin.findOne({});
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin registration is disabled. An admin already exists.'
      });
    }

    // Validation
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: username, email, password, fullName'
      });
    }

    // Check if admin with same email or username exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email or username already exists'
      });
    }

    // Create super admin
    const admin = await Admin.create({
      username,
      email,
      password,
      fullName,
      role: 'super_admin',
      permissions: {
        userManagement: true,
        contentManagement: true,
        paymentManagement: true,
        systemSettings: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully!',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role
        }
      }
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email or username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during admin registration'
    });
  }
};