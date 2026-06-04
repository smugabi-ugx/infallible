const express = require('express')
const router  = express.Router()
const https   = require('https')
const db      = require('../models')

// Upload base64 image to Cloudinary (free tier: 25GB, 25k transforms/month)
// Set CLOUDINARY_URL in Render env vars:
//   cloudinary://API_KEY:API_SECRET@CLOUD_NAME
// OR set CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET separately
async function uploadToCloudinary(base64Data) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey    = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    // Fallback: store as data URL in DB (works for small photos, ~200KB limit)
    return { url: `data:image/jpeg;base64,${base64Data}`, provider: 'inline' }
  }

  const body = JSON.stringify({
    file:            `data:image/jpeg;base64,${base64Data}`,
    folder:          'infallible/evidence',
    resource_type:   'image',
    transformation:  [{ quality: 'auto', width: 640, crop: 'limit' }],
  })

  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
    const req  = https.request(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method:  'POST',
        headers: {
          'Content-Type':   'application/json',
          'Authorization':  `Basic ${auth}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve({ url: json.secure_url, publicId: json.public_id, provider: 'cloudinary' })
          } catch { reject(new Error('Cloudinary response parse error')) }
        })
      }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// POST /api/evidence/photo — mobile uploads captured photo
router.post('/photo', async (req, res, next) => {
  try {
    const deviceToken = req.headers['x-device-token'] || req.body.deviceToken
    if (!deviceToken) return res.status(401).json({ success: false, error: 'Device token required' })

    const device = await db.Device.findOne({ where: { deviceToken } })
    if (!device) return res.status(401).json({ success: false, error: 'Invalid device token' })

    const { imageBase64, commandId, trigger = 'remote_command' } = req.body
    if (!imageBase64) return res.status(400).json({ success: false, error: 'imageBase64 required' })

    // Upload to Cloudinary (or store inline if not configured)
    const upload = await uploadToCloudinary(imageBase64)

    const evidence = await db.Evidence.create({
      deviceId:   device.id,
      type:       'photo',
      filePath:   upload.url,
      mimeType:   'image/jpeg',
      fileSize:   Math.round(imageBase64.length * 0.75),
      trigger,
      capturedAt: new Date(),
      metadata:   { commandId, source: 'front_camera', provider: upload.provider, publicId: upload.publicId },
    })

    await device.update({ lastSeenAt: new Date(), isOnline: true })

    const io = req.app.get('io')
    io.to(`device:${device.id}`).emit('evidence:new', {
      deviceId: device.id,
      evidence: { id: evidence.id, type: 'photo', filePath: upload.url, capturedAt: evidence.capturedAt },
    })

    res.status(201).json({ success: true, evidenceId: evidence.id, url: upload.url })
  } catch (error) { next(error) }
})

// GET /api/evidence/:deviceId — dashboard fetches evidence
router.get('/:deviceId', async (req, res, next) => {
  try {
    const evidence = await db.Evidence.findAll({
      where:  { deviceId: req.params.deviceId },
      order:  [['capturedAt', 'DESC']],
      limit:  50,
    })
    res.json({ success: true, evidence })
  } catch (error) { next(error) }
})

module.exports = router
