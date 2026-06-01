# System Architecture

## High-Level Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         INFALLIBLE SYSTEM                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐    │
│  │   MOBILE    │         │   SERVER    │         │  DASHBOARD  │    │
│  │   CLIENT    │◀───────▶│    API      │◀───────▶│    WEB      │    │
│  │  (Android)  │  HTTPS  │  (Node.js)  │  HTTPS  │   (React)   │    │
│  └──────┬──────┘         └──────┬──────┘         └─────────────┘    │
│         │                       │                                    │
│         │                       │                                    │
│         ▼                       ▼                                    │
│  ┌─────────────┐         ┌─────────────┐                            │
│  │   DEVICE    │         │  DATABASE   │                            │
│  │  SENSORS    │         │ (PostgreSQL)│                            │
│  │ GPS/Network │         │  + PostGIS  │                            │
│  └─────────────┘         └─────────────┘                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Mobile Client (Android)

```
┌─────────────────────────────────────────┐
│           ANDROID APPLICATION           │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐    ┌─────────────┐    │
│  │    UI       │    │  Location   │    │
│  │  Activities │    │  Service    │    │
│  └──────┬──────┘    └──────┬──────┘    │
│         │                  │            │
│         ▼                  ▼            │
│  ┌─────────────────────────────────┐   │
│  │         Core Module             │   │
│  │  - Auth Manager                 │   │
│  │  - Device Info Collector        │   │
│  │  - Location Manager             │   │
│  │  - Command Handler              │   │
│  │  - Offline Queue                │   │
│  └─────────────────────────────────┘   │
│                  │                      │
│                  ▼                      │
│  ┌─────────────────────────────────┐   │
│  │       Network Module            │   │
│  │  - API Client (Retrofit)        │   │
│  │  - FCM Handler                  │   │
│  │  - WebSocket Client             │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Key Components:**
- **Location Service**: Foreground service for continuous tracking
- **Device Admin**: Prevents uninstall, enables remote wipe
- **FCM Receiver**: Handles remote commands
- **Offline Queue**: SQLite for storing locations when offline

### 2. Backend API Server

```
┌─────────────────────────────────────────┐
│           NODE.JS SERVER               │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         Express Router          │   │
│  │  /api/auth    - Authentication  │   │
│  │  /api/devices - Device CRUD     │   │
│  │  /api/locations - Location data │   │
│  │  /api/alerts  - Alert config    │   │
│  │  /api/commands - Remote cmds    │   │
│  └─────────────────────────────────┘   │
│                  │                      │
│                  ▼                      │
│  ┌─────────────────────────────────┐   │
│  │        Middleware Stack         │   │
│  │  - JWT Authentication           │   │
│  │  - Rate Limiting                │   │
│  │  - Request Validation           │   │
│  │  - Error Handling               │   │
│  └─────────────────────────────────┘   │
│                  │                      │
│                  ▼                      │
│  ┌─────────────────────────────────┐   │
│  │         Service Layer           │   │
│  │  - User Service                 │   │
│  │  - Device Service               │   │
│  │  - Location Service             │   │
│  │  - Alert Service                │   │
│  │  - Notification Service         │   │
│  └─────────────────────────────────┘   │
│                  │                      │
│                  ▼                      │
│  ┌─────────────────────────────────┐   │
│  │        Data Access Layer        │   │
│  │  - PostgreSQL (Sequelize ORM)   │   │
│  │  - Redis (Caching/Sessions)     │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 3. Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │   users     │      │   devices   │      │  locations  │ │
│  ├─────────────┤      ├─────────────┤      ├─────────────┤ │
│  │ id (PK)     │──┐   │ id (PK)     │──┐   │ id (PK)     │ │
│  │ email       │  │   │ user_id(FK) │◀─┘   │ device_id   │ │
│  │ password    │  │   │ name        │  │   │ latitude    │ │
│  │ phone       │  └──▶│ imei        │  │   │ longitude   │ │
│  │ created_at  │      │ model       │  │   │ accuracy    │ │
│  │ verified    │      │ is_stolen   │  │   │ battery     │ │
│  └─────────────┘      │ last_seen   │  │   │ provider    │ │
│                       │ created_at  │  └──▶│ timestamp   │ │
│                       └─────────────┘      │ created_at  │ │
│                                            └─────────────┘ │
│                                                             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │   alerts    │      │  commands   │      │  evidence   │ │
│  ├─────────────┤      ├─────────────┤      ├─────────────┤ │
│  │ id (PK)     │      │ id (PK)     │      │ id (PK)     │ │
│  │ device_id   │      │ device_id   │      │ device_id   │ │
│  │ type        │      │ type        │      │ type        │ │
│  │ config      │      │ payload     │      │ file_path   │ │
│  │ enabled     │      │ status      │      │ metadata    │ │
│  │ created_at  │      │ created_at  │      │ created_at  │ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Communication Flow

