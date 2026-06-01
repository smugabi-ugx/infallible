require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const locationRoutes = require('./routes/locations');
const commandRoutes = require('./routes/commands');
const alertRoutes = require('./routes/alerts');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const db = require('./models');

const app = express();
const server = http.createServer(app);

// Socket.io setup for real-time updates
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', authenticateToken, deviceRoutes);
app.use('/api/locations', authenticateToken, locationRoutes);
app.use('/api/commands', authenticateToken, commandRoutes);
app.use('/api/alerts', authenticateToken, alertRoutes);

// Error handling
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Dashboard subscribes by deviceId (UUID)
  socket.on('subscribe', (deviceId) => {
    socket.join(`device:${deviceId}`);
    console.log(`Dashboard subscribed to device:${deviceId}`);
  });

  socket.on('unsubscribe', (deviceId) => {
    socket.leave(`device:${deviceId}`);
  });

  // Mobile app registers by deviceToken — joins its own command room
  socket.on('device:register', async ({ deviceToken }) => {
    if (!deviceToken) return;
    socket.join(`token:${deviceToken}`);
    console.log(`Mobile device registered: token:${deviceToken.slice(0, 8)}...`);

    // Mark device as online
    try {
      const db = require('./models');
      await db.Device.update(
        { isOnline: true, lastSeenAt: new Date() },
        { where: { deviceToken } }
      );
    } catch {}
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Database sync and server start
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('Database connected successfully');
    
    // Sync models (in dev only - use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync({ alter: true });
      console.log('Database models synced');
    }
    
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║         INFALLIBLE SERVER RUNNING          ║
╠════════════════════════════════════════════╣
║  Port: ${PORT}                                 ║
║  Mode: ${process.env.NODE_ENV || 'development'}                       ║
║  Time: ${new Date().toISOString()}    ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io };
