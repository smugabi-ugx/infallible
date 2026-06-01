# Production Deployment Guide

## Server Requirements

- VPS with 2GB+ RAM (4GB recommended)
- Ubuntu 22.04 LTS
- PostgreSQL 14+ with PostGIS extension
- Node.js 18 LTS
- Nginx
- SSL certificate (Let's Encrypt)

## Quick Deploy (Ubuntu)

### 1. System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL + PostGIS
sudo apt install -y postgresql postgresql-contrib postgis

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Create database
sudo -u postgres createuser infallible -P
sudo -u postgres createdb infallible -O infallible

# Enable PostGIS
sudo -u postgres psql -d infallible -c "CREATE EXTENSION postgis;"
```

### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/youruser/infallible.git /opt/infallible
cd /opt/infallible/server

# Install dependencies
npm install --production

# Create .env file
cp .env.example .env
nano .env  # Configure your settings

# Run database migrations
npm run db:migrate

# Start with PM2
pm2 start src/index.js --name infallible
pm2 save
pm2 startup
```

### 4. Nginx Configuration

```nginx
# /etc/nginx/sites-available/infallible
server {
    listen 80;
    server_name tracking.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tracking.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/tracking.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tracking.yourdomain.com/privkey.pem;

    # API
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Static dashboard
    location / {
        root /opt/infallible/dashboard/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/infallible /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tracking.yourdomain.com
```

### 6. Build Dashboard

```bash
cd /opt/infallible/dashboard
npm install
npm run build
```

### 7. Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
API_URL=https://tracking.yourdomain.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=infallible
DB_USER=infallible
DB_PASSWORD=<strong-password>

# JWT (generate secure keys!)
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@yourdomain.com
SMTP_PASS=<app-password>
EMAIL_FROM="Infallible <alerts@yourdomain.com>"

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# Security
CORS_ORIGIN=https://tracking.yourdomain.com
```

## Monitoring

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs infallible

# Monitor resources
pm2 monit
```

### Database Backup

```bash
# Create backup script
cat > /opt/infallible/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/var/backups/infallible
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U infallible infallible | gzip > $BACKUP_DIR/infallible_$DATE.sql.gz
find $BACKUP_DIR -mtime +7 -delete
EOF

chmod +x /opt/infallible/backup.sh

# Add to crontab (daily at 3 AM)
echo "0 3 * * * /opt/infallible/backup.sh" | sudo crontab -
```

## Security Checklist

- [ ] Strong database password
- [ ] Unique JWT secrets
- [ ] HTTPS enabled
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] Regular backups
- [ ] System updates automated
- [ ] Log rotation configured

## Scaling

For higher load:

1. **Database**: Add read replicas, connection pooling (PgBouncer)
2. **API**: Run multiple Node instances behind load balancer
3. **Caching**: Add Redis for sessions and frequently accessed data
4. **CDN**: Use Cloudflare for static assets and DDoS protection

## Troubleshooting

### API not responding
```bash
pm2 logs infallible --lines 50
```

### Database connection failed
```bash
sudo -u postgres psql -c "\l"
```

### WebSocket not connecting
Check Nginx proxy headers and firewall rules.

### Location not updating
Check device FCM token and mobile app logs.
