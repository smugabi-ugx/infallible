require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const http       = require('http');
const rateLimit  = require('express-rate-limit');
const { Server } = require('socket.io');

const authRoutes    = require('./routes/auth');
const deviceRoutes  = require('./routes/devices');
const locationRoutes = require('./routes/locations');
const commandRoutes  = require('./routes/commands');
const alertRoutes    = require('./routes/alerts');
const { errorHandler }     = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const { requireRole }       = require('./middleware/rbac');
const db = require('./models');

const app    = express();
const server = http.createServer(app);

// ── CORS ─────────────────────────────────────────────────────
// Allow any *.vercel.app, explicit CORS_ORIGIN env list, or localhost
const allowOrigin = (origin, callback) => {
  if (!origin) return callback(null, true)
  const allowed = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : []
  const ok = allowed.includes(origin)
    || origin.endsWith('.vercel.app')
    || origin.startsWith('http://localhost')
  ok ? callback(null, true) : callback(new Error('CORS: ' + origin + ' not allowed'))
}

// ── Socket.io ─────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowOrigin, methods: ['GET', 'POST'] },
});
app.set('io', io);

// ── Global middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: allowOrigin, credentials: true }));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate limiters ─────────────────────────────────────────────
// Fix 4: limit mobile device registration — 10 attempts per 15 min per IP
const deviceRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many registration attempts, try again later' },
})

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Auth routes (public) ──────────────────────────────────────
app.use('/api/auth', authRoutes)

// ── Device routes ─────────────────────────────────────────────
// /by-token and /fcm-token: public mobile endpoints (rate limited)
// All other /devices routes: require JWT + owner or admin role
app.use('/api/devices', (req, res, next) => {
  const mobilePublic = ['/by-token', '/fcm-token']
  if (mobilePublic.includes(req.path) && req.method === 'PUT') {
    return deviceRegisterLimiter(req, res, next)
  }
  authenticateToken(req, res, next)
}, deviceRoutes)

// ── Location, command, alert routes ───────────────────────────
// Mobile app posts locations with x-device-token header (no JWT needed)
app.use('/api/locations', (req, res, next) => {
  const deviceToken = req.headers['x-device-token'] || req.body?.deviceToken
  if (deviceToken && req.method === 'POST') return next() // mobile reporting
  authenticateToken(req, res, next)                       // dashboard reading
}, locationRoutes)

app.use('/api/commands', (req, res, next) => {
  const deviceToken = req.headers['x-device-token'] || req.body?.deviceToken
  const isPoll = req.method === 'GET' && req.path.startsWith('/pending/')
  const isAck  = req.method === 'POST' && req.path.startsWith('/ack/')
  if (deviceToken && (isPoll || isAck)) return next()     // mobile polling/acking
  authenticateToken(req, res, next)                       // dashboard sending
}, commandRoutes)

app.use('/api/alerts', authenticateToken, alertRoutes)

// ── Error handler ─────────────────────────────────────────────
app.use(errorHandler)

// ── Socket.io events ──────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('subscribe',   (deviceId) => socket.join(`device:${deviceId}`))
  socket.on('unsubscribe', (deviceId) => socket.leave(`device:${deviceId}`))

  socket.on('device:register', async ({ deviceToken }) => {
    if (!deviceToken) return
    socket.join(`token:${deviceToken}`)
    console.log(`Mobile registered: token:${deviceToken.slice(0, 8)}...`)
    try {
      await db.Device.update(
        { isOnline: true, lastSeenAt: new Date() },
        { where: { deviceToken } }
      )
    } catch {}
  })

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id))
})

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000

async function startServer() {
  try {
    await db.sequelize.authenticate()
    console.log('Database connected')
    await db.sequelize.sync({ force: false, alter: process.env.NODE_ENV === 'development' })
    console.log('Models synced')
    server.listen(PORT, () => console.log(`Infallible server running on port ${PORT}`))
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
module.exports = { app, io }
