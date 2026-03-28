# Forge Backend Specification

**Project:** Forge AI Platform  
**Status:** MVP Backend Specification  
**Frontend:** Live at https://forge-operator-arroyo.netlify.app  
**GitHub:** https://github.com/carswqqqq1/forge-operator

---

## Overview

Forge is an autonomous AI agent platform for lead generation and business automation. The frontend is complete and deployed. This document specifies the backend infrastructure needed to make it fully functional.

**Core Features:**
- User authentication (signup, login, OAuth)
- Task creation and execution
- Credit-based billing system
- Team collaboration
- API key management
- Notification system
- Analytics and reporting

---

## Technology Stack

**Recommended:**
- **Runtime:** Node.js 18+ or Python 3.11+
- **Framework:** Express.js / FastAPI
- **Database:** PostgreSQL (relational data) + Redis (caching/queues)
- **Authentication:** JWT + OAuth2 (Google, Apple)
- **Payments:** Stripe API
- **Email:** SendGrid or Resend
- **Task Queue:** Bull (Node) or Celery (Python)
- **Hosting:** Railway, Render, or Vercel (serverless)

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  credits INT DEFAULT 0,
  subscription_tier VARCHAR(50) DEFAULT 'lite',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  input_data JSONB,
  output_data JSONB,
  credits_used INT DEFAULT 0,
  execution_time_ms INT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Credits Table