```
NORMAL TRACKING:
Mobile ──[POST /locations]──▶ Server ──[Store]──▶ Database
                                │
                                ▼
                        [Check Geofences]
                                │
                                ▼
                        [Trigger Alerts if needed]
                                │
                                ▼
Dashboard ◀──[WebSocket]─── Server

THEFT MODE:
User marks stolen on Dashboard
        │
        ▼
Dashboard ──[POST /devices/:id/stolen]──▶ Server
                                            │
                                            ▼
                                    [Update device status]
                                            │
                                            ▼
                                    [Send FCM to mobile]
                                            │
                                            ▼
Mobile receives FCM ──▶ [Enable stealth mode]
                       [Increase tracking frequency]
                       [Enable camera capture]

REMOTE COMMANDS:
Dashboard ──[POST /commands]──▶ Server ──[FCM]──▶ Mobile
                                    │
Mobile ──[POST /commands/:id/ack]──▶ Server
                                    │
                                    ▼
                            [Update command status]
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. TRANSPORT SECURITY                                      │
│     └── HTTPS/TLS 1.3 for all communications               │
│                                                             │
│  2. AUTHENTICATION                                          │
│     └── JWT tokens (access + refresh)                      │
│     └── bcrypt password hashing                            │
│     └── Device-specific tokens                             │
│                                                             │
│  3. AUTHORIZATION                                           │
│     └── User can only access own devices                   │
│     └── Role-based access (user/admin)                     │
│     └── Shared links with limited permissions              │
│                                                             │
│  4. DATA PROTECTION                                         │
│     └── Encrypted sensitive fields                         │
│     └── Secure file storage for evidence                   │
│     └── Database encryption at rest                        │
│                                                             │
│  5. API SECURITY                                            │
│     └── Rate limiting per user/IP                          │
│     └── Input validation (Joi/Zod)                         │
│     └── SQL injection prevention (ORM)                     │
│     └── XSS protection (helmet.js)                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 PRODUCTION DEPLOYMENT                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────────┐                         │
│                    │  Cloudflare │                         │
│                    │    (CDN)    │                         │
│                    └──────┬──────┘                         │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │    Nginx    │                         │
│                    │   (Proxy)   │                         │
│                    └──────┬──────┘                         │
│                           │                                 │
│           ┌───────────────┼───────────────┐                │
│           │               │               │                 │
│    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐        │
│    │   API       │ │   API       │ │  Dashboard  │        │
│    │  Server 1   │ │  Server 2   │ │   Static    │        │
│    │  (PM2)      │ │  (PM2)      │ │   Files     │        │
│    └──────┬──────┘ └──────┬──────┘ └─────────────┘        │
│           │               │                                 │
│           └───────┬───────┘                                │
│                   │                                         │
│            ┌──────▼──────┐                                 │
│            │  PostgreSQL │                                 │
│            │  + PostGIS  │                                 │
│            └─────────────┘                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
