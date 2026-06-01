const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const { authorizeDevice } = require('../middleware/auth');
const { sendNotification } = require('../services/firebase');

// Get all devices for current user
router.get('/', async (req, res, next) => {
  try {
    const devices = await db.Device.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      devices
    });
  } catch (error) {
    next(error);
  }
});

// Get single device
router.get('/:deviceId', authorizeDevice, async (req, res, next) => {
  try {
    const device = await db.Device.findOne({
      where: {
        id: req.params.deviceId,
        userId: req.userId
      },
      include: [
        {
          model: db.Location,
          as: 'locations',
          limit: 1,
          order: [['recordedAt', 'DESC']]
        }
      ]
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.json({
      success: true,
      device
    });
  } catch (error) {
    next(error);
  }
});

// Register new device
router.post('/', [
  body('name').trim().notEmpty().withMessage('Device name is required'),
  body('imei').optional().trim(),
  body('model').optional().trim(),
  body('manufacturer').optional().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      name, imei, imei2, serialNumber, model,
      manufacturer, androidVersion, phoneNumber,
      simOperator, simSerialNumber, fcmToken
    } = req.body;

    // Generate unique device token
    const deviceToken = uuidv4();

    const device = await db.Device.create({
      userId: req.userId,
      name,
      imei,
      imei2,
      serialNumber,
      model,
      manufacturer,
      androidVersion,
      phoneNumber,
      simOperator,
      simSerialNumber,
      fcmToken,
      deviceToken
    });

    res.status(201).json({
      success: true,
      device,
      deviceToken // Send this to mobile app for future auth
    });
  } catch (error) {
    next(error);
  }
});

// Register / update FCM token (called by mobile app — device token auth only, no JWT)
router.put('/fcm-token', async (req, res, next) => {
  try {
    const { deviceToken, fcmToken } = req.body;
    if (!deviceToken) return res.status(400).json({ success: false, error: 'deviceToken required' });
    if (!fcmToken)    return res.status(400).json({ success: false, error: 'fcmToken required' });

    const device = await db.Device.findOne({ where: { deviceToken } });
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    await device.update({ fcmToken, isOnline: true, lastSeenAt: new Date() });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Update device by token (used by mobile app on first launch)
router.put('/by-token', async (req, res, next) => {
  try {
    const { deviceToken, model, manufacturer, androidVersion, batteryLevel, networkType } = req.body;
    if (!deviceToken) return res.status(400).json({ success: false, error: 'deviceToken required' });

    const device = await db.Device.findOne({ where: { deviceToken } });
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    const updates = {};
    if (model)          updates.model          = model;
    if (manufacturer)   updates.manufacturer   = manufacturer;
    if (androidVersion) updates.androidVersion = androidVersion;
    if (batteryLevel != null) updates.lastBatteryLevel = batteryLevel;

    await device.update(updates);
    res.json({ success: true, device });
  } catch (error) {
    next(error);
  }
});

// Update device
router.put('/:deviceId', authorizeDevice, async (req, res, next) => {
  try {
    const device = req.device;
    const allowedFields = [
      'name', 'fcmToken', 'phoneNumber', 'simOperator',
      'simSerialNumber', 'trackingMode'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await device.update(updates);

    res.json({
      success: true,
      device
    });
  } catch (error) {
    next(error);
  }
});

// Mark device as stolen
router.post('/:deviceId/stolen', authorizeDevice, async (req, res, next) => {
  try {
    const device = req.device;

    await device.update({
      isStolen: true,
      stolenAt: new Date(),
      trackingMode: 'high',
      isStealthMode: true
    });

    // Send FCM notification to device to enable theft mode
    if (device.fcmToken) {
      try {
        await sendNotification(device.fcmToken, {
          type: 'theft_mode',
          payload: {
            isStolen: true,
            trackingMode: 'high',
            stealthMode: true
          }
        });
      } catch (fcmError) {
        console.error('FCM notification failed:', fcmError);
      }
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`device:${device.id}`).emit('device:stolen', {
      deviceId: device.id,
      isStolen: true,
      stolenAt: device.stolenAt
    });

    res.json({
      success: true,
      message: 'Device marked as stolen. Theft mode activated.',
      device
    });
  } catch (error) {
    next(error);
  }
});

// Mark device as recovered
router.post('/:deviceId/recovered', authorizeDevice, async (req, res, next) => {
  try {
    const device = req.device;

    await device.update({
      isStolen: false,
      stolenAt: null,
      trackingMode: 'balanced',
      isStealthMode: false
    });

    // Send FCM notification
    if (device.fcmToken) {
      try {
        await sendNotification(device.fcmToken, {
          type: 'theft_mode',
          payload: {
            isStolen: false,
            trackingMode: 'balanced',
            stealthMode: false
          }
        });
      } catch (fcmError) {
        console.error('FCM notification failed:', fcmError);
      }
    }

    res.json({
      success: true,
      message: 'Device marked as recovered.',
      device
    });
  } catch (error) {
    next(error);
  }
});

// Delete device
router.delete('/:deviceId', authorizeDevice, async (req, res, next) => {
  try {
    const device = req.device;

    // Delete related records
    await db.Location.destroy({ where: { deviceId: device.id } });
    await db.Command.destroy({ where: { deviceId: device.id } });
    await db.Alert.destroy({ where: { deviceId: device.id } });
    await db.Evidence.destroy({ where: { deviceId: device.id } });
    
    await device.destroy();

    res.json({
      success: true,
      message: 'Device deleted'
    });
  } catch (error) {
    next(error);
  }
});

// Generate shareable tracking link
router.post('/:deviceId/share', authorizeDevice, async (req, res, next) => {
  try {
    const { expiresIn = '24h' } = req.body;
    const device = req.device;

    // Create a limited access token
    const shareToken = jwt.sign(
      {
        deviceId: device.id,
        type: 'share',
        permissions: ['view_location']
      },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    const shareUrl = `${process.env.API_URL}/track/${shareToken}`;

    res.json({
      success: true,
      shareUrl,
      expiresIn
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
