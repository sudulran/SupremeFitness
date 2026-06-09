const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Admin = require('../models/Admin');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // allow admin-issued tokens
      if (decoded.type === 'admin') {
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) {
          return res.status(401).json({
            success: false,
            message: 'Admin not found',
          });
        }

        req.admin = admin;
        req.user = {
          _id: admin._id,
          role: admin.role || 'admin',
          email: admin.email,
          name: admin.fullName || admin.username || admin.email,
          isAdmin: true,
        };
        return next();
      }

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
    });
  }
};

// Optional: Admin middleware
exports.admin = (req, res, next) => {
  // teammates still have the same helper available
  next();
};
