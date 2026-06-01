# Infallible - Device Anti-Theft Tracking System

A self-hosted device tracking and recovery system for Uganda. Track your own devices when stolen using GPS, network location, and remote alerts.

## Problem Statement
Phone and device theft is rampant in Uganda. Police resources are limited. Victims need tools to:
- Locate their stolen devices in real-time
- Gather evidence (location history, photos)
- Coordinate with authorities for recovery

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Mobile Client  │────▶│   API Server    │◀────│  Web Dashboard  │
│   (Android)     │     │   (Node.js)     │     │    (React)      │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────▼────────┐
                        │    Database     │
                        │   (PostgreSQL)  │
                        └─────────────────┘
```

## Components

### 1. Mobile Client (Android)
- Background location service
- IMEI/device info collection
- Stealth mode (hidden when stolen)
- Remote commands (ring, lock, wipe)
- Photo capture on unauthorized access
- Battery-efficient tracking

### 2. API Server (Node.js + Express)
- User authentication (JWT)
- Device registration
- Location data ingestion
- Alert system (Email/SMS)
- Multi-tenant (multiple users)
- WebSocket for real-time updates

### 3. Web Dashboard (React)
- Device map view (Leaflet/OpenStreetMap)
- Mark device as stolen
- Location history timeline
- Alert configuration
- Evidence collection view

### 4. Database (PostgreSQL + PostGIS)
- Users and authentication
- Devices registry
- Location history (geospatial)
- Alerts and notifications
- Evidence (photos, audio)

## Features Roadmap

### Phase 1: Foundation (MVP)
- [ ] User registration/login
- [ ] Device registration with IMEI
- [ ] Basic GPS location reporting
- [ ] Web dashboard with map
- [ ] Email alerts when device moves

### Phase 2: Core Tracking
- [ ] Background location service (Android)
- [ ] Location history and playback
- [ ] Geofencing (alert when leaving area)
- [ ] Battery-optimized tracking modes
- [ ] Network-based location fallback

### Phase 3: Anti-Theft Features
- [ ] Stealth mode activation
- [ ] Remote lock command
- [ ] Remote alarm/ring
- [ ] Front camera capture on wrong PIN
- [ ] SIM change detection
- [ ] IMEI tracking across SIM swaps

### Phase 4: Evidence & Recovery
- [ ] Photo evidence collection
- [ ] Location sharing with police
- [ ] Exportable evidence reports
- [ ] SMS alerts (for areas with poor internet)
- [ ] Offline location queuing

### Phase 5: Scale & Security
- [ ] End-to-end encryption
- [ ] Multi-device per user
- [ ] Admin dashboard
- [ ] API rate limiting
- [ ] Audit logs

## Tech Stack

| Component | Technology |
|-----------|------------|
| Mobile | Android (Kotlin), Background Services |
| Backend | Node.js, Express, Socket.io |
| Database | PostgreSQL + PostGIS |
| Frontend | React, Leaflet Maps |
| Auth | JWT, bcrypt |
| Alerts | Nodemailer, Africa's Talking SMS |
| Hosting | VPS (DigitalOcean/Hetzner) |

## Legal Considerations

This system is designed for:
- Tracking YOUR OWN devices
- Devices you have legal authority over (company devices, family)
- Cooperation with law enforcement for recovery

NOT for:
- Tracking people without consent
- Stalking or surveillance
- Unauthorized device access

## Getting Started

See individual component READMEs:
- `/server/README.md` - API server setup
- `/mobile/README.md` - Android app build
- `/dashboard/README.md` - Web dashboard setup
- `/docs/DEPLOYMENT.md` - Production deployment

## License

Private - For authorized use only
