const express = require('express')
const router  = express.Router()
const db      = require('../models')

// POST /api/evidence/photo — mobile uploads a captured photo (base64)
// Device token auth only — no JWT needed
router.post('/photo', async (req, res, next) => {
  try {
    const deviceToken = req.headers['x-device-token'] || req.body.deviceToken
    if (!deviceToken) return res.status(401).json({ success: false, error: 'Device token required' })

    const device = await db.Device.findOne({ where: { deviceToken } })
    if (!device) return res.status(401).json({ success: false, error: 'Invalid device token' })

    const { imageBase64, commandId, trigger = 'remote_command' } = req.body
    if (!imageBase64) return res.status(400).json({ success: false, error: 'imageBase64 required' })

    // Store as data URL — simple, no disk needed
    const filePath = `data:image/jpeg;base64,${imageBase64}`

    const evidence = await db.Evidence.create({
      deviceId:   device.id,
      type:       'photo',
      filePath,
      mimeType:   'image/jpeg',
      fileSize:   Math.round(imageBase64.length * 0.75), // approx bytes
      trigger,
      capturedAt: new Date(),
      metadata:   { commandId, source: 'front_camera' },
    })

    // Update device last seen
    await device.update({ lastSeenAt: new Date(), isOnline: true })

    // Notify dashboard in real-time
    const io = req.app.get('io')
    io.to(`device:${device.id}`).emit('evidence:new', {
      deviceId: device.id,
      evidence: { id: evidence.id, type: 'photo', capturedAt: evidence.capturedAt, filePath },
    })

    res.status(201).json({ success: true, evidenceId: evidence.id })
  } catch (error) { next(error) }
})

// GET /api/evidence/:deviceId — dashboard fetches evidence for a device
router.get('/:deviceId', async (req, res, next) => {
  try {
    const evidence = await db.Evidence.findAll({
      where: { deviceId: req.params.deviceId },
      order: [['capturedAt', 'DESC']],
      limit: 50,
    })
    res.json({ success: true, evidence })
  } catch (error) { next(error) }
})

module.exports = router
