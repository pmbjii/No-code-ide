# Deployment Guide

This guide covers deploying the Cursor AI Clone to various platforms and environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Cloud Platforms](#cloud-platforms)
4. [Self-Hosted Solutions](#self-hosted-solutions)
5. [Environment Configuration](#environment-configuration)
6. [Production Optimization](#production-optimization)
7. [Monitoring & Maintenance](#monitoring--maintenance)

## Local Development

### Quick Start

```bash
# Clone and setup
git clone https://github.com/yourusername/cursor-ai-clone.git
cd cursor-ai-clone

# Install dependencies
npm install --legacy-peer-deps

# Start development servers
npm run dev
```

### Development Servers

- **Frontend**: `http://localhost:3000` (Vite dev server)
- **Backend**: `http://localhost:5000` (Express server)
- **WebSocket**: `ws://localhost:5000` (Socket.IO)

### Build for Production

```bash
npm run build
npm start
```

## Docker Deployment

### Single Container

```dockerfile
# Use the provided Dockerfile
docker build -t cursor-ai-clone .
docker run -d -p 3000:3000 -p 5000:5000 cursor-ai-clone
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  cursor-ai-clone:
    build: .
    ports:
      - "3000:3000"
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    volumes:
      - ./workspace:/app/workspace
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Add a reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - cursor-ai-clone
    restart: unless-stopped
```

### Multi-Stage Production Build

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
RUN apk add --no-cache git bash curl python3 make g++
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 3000 5000
CMD ["npm", "start"]
```

## Cloud Platforms

### Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Configure `vercel.json`**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.js",
         "use": "@vercel/node"
       },
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server/index.js"
       },
       {
         "src": "/(.*)",
         "dest": "/dist/$1"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Netlify

1. **Build Configuration**
   Create `netlify.toml`:
   ```toml
   [build]
     publish = "dist"
     command = "npm run build"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Serverless Functions**
   Create `netlify/functions/` directory and move API routes.

3. **Deploy**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

### Heroku

1. **Create `Procfile`**
   ```
   web: npm start
   ```

2. **Configure Build**
   ```json
   {
     "scripts": {
       "heroku-postbuild": "npm run build"
     }
   }
   ```

3. **Deploy**
   ```bash
   heroku create cursor-ai-clone
   git push heroku main
   ```

### Railway

1. **Create `railway.toml`**
   ```toml
   [build]
   builder = "nixpacks"

   [deploy]
   startCommand = "npm start"
   healthcheckPath = "/api/health"
   healthcheckTimeout = 100
   restartPolicyType = "on_failure"
   ```

2. **Deploy**
   ```bash
   railway login
   railway link
   railway up
   ```

### DigitalOcean App Platform

1. **Create `.do/app.yaml`**
   ```yaml
   name: cursor-ai-clone
   services:
   - name: web
     source_dir: /
     github:
       repo: yourusername/cursor-ai-clone
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     http_port: 5000
     routes:
     - path: /
     health_check:
       http_path: /api/health
     envs:
     - key: NODE_ENV
       value: production
   ```

2. **Deploy**
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

## Self-Hosted Solutions

### VPS with PM2

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Create `ecosystem.config.js`**
   ```javascript
   module.exports = {
     apps: [{
       name: 'cursor-ai-clone',
       script: 'server/index.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'development',
         PORT: 5000
       },
       env_production: {
         NODE_ENV: 'production',
         PORT: 5000
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };
   ```

3. **Deploy**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

### Nginx Reverse Proxy

Create `/etc/nginx/sites-available/cursor-ai-clone`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header Origin "";
    }
}
```

### SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Kubernetes

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cursor-ai-clone
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cursor-ai-clone
  template:
    metadata:
      labels:
        app: cursor-ai-clone
    spec:
      containers:
      - name: cursor-ai-clone
        image: cursor-ai-clone:latest
        ports:
        - containerPort: 3000
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: cursor-ai-clone-service
spec:
  selector:
    app: cursor-ai-clone
  ports:
  - name: frontend
    port: 80
    targetPort: 3000
  - name: backend
    port: 5000
    targetPort: 5000
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f k8s/
```

## Environment Configuration

### Production Environment Variables

```env
# Server
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database (if using external DB)
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Security
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-char-encryption-key
CORS_ORIGIN=https://your-domain.com

# File Storage
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info

# Features
ENABLE_TELEMETRY=false
ENABLE_COLLABORATION=true
ENABLE_LOCAL_MODELS=true
```

### Docker Environment

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  cursor-ai-clone:
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    env_file:
      - .env.production
```

## Production Optimization

### Performance Optimizations

1. **Enable Compression**
   ```javascript
   // server/index.js
   const compression = require('compression');
   app.use(compression());
   ```

2. **Static File Caching**
   ```javascript
   app.use(express.static('dist', {
     maxAge: '1y',
     etag: false
   }));
   ```

3. **Database Connection Pooling**
   ```javascript
   // If using PostgreSQL
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

### Security Hardening

1. **Security Headers**
   ```javascript
   const helmet = require('helmet');
   app.use(helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'", "'unsafe-inline'"],
         styleSrc: ["'self'", "'unsafe-inline'"],
         imgSrc: ["'self'", "data:", "https:"],
       },
     },
   }));
   ```

2. **Rate Limiting**
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use('/api', limiter);
   ```

3. **Input Validation**
   ```javascript
   const { body, validationResult } = require('express-validator');
   
   app.post('/api/files/*',
     body('content').isLength({ max: 1000000 }),
     (req, res) => {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
       }
       // Process request
     }
   );
   ```

### Monitoring Setup

1. **Health Checks**
   ```javascript
   app.get('/api/health', (req, res) => {
     res.json({
       status: 'healthy',
       timestamp: new Date().toISOString(),
       uptime: process.uptime(),
       version: process.env.npm_package_version
     });
   });
   ```

2. **Logging**
   ```javascript
   const winston = require('winston');
   
   const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
       new winston.transports.File({ filename: 'logs/combined.log' })
     ]
   });
   ```

3. **Error Tracking**
   ```javascript
   const Sentry = require('@sentry/node');
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV
   });
   
   app.use(Sentry.Handlers.requestHandler());
   app.use(Sentry.Handlers.errorHandler());
   ```

## Monitoring & Maintenance

### Monitoring Tools

1. **Application Monitoring**
   - New Relic
   - DataDog
   - AppDynamics

2. **Infrastructure Monitoring**
   - Prometheus + Grafana
   - CloudWatch (AWS)
   - Google Cloud Monitoring

3. **Log Management**
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Splunk
   - Fluentd

### Backup Strategy

1. **File Backups**
   ```bash
   # Daily backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d)
   tar -czf /backups/workspace-$DATE.tar.gz /app/workspace
   aws s3 cp /backups/workspace-$DATE.tar.gz s3://your-backup-bucket/
   ```

2. **Database Backups**
   ```bash
   # PostgreSQL backup
   pg_dump $DATABASE_URL > /backups/db-$(date +%Y%m%d).sql
   ```

### Update Process

1. **Rolling Updates**
   ```bash
   # Zero-downtime deployment
   pm2 reload ecosystem.config.js --env production
   ```

2. **Blue-Green Deployment**
   ```bash
   # Deploy to staging
   docker-compose -f docker-compose.staging.yml up -d
   
   # Test and switch
   # Update load balancer to point to new version
   ```

### Troubleshooting

1. **Common Issues**
   - Memory leaks: Monitor with `pm2 monit`
   - High CPU: Profile with Node.js inspector
   - Database connections: Check pool status

2. **Debug Commands**
   ```bash
   # Check logs
   pm2 logs cursor-ai-clone
   
   # Monitor resources
   pm2 monit
   
   # Restart if needed
   pm2 restart cursor-ai-clone
   ```

---

**Next Steps**: After deployment, configure monitoring, set up backups, and establish a maintenance routine.