```sql
CREATE TABLE credits (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  amount INT NOT NULL,
  transaction_type VARCHAR(50),
  description VARCHAR(255),
  balance_before INT,
  balance_after INT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Teams Table
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'viewer',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### API Keys Table
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## API Endpoints

### Authentication

**POST /api/auth/signup**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "firstName": "John",
  "lastName": "Doe"
}
```
Response: `{ token, user }`

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```
Response: `{ token, user }`

**POST /api/auth/oauth**
```json
{
  "provider": "google",
  "code": "oauth_code"
}
```
Response: `{ token, user }`

**POST /api/auth/logout**
Response: `{ success: true }`

**GET /api/auth/me**
Headers: `Authorization: Bearer {token}`
Response: `{ user }`

---

### Tasks

**POST /api/tasks**
```json
{
  "title": "Generate leads for landscaping",
  "description": "Find 50 landscaping companies in Denver",
  "input": {
    "industry": "landscaping",
    "location": "Denver, CO",
    "count": 50
  }
}
```
Response: `{ task }`

**GET /api/tasks**
Query: `?status=pending&limit=10&offset=0`
Response: `{ tasks, total }`

**GET /api/tasks/:id**
Response: `{ task }`

**PUT /api/tasks/:id**
```json
{
  "status": "completed",
  "output": { /* results */ }
}
```
Response: `{ task }`

**DELETE /api/tasks/:id**
Response: `{ success: true }`

---

### Credits

**GET /api/credits/balance**
Response: `{ balance, tier, usage }`

**GET /api/credits/history**
Query: `?limit=20&offset=0`
Response: `{ transactions, total }`

**POST /api/credits/purchase**
```json
{
  "amount": 1000,
  "stripeToken": "tok_..."
}
```
Response: `{ transaction, newBalance }`

---

### Teams

**POST /api/teams**
```json
{
  "name": "Arroyo Marketing"
}
```
Response: `{ team }`

**GET /api/teams**
Response: `{ teams }`

**GET /api/teams/:id**
Response: `{ team, members }`

**POST /api/teams/:id/members**
```json
{
  "email": "member@example.com",
  "role": "editor"
}
```
Response: `{ member }`

**PUT /api/teams/:id/members/:memberId**
```json
{
  "role": "viewer"
}
```
Response: `{ member }`

**DELETE /api/teams/:id/members/:memberId**
Response: `{ success: true }`

---

### API Keys

**POST /api/keys**
```json
{
  "name": "Production API Key"
}
```
Response: `{ key, maskedKey }`

**GET /api/keys**
Response: `{ keys }`

**DELETE /api/keys/:id**
Response: `{ success: true }`

**POST /api/keys/:id/regenerate**
Response: `{ key, maskedKey }`

---

### Notifications

**GET /api/notifications**
Query: `?unread=true&limit=20`
Response: `{ notifications, unread_count }`

**PUT /api/notifications/:id/read**
Response: `{ notification }`

**DELETE /api/notifications/:id**
Response: `{ success: true }`

---

### Settings

**GET /api/settings**
Response: `{ settings }`

**PUT /api/settings**
```json
{
  "theme": "light",
  "language": "en",
  "timezone": "America/Denver",
  "emailNotifications": true
}
```
Response: `{ settings }`

---

## Authentication Flow

1. **Signup:** User submits email/password → Hash password → Create user record → Generate JWT
2. **Login:** User submits credentials → Verify password → Generate JWT → Return token
3. **OAuth:** User clicks "Sign in with Google/Apple" → Redirect to provider → Verify code → Create/update user → Generate JWT
4. **Protected Routes:** Include `Authorization: Bearer {token}` header → Verify JWT signature → Extract user_id → Proceed

**JWT Structure:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## Credit System

**Pricing Model:**
- Lite: 100 credits/month, $0
- Core: 1000 credits/month, $29
- Max: 10000 credits/month, $99

**Credit Costs:**
- Lead generation: 10 credits per lead
- Research task: 50 credits
- Email outreach: 5 credits per email
- API call: 1 credit per 100 calls

**Flow:**
1. User creates task
2. System estimates credits needed
3. Check user balance
4. If insufficient → Show upgrade prompt
5. Execute task → Deduct credits
6. Log transaction in credits table
7. Send notification if balance low

---

## Task Execution

**Queue System:**
1. Task created → Added to Redis queue
2. Worker picks up task
3. Execute agent/research/automation
4. Store results in output_data
5. Update task status to "completed"
6. Send notification to user
7. Log credits used

**Task Statuses:**
- `pending` → Waiting in queue
- `running` → Currently executing
- `completed` → Done successfully
- `failed` → Error occurred
- `cancelled` → User cancelled

---

## Notification System

**Types:**
- `task_completed` → Task finished
- `task_failed` → Task error
- `low_credits` → Balance below threshold
- `team_invite` → New team member
- `system_alert` → Important updates

**Delivery:**
1. Create notification record
2. Send in-app notification (real-time via WebSocket)
3. Send email if user enabled email notifications
4. Mark as read when user views

---

## Error Handling

**HTTP Status Codes:**
- `200` → Success
- `201` → Created
- `400` → Bad request (validation error)
- `401` → Unauthorized (missing/invalid token)
- `403` → Forbidden (insufficient permissions)
- `404` → Not found
- `409` → Conflict (duplicate email, etc.)
- `429` → Rate limited
- `500` → Server error

**Error Response Format:**
```json
{
  "error": "Invalid email format",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "message": "Must be valid email"
  }
}
```

---

## Security

**Requirements:**
- All passwords hashed with bcrypt (salt rounds: 12)
- All API keys hashed with SHA-256
- HTTPS only (no HTTP)
- CORS configured for frontend domain
- Rate limiting: 100 requests/minute per IP
- SQL injection prevention (parameterized queries)
- XSS protection (sanitize inputs)
- CSRF tokens for state-changing operations

**Headers:**
```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000
```

---

## Deployment

**Environment Variables:**
```
DATABASE_URL=postgresql://user:pass@host/forge
REDIS_URL=redis://host:6379
JWT_SECRET=your_secret_key_here
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG...
GOOGLE_OAUTH_ID=...
GOOGLE_OAUTH_SECRET=...
APPLE_OAUTH_ID=...
APPLE_OAUTH_SECRET=...
FRONTEND_URL=https://forge-operator-arroyo.netlify.app
NODE_ENV=production
```

**Deployment Steps:**
1. Set up PostgreSQL database
2. Run migrations
3. Set environment variables
4. Deploy to Railway/Render/Vercel
5. Configure domain/SSL
6. Set up monitoring/logging
7. Test all endpoints

---

## Testing Checklist

- [ ] User signup/login works
- [ ] OAuth integration works
- [ ] JWT tokens valid
- [ ] Task creation deducts credits
- [ ] Task execution completes
- [ ] Notifications sent
- [ ] Team invites work
- [ ] API keys generate/revoke
- [ ] Settings persist
- [ ] Error handling works
- [ ] Rate limiting works
- [ ] Database queries optimized

---

## Next Steps

1. **Choose backend framework** (Express.js recommended for speed)
2. **Set up database** (PostgreSQL on Railway or similar)
3. **Implement authentication** (start with email/password)
4. **Build task system** (basic CRUD first)
5. **Add credit tracking**
6. **Wire frontend to backend**
7. **Deploy and test**

---

## Frontend Integration Points

All frontend components are ready to connect:

**Components waiting for API:**
- `UserProfileDropdown` → `/api/auth/me`, `/api/settings`
- `AnalyticsDashboard` → `/api/tasks`, `/api/credits/history`
- `TeamCollaboration` → `/api/teams`, `/api/teams/:id/members`
- `APIKeyManagement` → `/api/keys`
- `NotificationBell` → `/api/notifications` (WebSocket for real-time)
- `AdvancedSearch` → `/api/tasks?search=...`
- `Settings` → `/api/settings`

**Expected API Response Times:**
- Auth endpoints: < 200ms
- Task endpoints: < 500ms
- Credit endpoints: < 100ms
- Notification endpoints: < 100ms

---

## Estimated Development Time

| Component | Time |
|-----------|------|
| Database setup | 1 hour |
| Authentication | 2 hours |
| Task system | 2 hours |
| Credits system | 1 hour |
| API endpoints | 2 hours |
| Error handling | 1 hour |
| Testing | 2 hours |
| Deployment | 1 hour |
| **Total** | **~12 hours** |

---

## Support

For questions on implementation:
- Check frontend components in `/client/src/components/`
- Review API endpoint signatures in this spec
- Test with Postman/Insomnia before integrating

**Frontend repo:** https://github.com/carswqqqq1/forge-operator
