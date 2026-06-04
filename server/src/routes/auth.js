const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const db = require('../models');
const { sendEmail } = require('../services/email');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { success: false, error: 'Too many attempts, please try again later' }
});

// Generate tokens — role is embedded so middleware doesn't need a DB call per request
const generateTokens = (userId, role = 'owner') => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Register
router.post('/register', [
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, name, phone } = req.body;

    // Check if user exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Create user
    const verificationToken = uuidv4();
    const user = await db.User.create({
      email,
      password,
      name,
      phone,
      verificationToken
    });

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Verify your Infallible account',
        html: `
          <h1>Welcome to Infallible</h1>
          <p>Click the link below to verify your account:</p>
          <a href="${process.env.API_URL}/api/auth/verify/${verificationToken}">Verify Email</a>
        `
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    const tokens = generateTokens(user.id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      user: user.toJSON(),
      ...tokens
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', [
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const tokens = generateTokens(user.id, user.role);

    res.json({
      success: true,
      user: user.toJSON(),
      ...tokens
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    const user = await db.User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const tokens = generateTokens(user.id, user.role);

    res.json({
      success: true,
      ...tokens
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Refresh token expired'
      });
    }
    next(error);
  }
});

// Verify email
router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await db.User.findOne({
      where: { verificationToken: token }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification token'
      });
    }

    await user.update({
      isVerified: true,
      verificationToken: null
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Request password reset
router.post('/forgot-password', [
  authLimiter,
  body('email').isEmail().normalizeEmail()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;

    const user = await db.User.findOne({ where: { email } });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires
    });

    await sendEmail({
      to: email,
      subject: 'Reset your Infallible password',
      html: `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password (valid for 1 hour):</p>
        <a href="${process.env.API_URL}/reset-password/${resetToken}">Reset Password</a>
      `
    });

    res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent'
    });
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 })
], async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await db.User.findOne({
      where: {
        resetPasswordToken: token
      }
    });

    if (!user || new Date() > user.resetPasswordExpires) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    await user.update({
      password,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
