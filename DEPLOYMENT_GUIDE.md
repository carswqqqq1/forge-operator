# Forge Operator Deployment Guide

## Prerequisites

- Node.js 22.13.0+
- MySQL 8.0+
- Ollama (optional, for local models)
- NVIDIA API key (optional, for cloud models)

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/carswqqqq1/forge-operator.git
cd forge-operator
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Variables
Create `.env.local`:
```bash
# Database
DATABASE_URL=mysql://user:password@localhost:3306/forge_operator

# OAuth
MANUS_OAUTH_CLIENT_ID=your_client_id
MANUS_OAUTH_CLIENT_SECRET=your_client_secret
MANUS_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/callback

# Ollama (optional)
OLLAMA_URL=http://localhost:11434

# NVIDIA (optional)
NVIDIA_API_KEY=your_nvidia_api_key
NVIDIA_MODEL_FAST=meta/llama-3.1-8b-instruct
NVIDIA_MODEL_DEFAULT=meta/llama-3.1-70b-instruct
NVIDIA_MODEL_REASONING=deepseek-ai/deepseek-v3.1

# Owner
OWNER_OPEN_ID=your_manus_open_id

# Node
NODE_ENV=production
PORT=3000
```

## Database Setup

### 1. Create Database
```bash
mysql -u root -p
CREATE DATABASE forge_operator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Run Migrations
```bash
# Initial schema
pnpm drizzle-kit push

# Add user ownership (CRITICAL)
mysql -u user -p forge_operator < drizzle/0003_add_user_ownership.sql
```

### 3. Verify Schema
```bash
mysql -u user -p forge_operator
SHOW TABLES;
DESCRIBE conversations;
```

## Build & Deploy

### Development
```bash
pnpm dev
# Runs on http://localhost:3000
```

### Production Build
```bash
pnpm build
pnpm start
```

### Docker Deployment
```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
```

Build and run:
```bash
docker build -t forge-operator .
docker run -p 3000:3000 --env-file .env.local forge-operator
```

## Security Checklist

- [ ] Database migrations applied
- [ ] All environment variables configured
- [ ] HTTPS enabled in production
- [ ] OAuth credentials configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] API keys rotated
- [ ] Database backups configured
- [ ] Monitoring/logging enabled
- [ ] Auth endpoints tested

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
```bash
# Development
pnpm dev 2>&1 | tee logs/app.log

# Production
docker logs forge-operator
```

### Metrics
- CPU usage
- Memory usage
- Database connections
- API response time
- Error rate

## Scaling

### Horizontal Scaling
```bash
# Load balancer configuration (nginx)
upstream forge {
  server localhost:3000;
  server localhost:3001;
  server localhost:3002;
}

server {
  listen 80;
  location / {
    proxy_pass http://forge;
  }
}
```

### Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX idx_conversations_userId ON conversations(userId);
CREATE INDEX idx_messages_conversationId ON messages(conversationId);
CREATE INDEX idx_agent_tasks_userId ON agent_tasks(userId);
```

## Backup & Recovery

### Backup Database
```bash
mysqldump -u user -p forge_operator > backup.sql
```

### Restore Database
```bash
mysql -u user -p forge_operator < backup.sql
```

### Automated Backups
```bash
# Daily backup script
0 2 * * * mysqldump -u user -p forge_operator | gzip > /backups/forge_$(date +\%Y\%m\%d).sql.gz
```

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
Solution: Verify MySQL is running and DATABASE_URL is correct

### Auth Failure
```
Error: Unauthorized
```
Solution: Check OAuth credentials and session cookies

### Out of Memory
```
Error: JavaScript heap out of memory
```
Solution: Increase Node.js heap size:
```bash
NODE_OPTIONS=--max-old-space-size=4096 pnpm start
```

### Slow Queries
```bash
# Enable MySQL slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

## Performance Tuning

### Connection Pooling
```typescript
// In db.ts
const pool = mysql.createPool({
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

### Caching
```typescript
// Redis caching example
import redis from 'redis';
const client = redis.createClient();
```

### Query Optimization
```sql
-- Add composite indexes
CREATE INDEX idx_messages_conv_created ON messages(conversationId, createdAt);
```

## Maintenance

### Regular Tasks
- [ ] Monitor disk space
- [ ] Review error logs
- [ ] Update dependencies
- [ ] Rotate API keys
- [ ] Test backups
- [ ] Review security

### Monthly
- [ ] Performance review
- [ ] Database optimization
- [ ] Security audit
- [ ] Capacity planning

## Support

For issues or questions:
1. Check logs: `docker logs forge-operator`
2. Review documentation: `AUDIT_REPORT.md`, `API_DOCUMENTATION.md`
3. Check GitHub issues: https://github.com/carswqqqq1/forge-operator/issues
