# Server Setup Guide

Quick guide to get the Infallible server running locally or on a VPS.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+ with PostGIS
- Git

## Local Development

### 1. Clone and Install

```bash
cd C:\Users\DELL\Desktop\Tracking\server
npm install
```

### 2. Setup PostgreSQL

Windows:
- Download from https://www.postgresql.org/download/windows/
- Install with Stack Builder and add PostGIS

Create database:
```sql
CREATE DATABASE infallible;
CREATE EXTENSION postgis;
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=infallible
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=dev-secret-key-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
```

### 4. Start Server

```bash
npm run dev
```

Server runs at http://localhost:3000

## Dashboard Development

### 1. Install Dependencies

```bash
cd C:\Users\DELL\Desktop\Tracking\dashboard
npm install
```

### 2. Start Dev Server

```bash
npm run dev
```

Dashboard runs at http://localhost:5173

The Vite dev server proxies API requests to the Node server.

## Test the API

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Register Device
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Phone","imei":"123456789012345"}'
```

### Report Location (from device)
```bash
curl -X POST http://localhost:3000/api/locations/report \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "YOUR_DEVICE_TOKEN",
    "latitude": 0.3136,
    "longitude": 32.5811,
    "accuracy": 10,
    "batteryLevel": 85,
    "recordedAt": "2024-01-15T10:30:00Z"
  }'
```

## File Structure

```
C:\Users\DELL\Desktop\Tracking\
├── README.md                 # Project overview
├── docs/
│   ├── ARCHITECTURE.md       # System design
│   ├── DEPLOYMENT.md         # Production setup
│   └── ROADMAP.md           # Development roadmap
├── server/                   # Node.js API
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js         # Entry point
│       ├── config/          # Database config
│       ├── models/          # Sequelize models
│       ├── routes/          # API routes
│       ├── services/        # Business logic
│       └── middleware/      # Auth, errors
├── dashboard/               # React frontend
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── pages/
│       ├── components/
│       ├── store/
│       └── lib/
└── mobile/                  # Android app (placeholder)
    └── README.md
```

## Next Steps

1. Set up PostgreSQL and run the server
2. Open dashboard and create an account
3. Register a test device
4. Build the Android app (see mobile/README.md)
5. Deploy to production (see docs/DEPLOYMENT.md)

## Common Issues

### "Connection refused" to database
- Check PostgreSQL is running
- Verify credentials in .env
- Check firewall allows port 5432

### "Invalid token" errors
- Clear browser localStorage
- Check JWT_SECRET matches between restarts

### WebSocket not connecting
- Make sure server is running on port 3000
- Check browser console for CORS errors
