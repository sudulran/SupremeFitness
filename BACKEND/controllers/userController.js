const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { sendEmail, testEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET || 'supreme_fitness_secret_2024',
    { expiresIn: '30d' }
  );
};

// Helper function to check and update expired memberships
const checkExpiredMemberships = async () => {
  try {
    const now = new Date();
    const expiredUsers = await User.find({
      paymentStatus: 'accepted',
      membershipEndDate: { $lte: now }
    });

    for (const user of expiredUsers) {
      user.paymentStatus = 'expired';
      await user.save();
      
      // Send expiration email
      sendEmail(user.email, 'expiration', user)
        .then(result => {
          console.log('✅ Expiration email sent to:', user.email);
        })
        .catch(emailError => {
          console.error('❌ Failed to send expiration email:', emailError.message);
        });
    }

    if (expiredUsers.length > 0) {
      console.log(`✅ Updated ${expiredUsers.length} expired memberships`);
    }
    
    return expiredUsers.length;
  } catch (error) {
    console.error('Error checking expired memberships:', error);
    return 0;
  }
};

// @desc    Register user with email notification
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    console.log('File received:', req.file);

    const { name, email, contactNumber, gender, age, height, weight, membershipType, password } = req.body;

    // Validation
    if (!name || !email || !contactNumber || !gender || !age || !membershipType || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment receipt is required'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (membership dates will be set when approved)
    const user = await User.create({
      name,
      email,
      contactNumber,
      gender,
      age: parseInt(age),
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      membershipType,
      password: hashedPassword,
      paymentReceipt: req.file.filename
    });

    // Send welcome email using template
    sendEmail(user.email, 'welcome', user)
      .then(result => {
        console.log('✅ Welcome email sent to:', user.email);
      })
      .catch(emailError => {
        console.error('❌ Failed to send welcome email:', emailError.message);
      });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for confirmation.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          contactNumber: user.contactNumber,
          gender: user.gender,
          age: user.age,
          height: user.height,
          weight: user.weight,
          membershipType: user.membershipType,
          paymentStatus: user.paymentStatus,
          paymentReceipt: user.paymentReceipt
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Delete uploaded file if error occurs
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (fileError) {
        console.error('Error deleting uploaded file:', fileError);
      }
    }

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
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check expired memberships first
    await checkExpiredMemberships();

    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    
    if (user && (await bcrypt.compare(password, user.password))) {
      // Check membership status
      if (user.paymentStatus === 'expired') {
        return res.status(400).json({
          success: false,
          message: 'Your membership has expired. Please renew your membership.'
        });
      }
      
      if (user.paymentStatus !== 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'Your account is pending approval. Please wait for admin acceptance.'
        });
      }

      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful!',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            contactNumber: user.contactNumber,
            gender: user.gender,
            age: user.age,
            height: user.height,
            weight: user.weight,
            membershipType: user.membershipType,
            paymentStatus: user.paymentStatus,
            membershipStartDate: user.membershipStartDate,
            membershipEndDate: user.membershipEndDate,
            daysUntilExpiration: user.daysUntilExpiration
          },
          token
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Update payment status with email notification and set membership dates
// @route   PUT /api/users/payment-status
// @access  Private/Admin
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { userId, status, reason } = req.body;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If status is changing to accepted, set membership dates
    if (status === 'accepted' && user.paymentStatus !== 'accepted') {
      user.membershipStartDate = new Date();
      user.membershipEndDate = user.calculateMembershipEndDate();
    }

    // If status is changing from accepted to something else, clear dates
    if (status !== 'accepted' && user.paymentStatus === 'accepted') {
      user.membershipStartDate = null;
      user.membershipEndDate = null;
    }

    user.paymentStatus = status;
    await user.save();

    // Send appropriate email based on status
    if (status === 'accepted') {
      sendEmail(user.email, 'approval', {
        ...user.toObject(),
        membershipEndDate: user.membershipEndDate
      })
        .then(result => {
          console.log('✅ Approval email sent to:', user.email);
        })
        .catch(emailError => {
          console.error('❌ Failed to send approval email:', emailError.message);
        });
    } else if (status === 'rejected') {
      sendEmail(user.email, 'rejection', user, reason)
        .then(result => {
          console.log('✅ Rejection email sent to:', user.email);
        })
        .catch(emailError => {
          console.error('❌ Failed to send rejection email:', emailError.message);
        });
    }

    res.json({
      success: true,
      message: `Payment status updated to ${status} and email notification sent`,
      data: { 
        user: {
          ...user.toObject(),
          daysUntilExpiration: user.daysUntilExpiration
        }
      }
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get expiring soon memberships
// @route   GET /api/users/expiring-soon
// @access  Private/Admin
exports.getExpiringSoonMemberships = async (req, res) => {
  try {
    // Check for expired memberships first
    await checkExpiredMemberships();

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringSoonUsers = await User.find({
      paymentStatus: 'accepted',
      membershipEndDate: {
        $lte: sevenDaysFromNow,
        $gt: new Date() // Greater than current date (not expired yet)
      }
    }).sort({ membershipEndDate: 1 });

    // Add days until expiration to each user
    const usersWithExpiration = expiringSoonUsers.map(user => ({
      ...user.toObject(),
      daysUntilExpiration: user.daysUntilExpiration
    }));

    res.json({
      success: true,
      count: expiringSoonUsers.length,
      data: { users: usersWithExpiration }
    });
  } catch (error) {
    console.error('Get expiring soon memberships error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get expired memberships
// @route   GET /api/users/expired
// @access  Private/Admin
exports.getExpiredMemberships = async (req, res) => {
  try {
    // Check for expired memberships first
    await checkExpiredMemberships();

    const expiredUsers = await User.find({
      paymentStatus: 'expired'
    }).sort({ membershipEndDate: -1 });

    res.json({
      success: true,
      count: expiredUsers.length,
      data: { users: expiredUsers }
    });
  } catch (error) {
    console.error('Get expired memberships error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Renew membership
// @route   PUT /api/users/renew-membership
// @access  Private/Admin
exports.renewMembership = async (req, res) => {
  try {
    const { userId, membershipType } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update membership type if provided
    if (membershipType) {
      user.membershipType = membershipType;
    }

    // Set new membership dates
    user.membershipStartDate = new Date();
    user.membershipEndDate = user.calculateMembershipEndDate();
    user.paymentStatus = 'accepted';

    await user.save();

    // Send renewal confirmation email
    sendEmail(user.email, 'renewal', {
      ...user.toObject(),
      membershipEndDate: user.membershipEndDate
    })
      .then(result => {
        console.log('✅ Renewal email sent to:', user.email);
      })
      .catch(emailError => {
        console.error('❌ Failed to send renewal email:', emailError.message);
      });

    res.json({
      success: true,
      message: 'Membership renewed successfully!',
      data: { 
        user: {
          ...user.toObject(),
          daysUntilExpiration: user.daysUntilExpiration
        }
      }
    });
  } catch (error) {
    console.error('Renew membership error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile/:id
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id; // This should work now
    
    console.log('Getting profile for user ID:', userId);

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          daysUntilExpiration: user.daysUntilExpiration
        }
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    await checkExpiredMemberships();
    
    const users = await User.find().sort({ createdAt: -1 });
    
    // Add days until expiration to each user
    const usersWithExpiration = users.map(user => ({
      ...user.toObject(),
      daysUntilExpiration: user.daysUntilExpiration
    }));
    
    res.json({
      success: true,
      count: users.length,
      data: { users: usersWithExpiration }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get pending users
// @route   GET /api/users/pending
// @access  Private/Admin
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ paymentStatus: 'pending' }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: pendingUsers.length,
      data: { users: pendingUsers }
    });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Check membership status (cron job endpoint)
// @route   GET /api/users/check-memberships
// @access  Private/Admin
exports.checkMemberships = async (req, res) => {
  try {
    const expiredCount = await checkExpiredMemberships();
    
    res.json({
      success: true,
      message: `Membership check completed. ${expiredCount} memberships expired.`
    });
  } catch (error) {
    console.error('Check memberships error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send test email
// @route   POST /api/users/test-email
// @access  Private/Admin
exports.sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const result = await sendEmail(email, 'welcome', {
      name: 'Test User',
      email: email,
      contactNumber: '0712345678',
      membershipType: 'monthly'
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email: ' + result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Test email configuration
// @route   GET /api/users/test-email-config
// @access  Private/Admin
exports.testEmailConfig = async (req, res) => {
  try {
    const result = await testEmail();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        email: result.email
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email configuration test failed: ' + result.error
      });
    }
  } catch (error) {
    console.error('Email config test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    console.log('Update profile request body:', req.body); // Debug log
    
    const { userId, name, contactNumber, age, height, weight, currentPassword, newPassword } = req.body;

    console.log('User ID from request:', userId); // Debug log

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic fields
    if (name) user.name = name;
    if (contactNumber) user.contactNumber = contactNumber;
    if (age) user.age = parseInt(age);
    if (height !== undefined) user.height = height ? parseFloat(height) : null;
    if (weight !== undefined) user.weight = weight ? parseFloat(weight) : null;

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set new password'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          ...updatedUser.toObject(),
          daysUntilExpiration: updatedUser.daysUntilExpiration
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
};

// @desc    Check email configuration
// @route   GET /api/users/check-email-config
// @access  Private/Admin
exports.checkEmailConfig = async (req, res) => {
  res.json({
    SYSTEM_EMAIL: process.env.SYSTEM_EMAIL,
    SYSTEM_EMAIL_PASSWORD: process.env.SYSTEM_EMAIL_PASSWORD ? 'SET (' + process.env.SYSTEM_EMAIL_PASSWORD.length + ' chars)' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV
  });
};