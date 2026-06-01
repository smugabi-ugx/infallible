const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../models');
const { authorizeDevice } = require('../middleware/auth');

// Get alerts for a device
router.get('/:deviceId', authorizeDevice, async (req, res, next) => {
  try {
    const alerts = await db.Alert.findAll({
      where: { deviceId: req.params.deviceId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    next(error);
  }
});

// Create alert
router.post('/:deviceId', [
  authorizeDevice,
  body('type').isIn([
    'geofence_exit', 'geofence_enter', 'movement',
    'sim_change', 'low_battery', 'offline', 'wrong_pin'
  ]),
  body('config').optional().isObject(),
  body('notifyEmail').optional().isBoolean(),
  body('notifySms').optional().isBoolean(),
  body('notifyPush').optional().isBoolean()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { type, config, notifyEmail, notifySms, notifyPush } = req.body;

    const alert = await db.Alert.create({
      deviceId: req.params.deviceId,
      type,
      config,
      notifyEmail: notifyEmail !== undefined ? notifyEmail : true,
      notifySms: notifySms !== undefined ? notifySms : false,
      notifyPush: notifyPush !== undefined ? notifyPush : true
    });

    res.status(201).json({
      success: true,
      alert
    });
  } catch (error) {
    next(error);
  }
});

// Update alert
router.put('/:alertId', async (req, res, next) => {
  try {
    const alert = await db.Alert.findByPk(req.params.alertId, {
      include: [{ model: db.Device, as: 'device' }]
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    // Check ownership
    if (alert.device.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const allowedFields = ['config', 'enabled', 'notifyEmail', 'notifySms', 'notifyPush'];
    const updates = {};
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await alert.update(updates);

    res.json({
      success: true,
      alert
    });
  } catch (error) {
    next(error);
  }
});

// Delete alert
router.delete('/:alertId', async (req, res, next) => {
  try {
    const alert = await db.Alert.findByPk(req.params.alertId, {
      include: [{ model: db.Device, as: 'device' }]
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    if (alert.device.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    await alert.destroy();

    res.json({
      success: true,
      message: 'Alert deleted'
    });
  } catch (error) {
    next(error);
  }
});

// Create geofence alert (convenience endpoint)
router.post('/:deviceId/geofence', [
  authorizeDevice,
  body('name').trim().notEmpty(),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('radius').isFloat({ min: 50, max: 50000 }) // 50m to 50km
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, latitude, longitude, radius, type = 'geofence_exit' } = req.body;

    const alert = await db.Alert.create({
      deviceId: req.params.deviceId,
      type,
      config: {
        name,
        center: { latitude, longitude },
        radius
      },
      notifyEmail: true,
      notifyPush: true
    });

    res.status(201).json({
      success: true,
      alert
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
