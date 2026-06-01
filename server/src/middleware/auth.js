const jwt = require('jsonwebtoken');
const db = require('../models');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await db.User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Device authentication (for mobile app)
const authenticateDevice = async (req, res, next) => {
  const deviceToken = req.headers['x-device-token'];

  if (!deviceToken) {
    return res.status(401).json({
      success: false,
      error: 'Device token required'
    });
  }

  try {
    const device = await db.Device.findOne({
      where: { deviceToken },
      include: [{ model: db.User, as: 'user' }]
    });

    if (!device) {
      return res.status(401).json({
        success: false,
        error: 'Device not registered'
      });
    }

    req.device = device;
    req.user = device.user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

// Check if user owns the device
const authorizeDevice = async (req, res, next) => {
  const deviceId = req.params.deviceId || req.body.deviceId;

  if (!deviceId) {
    return next();
  }

  try {
    const device = await db.Device.findOne({
      where: {
        id: deviceId,
        userId: req.userId
      }
    });

    if (!device) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this device'
      });
    }

    req.device = device;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateToken,
  authenticateDevice,
  authorizeDevice
};
