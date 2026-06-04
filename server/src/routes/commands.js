const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../models');
const { authorizeDevice } = require('../middleware/auth');
const { sendNotification } = require('../services/firebase');

// GET /api/commands?deviceId=xxx  — dashboard format
router.get('/', async (req, res, next) => {
  try {
    const { deviceId, status } = req.query
    if (!deviceId) return res.status(400).json({ success: false, error: 'deviceId required' })

    // Verify the authenticated user owns this device
    const device = await db.Device.findOne({ where: { id: deviceId, userId: req.userId } })
    if (!device) return res.status(403).json({ success: false, error: 'Not authorized' })

    const where = { deviceId }
    if (status) where.status = status

    const commands = await db.Command.findAll({ where, order: [['createdAt', 'DESC']], limit: 50 })
    res.json({ success: true, commands })
  } catch (error) { next(error) }
})

router.get('/:deviceId', authorizeDevice, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { status } = req.query;

    const where = { deviceId };
    if (status) {
      where.status = status;
    }

    const commands = await db.Command.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      commands
    });
  } catch (error) {
    next(error);
  }
});

// Send command — supports POST /commands { deviceId, type } (dashboard)
// and POST /commands/:deviceId { type } (legacy)
router.post('/', [
  body('deviceId').notEmpty().withMessage('deviceId required'),
  body('type').isIn(['ring','lock','wipe','locate','message','photo','stealth_on','stealth_off','tracking_high','tracking_low','tracking_off']),
  body('payload').optional().isObject()
], async (req, res, next) => {
  req.params.deviceId = req.body.deviceId
  const { authorizeDevice } = require('../middleware/auth')
  authorizeDevice(req, res, () => handleSendCommand(req, res, next))
})

router.post('/:deviceId', [
  authorizeDevice,
  body('type').isIn([
    'ring', 'lock', 'wipe', 'locate', 'message',
    'photo', 'stealth_on', 'stealth_off',
    'tracking_high', 'tracking_low', 'tracking_off'
  ]),
  body('payload').optional().isObject()
], async (req, res, next) => handleSendCommand(req, res, next))

async function handleSendCommand(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const device = req.device;
    const { type, payload } = req.body;

    // Create command record
    const command = await db.Command.create({
      deviceId: device.id,
      type,
      payload,
      status: 'pending',
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    });

    const io = req.app.get('io');
    const commandPayload = {
      commandId:   command.id,
      commandType: type,
      payload:     payload || {}
    };

    // ── 1. Push via Socket.io (instant — works when app is open/background) ──
    const socketRoom = `token:${device.deviceToken}`;
    const delivered  = io.to(socketRoom).emit('command', commandPayload);
    console.log(`[Commands] Emitted to ${socketRoom}`);

    // ── 2. Also emit to dashboard room so UI updates in real-time ──
    io.to(`device:${device.id}`).emit('command:sent', {
      deviceId: device.id,
      command: { id: command.id, type, status: 'sent' }
    });

    await command.update({ status: 'sent', sentAt: new Date() });

    // ── 3. FCM as optional extra delivery (if Firebase ever gets configured) ──
    if (device.fcmToken && process.env.FIREBASE_PROJECT_ID) {
      try {
        await sendNotification(device.fcmToken, {
          type: 'command',
          commandId: command.id,
          commandType: type,
          payload
        });
      } catch (fcmError) {
        console.warn('[Commands] FCM fallback failed:', fcmError.message);
        // Don't fail the request — socket delivery already happened
      }
    }

    res.status(201).json({
      success: true,
      command
    });
  } catch (error) {
    next(error);
  }
});

// Acknowledge command execution (from mobile)
router.post('/ack/:commandId', async (req, res, next) => {
  try {
    const { commandId } = req.params;
    const { deviceToken, status, errorMessage } = req.body;

    // Verify device
    const device = await db.Device.findOne({
      where: { deviceToken }
    });

    if (!device) {
      return res.status(401).json({
        success: false,
        error: 'Invalid device token'
      });
    }

    const command = await db.Command.findOne({
      where: {
        id: commandId,
        deviceId: device.id
      }
    });

    if (!command) {
      return res.status(404).json({
        success: false,
        error: 'Command not found'
      });
    }

    const updateData = {
      status: status === 'success' ? 'executed' : 'failed'
    };

    if (status === 'success') {
      updateData.executedAt = new Date();
    } else {
      updateData.errorMessage = errorMessage;
    }

    await command.update(updateData);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`device:${device.id}`).emit('command:ack', {
      commandId: command.id,
      status: command.status
    });

    res.json({
      success: true,
      command
    });
  } catch (error) {
    next(error);
  }
});

// Get pending commands (for mobile polling fallback)
router.get('/pending/:deviceToken', async (req, res, next) => {
  try {
    const { deviceToken } = req.params;

    const device = await db.Device.findOne({
      where: { deviceToken }
    });

    if (!device) {
      return res.status(401).json({
        success: false,
        error: 'Invalid device token'
      });
    }

    const commands = await db.Command.findAll({
      where: {
        deviceId: device.id,
        status: ['pending', 'sent'],
        expiresAt: {
          [db.Sequelize.Op.gt]: new Date()
        }
      },
      order: [['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      commands
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
