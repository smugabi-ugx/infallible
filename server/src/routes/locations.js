const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const db = require('../models');
const { authorizeDevice, authenticateDevice } = require('../middleware/auth');
const { checkAlerts } = require('../services/alerts');

// Get location history for a device
router.get('/:deviceId', authorizeDevice, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const {
      from,
      to,
      limit = 100,
      offset = 0
    } = req.query;

    const where = { deviceId };

    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt[Op.gte] = new Date(from);
      if (to) where.recordedAt[Op.lte] = new Date(to);
    }

    const { count, rows: locations } = await db.Location.findAndCountAll({
      where,
      order: [['recordedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      total: count,
      locations
    });
  } catch (error) {
    next(error);
  }
});

// Get latest location for a device
router.get('/:deviceId/latest', authorizeDevice, async (req, res, next) => {
  try {
    const location = await db.Location.findOne({
      where: { deviceId: req.params.deviceId },
      order: [['recordedAt', 'DESC']]
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'No location data available'
      });
    }

    res.json({
      success: true,
      location
    });
  } catch (error) {
    next(error);
  }
});

// Report location (from mobile device)
router.post('/report', [
  body('deviceToken').notEmpty(),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('accuracy').optional().isFloat(),
  body('recordedAt').optional().isISO8601()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Accept device token from header (x-device-token) OR body
    const deviceToken = req.headers['x-device-token'] || req.body.deviceToken;
    const { ...locationData } = req.body;

    if (!deviceToken) {
      return res.status(401).json({ success: false, error: 'Device token required' });
    }

    // Find device by token
    const device = await db.Device.findOne({
      where: { deviceToken }
    });

    if (!device) {
      return res.status(401).json({
        success: false,
        error: 'Invalid device token'
      });
    }

    // Create location record
    const location = await db.Location.create({
      deviceId: device.id,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy,
      altitude: locationData.altitude,
      speed: locationData.speed,
      bearing: locationData.bearing,
      provider: locationData.provider || 'fused',
      batteryLevel: locationData.batteryLevel,
      isCharging: locationData.isCharging,
      networkType: locationData.networkType,
      wifiSSID: locationData.wifiSSID,
      cellTower: locationData.cellTower,
      recordedAt: locationData.recordedAt || new Date()
    });

    // Update device's last location
    await device.update({
      lastLatitude: location.latitude,
      lastLongitude: location.longitude,
      lastSeenAt: location.recordedAt,
      lastBatteryLevel: location.batteryLevel,
      isOnline: true
    });

    // Check if any alerts should trigger
    await checkAlerts(device, location);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`device:${device.id}`).emit('location:update', {
      deviceId: device.id,
      location
    });

    res.status(201).json({
      success: true,
      locationId: location.id
    });
  } catch (error) {
    next(error);
  }
});

// Batch report locations (for offline queue sync)
router.post('/report/batch', [
  body('deviceToken').notEmpty(),
  body('locations').isArray({ min: 1, max: 100 })
], async (req, res, next) => {
  try {
    const { deviceToken, locations } = req.body;

    const device = await db.Device.findOne({
      where: { deviceToken }
    });

    if (!device) {
      return res.status(401).json({
        success: false,
        error: 'Invalid device token'
      });
    }

    // Prepare location records
    const locationRecords = locations.map(loc => ({
      deviceId: device.id,
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy,
      altitude: loc.altitude,
      speed: loc.speed,
      bearing: loc.bearing,
      provider: loc.provider || 'fused',
      batteryLevel: loc.batteryLevel,
      isCharging: loc.isCharging,
      networkType: loc.networkType,
      recordedAt: loc.recordedAt || new Date()
    }));

    // Bulk insert
    const created = await db.Location.bulkCreate(locationRecords);

    // Update device with latest location
    const latestLoc = locationRecords.sort((a, b) =>
      new Date(b.recordedAt) - new Date(a.recordedAt)
    )[0];

    await device.update({
      lastLatitude: latestLoc.latitude,
      lastLongitude: latestLoc.longitude,
      lastSeenAt: latestLoc.recordedAt,
      lastBatteryLevel: latestLoc.batteryLevel,
      isOnline: true
    });

    res.status(201).json({
      success: true,
      count: created.length
    });
  } catch (error) {
    next(error);
  }
});

// Get location stats
router.get('/:deviceId/stats', authorizeDevice, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { days = 7 } = req.query;

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const stats = await db.Location.findAll({
      where: {
        deviceId,
        recordedAt: { [Op.gte]: since }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalPoints'],
        [db.sequelize.fn('MIN', db.sequelize.col('recordedAt')), 'firstSeen'],
        [db.sequelize.fn('MAX', db.sequelize.col('recordedAt')), 'lastSeen'],
        [db.sequelize.fn('AVG', db.sequelize.col('accuracy')), 'avgAccuracy']
      ],
      raw: true
    });

    res.json({
      success: true,
      stats: stats[0] || {}
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
