# Forge Backend - Codex Implementation Prompts

**Purpose:** Copy-paste these prompts into Codex to build the entire Forge backend automatically.  
**Project:** Forge AI Platform  
**Frontend:** https://forge-operator-arroyo.netlify.app  
**GitHub:** https://github.com/carswqqqq1/forge-operator

---

## PROMPT 1: Project Setup & Database Schema

```
You are building the backend for Forge, an AI-powered lead generation platform. 

TASK: Set up a complete Express.js backend with PostgreSQL database.

REQUIREMENTS:
1. Create Express.js project with proper folder structure
2. Set up PostgreSQL database with complete schema
3. Configure environment variables
4. Set up database connection pool

FOLDER STRUCTURE:
```
forge-backend/
├── server.js
├── .env
├── .env.example
├── package.json
├── db/
│   ├── connection.js
│   ├── schema.sql
│   └── seed.sql
├── routes/
│   ├── auth.js
│   ├── tasks.js
│   ├── credits.js
│   ├── teams.js
│   ├── notifications.js
│   └── settings.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── validation.js
├── controllers/
│   ├── authController.js
│   ├── taskController.js
│   ├── creditController.js
│   └── teamController.js
├── utils/
│   ├── jwt.js
│   ├── email.js
│   └── stripe.js
└── tests/
    └── auth.test.js
```

DEPENDENCIES:
- express
- cors
- dotenv
- pg (PostgreSQL)
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- uuid
- nodemon (dev)

DATABASE SCHEMA (PostgreSQL):

Users Table:
- id (UUID PRIMARY KEY)
- email (VARCHAR UNIQUE NOT NULL)
- password_hash (VARCHAR)
- first_name (VARCHAR)
- last_name (VARCHAR)
- avatar_url (VARCHAR)
- oauth_provider (VARCHAR)
- oauth_id (VARCHAR)
- credits (INT DEFAULT 0)
- subscription_tier (VARCHAR DEFAULT 'lite')
- created_at (TIMESTAMP DEFAULT NOW())
- updated_at (TIMESTAMP DEFAULT NOW())
- deleted_at (TIMESTAMP NULL)

Tasks Table:
- id (UUID PRIMARY KEY)
- user_id (UUID FOREIGN KEY REFERENCES users)
- title (VARCHAR NOT NULL)
- description (TEXT)
- status (VARCHAR DEFAULT 'pending')
- input_data (JSONB)
- output_data (JSONB)
- credits_used (INT DEFAULT 0)
- execution_time_ms (INT)
- created_at (TIMESTAMP DEFAULT NOW())
- completed_at (TIMESTAMP NULL)

Credits Table:
- id (UUID PRIMARY KEY)
- user_id (UUID FOREIGN KEY REFERENCES users)
- amount (INT NOT NULL)
- transaction_type (VARCHAR)
- description (VARCHAR)
- balance_before (INT)
- balance_after (INT)
- created_at (TIMESTAMP DEFAULT NOW())

Teams Table:
- id (UUID PRIMARY KEY)
- name (VARCHAR NOT NULL)
- owner_id (UUID FOREIGN KEY REFERENCES users)
- created_at (TIMESTAMP DEFAULT NOW())
- updated_at (TIMESTAMP DEFAULT NOW())

Team Members Table:
- id (UUID PRIMARY KEY)
- team_id (UUID FOREIGN KEY REFERENCES teams)
- user_id (UUID FOREIGN KEY REFERENCES users)
- role (VARCHAR DEFAULT 'viewer')
- joined_at (TIMESTAMP DEFAULT NOW())
- UNIQUE(team_id, user_id)

API Keys Table:
- id (UUID PRIMARY KEY)
- user_id (UUID FOREIGN KEY REFERENCES users)
- name (VARCHAR NOT NULL)
- key_hash (VARCHAR UNIQUE NOT NULL)
- last_used_at (TIMESTAMP NULL)
- created_at (TIMESTAMP DEFAULT NOW())
- revoked_at (TIMESTAMP NULL)

Notifications Table:
- id (UUID PRIMARY KEY)
- user_id (UUID FOREIGN KEY REFERENCES users)
- type (VARCHAR)
- title (VARCHAR)
- message (TEXT)
- read_at (TIMESTAMP NULL)
- created_at (TIMESTAMP DEFAULT NOW())

DELIVERABLES:
1. Complete package.json with all dependencies
2. .env.example file with all required variables
3. db/connection.js - PostgreSQL connection pool
4. db/schema.sql - Complete database schema
5. db/seed.sql - Sample data for testing
6. server.js - Main Express server with middleware setup
7. middleware/auth.js - JWT authentication middleware
8. middleware/errorHandler.js - Global error handling
9. routes/auth.js - Stub routes (will be filled in next prompt)

IMPORTANT:
- Use async/await for all database operations
- Implement proper error handling
- Use connection pooling for database
- Add CORS configuration for frontend URL
- Use environment variables for all sensitive data
- Add request validation middleware
```

---

## PROMPT 2: Authentication System

```
You are building the authentication system for Forge backend.

TASK: Implement complete user authentication with signup, login, and JWT.

REQUIREMENTS:
1. User signup with email/password
2. User login with email/password
3. JWT token generation and verification
4. Get current user endpoint
5. Logout endpoint
6. Password hashing with bcryptjs
7. Input validation
8. Error handling

ENDPOINTS TO IMPLEMENT:

POST /api/auth/signup
Request: { email, password, firstName, lastName }
Response: { token, user: { id, email, firstName, lastName, credits } }
Errors: 400 (validation), 409 (email exists), 500 (server)

POST /api/auth/login
Request: { email, password }
Response: { token, user: { id, email, firstName, lastName, credits } }
Errors: 400 (validation), 401 (invalid credentials), 500 (server)

GET /api/auth/me
Headers: Authorization: Bearer {token}
Response: { user: { id, email, firstName, lastName, credits, subscriptionTier } }
Errors: 401 (no token), 401 (invalid token), 500 (server)

POST /api/auth/logout
Headers: Authorization: Bearer {token}
Response: { success: true }

IMPLEMENTATION DETAILS:
- Use bcryptjs with salt rounds of 12
- JWT expiration: 7 days
- Store JWT_SECRET in environment variable
- Validate email format
- Validate password length (min 8 characters)
- Hash passwords before storing
- Never return password_hash in responses
- Log authentication attempts for security

DELIVERABLES:
1. routes/auth.js - All authentication endpoints
2. controllers/authController.js - Authentication logic
3. utils/jwt.js - JWT token generation and verification
4. middleware/validation.js - Input validation functions
5. Updated middleware/auth.js - JWT verification middleware
6. Error handling for all edge cases

SECURITY REQUIREMENTS:
- Passwords hashed with bcryptjs (12 rounds)
- JWT tokens signed with secret key
- CORS enabled for frontend domain only
- Rate limiting on signup/login (implement basic version)
- SQL injection prevention (use parameterized queries)
```

---

## PROMPT 3: Tasks System

```
You are building the task management system for Forge.

TASK: Implement complete task CRUD operations with credit system integration.

REQUIREMENTS:
1. Create tasks with credit deduction
2. List user's tasks with filtering
3. Get single task details
4. Update task status
5. Delete tasks
6. Track task execution time
7. Store task results

ENDPOINTS TO IMPLEMENT:

POST /api/tasks
Headers: Authorization: Bearer {token}
Request: { title, description, input }
Response: { task: { id, userId, title, description, status, inputData, createdAt } }
Logic:
  - Estimate credits needed (50 credits default)
  - Check user balance
  - If insufficient: return 402 error
  - Create task in database
  - Return task object

GET /api/tasks
Headers: Authorization: Bearer {token}
Query: ?status=pending&limit=10&offset=0&search=query
Response: { tasks: [...], total: number }
Logic:
  - Filter by user_id
  - Filter by status if provided
  - Support search by title/description
  - Pagination with limit/offset
  - Order by created_at DESC

GET /api/tasks/:id
Headers: Authorization: Bearer {token}
Response: { task: {...} }
Logic:
  - Verify task belongs to user
  - Return 404 if not found
  - Include input_data and output_data

PUT /api/tasks/:id
Headers: Authorization: Bearer {token}
Request: { status, outputData, executionTimeMs, creditsUsed }
Response: { task: {...} }
Logic:
  - Verify task belongs to user
  - Update status
  - Store output_data
  - Update completed_at if status = completed
  - Deduct actual credits used
  - Log credit transaction

DELETE /api/tasks/:id
Headers: Authorization: Bearer {token}
Response: { success: true }
Logic:
  - Verify task belongs to user
  - Soft delete or hard delete
  - Return 404 if not found

TASK STATUSES:
- pending (waiting in queue)
- running (currently executing)
- completed (finished successfully)
- failed (error occurred)
- cancelled (user cancelled)

DELIVERABLES:
1. routes/tasks.js - All task endpoints
2. controllers/taskController.js - Task logic
3. Task creation with credit validation
4. Task listing with filtering and search
5. Task update with credit deduction
6. Error handling for all scenarios

INTEGRATION:
- Integrate with credits system (deduct credits on task creation)
- Integrate with notifications (notify on completion)
- Track execution metrics
```

---

## PROMPT 4: Credits & Billing System

```
You are building the credits and billing system for Forge.

TASK: Implement credit tracking, usage, and balance management.

REQUIREMENTS:
1. Track user credit balance
2. Log all credit transactions
3. Deduct credits on task execution
4. Add credits on purchase
5. Check balance before task execution
6. Generate usage reports

ENDPOINTS TO IMPLEMENT:

GET /api/credits/balance
Headers: Authorization: Bearer {token}
Response: { balance: number, tier: string, usage: { thisMonth: number, limit: number } }

GET /api/credits/history
Headers: Authorization: Bearer {token}
Query: ?limit=20&offset=0&type=debit
Response: { transactions: [...], total: number }

POST /api/credits/purchase
Headers: Authorization: Bearer {token}
Request: { amount: number, stripeToken: string }
Response: { transaction: {...}, newBalance: number }
Logic:
  - Validate amount
  - Process Stripe payment
  - Add credits to user account
  - Log transaction
  - Return success

CREDIT PRICING:
- Lite Tier: 100 credits/month, FREE
- Core Tier: 1000 credits/month, $29/month
- Max Tier: 10000 credits/month, $99/month

CREDIT COSTS:
- Lead generation: 10 credits per lead
- Research task: 50 credits
- Email outreach: 5 credits per email
- API call: 1 credit per 100 calls
- Custom task: 25-100 credits (variable)

TRANSACTION TYPES:
- debit (task execution)
- credit (purchase)
- refund (cancelled task)
- monthly_allowance (tier benefit)
- bonus (promotional)

DELIVERABLES:
1. routes/credits.js - All credit endpoints
2. controllers/creditController.js - Credit logic
3. utils/creditCalculator.js - Credit cost calculation
4. Credit deduction function (used by tasks)
5. Credit purchase function (Stripe integration stub)
6. Transaction logging
7. Balance validation before task execution

FEATURES:
- Real-time balance updates
- Transaction history with filters
- Low balance alerts (< 10 credits)
- Monthly credit reset for tier users
- Overage handling
- Refund logic for failed tasks

STRIPE INTEGRATION (stub for now):
- Accept Stripe token
- Validate payment
- Add credits on success
- Handle payment failures
```

---

## PROMPT 5: Teams & Collaboration

```
You are building the team collaboration system for Forge.

TASK: Implement team management, member invites, and permissions.

REQUIREMENTS:
1. Create teams
2. Invite team members
3. Manage member roles
4. Remove team members
5. List team members
6. Permission-based access control

ENDPOINTS TO IMPLEMENT:

POST /api/teams
Headers: Authorization: Bearer {token}
Request: { name: string }
Response: { team: { id, name, ownerId, createdAt } }

GET /api/teams
Headers: Authorization: Bearer {token}
Response: { teams: [...] }

GET /api/teams/:id
Headers: Authorization: Bearer {token}
Response: { team: {...}, members: [...] }

POST /api/teams/:id/members
Headers: Authorization: Bearer {token}
Request: { email: string, role: 'viewer'|'editor' }
Response: { member: {...}, inviteSent: true }
Logic:
  - Verify user is team owner
  - Find user by email
  - Add to team_members table
  - Send invite email
  - Return member object

PUT /api/teams/:id/members/:memberId
Headers: Authorization: Bearer {token}
Request: { role: 'viewer'|'editor' }
Response: { member: {...} }
Logic:
  - Verify user is team owner
  - Update role
  - Cannot change owner role

DELETE /api/teams/:id/members/:memberId
Headers: Authorization: Bearer {token}
Response: { success: true }
Logic:
  - Verify user is team owner
  - Remove from team_members
  - Cannot remove owner

ROLES:
- owner (full access, can invite/remove)
- editor (can create/edit tasks)
- viewer (read-only access)

DELIVERABLES:
1. routes/teams.js - All team endpoints
2. controllers/teamController.js - Team logic
3. Team creation and management
4. Member invite system
5. Role-based access control
6. Permission checking middleware

FEATURES:
- Team ownership transfer
- Bulk member invite
- Member activity tracking
- Team-level settings
```

---

## PROMPT 6: API Keys & Notifications

```
You are building API key management and notification system for Forge.

TASK: Implement API key generation/revocation and notification delivery.

REQUIREMENTS:
1. Generate API keys
2. Revoke API keys
3. Regenerate API keys
4. Track API key usage
5. Send notifications
6. Mark notifications as read

ENDPOINTS TO IMPLEMENT:

POST /api/keys
Headers: Authorization: Bearer {token}
Request: { name: string }
Response: { key: string, maskedKey: string, createdAt }
Logic:
  - Generate random key (sk_live_...)
  - Hash key for storage
  - Store in database
  - Return full key (only shown once!)
  - Return masked key for display

GET /api/keys
Headers: Authorization: Bearer {token}
Response: { keys: [...] }

DELETE /api/keys/:id
Headers: Authorization: Bearer {token}
Response: { success: true }

POST /api/keys/:id/regenerate
Headers: Authorization: Bearer {token}
Response: { key: string, maskedKey: string }

GET /api/notifications
Headers: Authorization: Bearer {token}
Query: ?unread=true&limit=20
Response: { notifications: [...], unreadCount: number }

PUT /api/notifications/:id/read
Headers: Authorization: Bearer {token}
Response: { notification: {...} }

DELETE /api/notifications/:id
Headers: Authorization: Bearer {token}
Response: { success: true }

NOTIFICATION TYPES:
- task_completed (task finished)
- task_failed (task error)
- low_credits (balance < 10)
- team_invite (invited to team)
- system_alert (important updates)

DELIVERABLES:
1. routes/notifications.js - Notification endpoints
2. controllers/notificationController.js - Notification logic
3. API key generation and hashing
4. API key validation middleware
5. Notification creation function
6. Notification delivery system
7. Email notification stub (SendGrid integration)

FEATURES:
- API key rate limiting
- Key usage tracking
- Notification preferences
- Email and in-app notifications
- Notification archiving
```

---

## PROMPT 7: Settings & User Management

```
You are building the user settings system for Forge.

TASK: Implement user preferences, profile updates, and account settings.

REQUIREMENTS:
1. Get user settings
2. Update user profile
3. Update preferences
4. Update notification settings
5. Change password
6. Delete account

ENDPOINTS TO IMPLEMENT:

GET /api/settings
Headers: Authorization: Bearer {token}
Response: { settings: { theme, language, timezone, emailNotifications, ... } }

PUT /api/settings
Headers: Authorization: Bearer {token}
Request: { theme, language, timezone, emailNotifications, ... }
Response: { settings: {...} }

PUT /api/profile
Headers: Authorization: Bearer {token}
Request: { firstName, lastName, avatarUrl }
Response: { user: {...} }

POST /api/password/change
Headers: Authorization: Bearer {token}
Request: { currentPassword, newPassword }
Response: { success: true }
Logic:
  - Verify current password
  - Hash new password
  - Update in database
  - Invalidate existing tokens

DELETE /api/account
Headers: Authorization: Bearer {token}
Request: { password: string }
Response: { success: true }
Logic:
  - Verify password
  - Soft delete user (set deleted_at)
  - Anonymize user data
  - Notify user via email

SETTINGS STRUCTURE:
{
  theme: 'light' | 'dark' | 'auto',
  language: 'en' | 'es' | 'fr' | 'de',
  timezone: 'America/Denver' | ...,
  emailNotifications: boolean,
  taskCompletionAlerts: boolean,
  lowCreditAlerts: boolean,
  weeklyDigest: boolean
}

DELIVERABLES:
1. routes/settings.js - Settings endpoints
2. controllers/settingsController.js - Settings logic
3. Profile update functionality
4. Password change with verification
5. Account deletion (soft delete)
6. Settings persistence
7. User preferences management

FEATURES:
- Settings validation
- Profile picture upload (stub)
- Password strength validation
- Account recovery
- Data export
```

---

## PROMPT 8: Integration & Deployment

```
You are finalizing the Forge backend for deployment.

TASK: Set up error handling, logging, testing, and deployment configuration.

REQUIREMENTS:
1. Global error handling
2. Request logging
3. API documentation
4. Health check endpoint
5. Rate limiting
6. CORS configuration
7. Environment-specific config
8. Deployment scripts

DELIVERABLES:
1. middleware/errorHandler.js - Global error handler
2. middleware/logging.js - Request/response logging
3. middleware/rateLimit.js - Rate limiting (100 req/min per IP)
4. server.js updates - Complete server setup
5. .env.example - All environment variables
6. docker-compose.yml (optional) - Local development
7. Procfile - Deployment configuration
8. README.md - Setup and deployment instructions
9. API documentation (OpenAPI/Swagger stub)
10. Health check endpoint (/health)

ERROR HANDLING:
- Catch all errors globally
- Log errors with stack traces
- Return consistent error format
- Don't expose sensitive info in errors
- Return appropriate HTTP status codes

LOGGING:
- Log all requests (method, path, status, duration)
- Log errors with full context
- Log authentication attempts
- Log credit transactions
- Use timestamps for all logs

RATE LIMITING:
- 100 requests per minute per IP
- 1000 requests per day per user
- Stricter limits for auth endpoints (10/min)

CORS:
- Allow frontend domain only
- Allow credentials
- Allow necessary headers

ENVIRONMENT VARIABLES:
DATABASE_URL
JWT_SECRET
STRIPE_SECRET_KEY
SENDGRID_API_KEY
GOOGLE_OAUTH_ID
GOOGLE_OAUTH_SECRET
APPLE_OAUTH_ID
APPLE_OAUTH_SECRET
FRONTEND_URL
NODE_ENV
PORT

DEPLOYMENT OPTIONS:
1. Railway (recommended)
   - Connect GitHub repo
   - Add PostgreSQL plugin
   - Set environment variables
   - Deploy

2. Render
   - Create Web Service
   - Connect GitHub
   - Add PostgreSQL database
   - Deploy

3. Vercel (serverless)
   - Use serverless functions
   - Connect external PostgreSQL
   - Deploy

FINAL CHECKLIST:
- All endpoints implemented
- Error handling complete
- Logging configured
- Rate limiting active
- CORS configured
- Environment variables set
- Database migrations ready
- Tests passing
- Documentation complete
- Ready for deployment
```

---

## PROMPT 9: Frontend Integration

```
You are integrating the Forge frontend with the newly built backend.

TASK: Update all frontend API calls to connect to the backend.

REQUIREMENTS:
1. Update authentication flow
2. Update task creation/listing
3. Update credit display
4. Update team management
5. Update API key management
6. Update notifications
7. Add error handling
8. Add loading states

COMPONENTS TO UPDATE:

1. Login.tsx
   - Replace mock auth with /api/auth/login
   - Store JWT token in localStorage
   - Redirect to dashboard on success
   - Show error messages

2. UserProfileDropdown.tsx
   - Fetch /api/auth/me on mount
   - Display real user data
   - Call /api/auth/logout on logout
   - Redirect to login

3. Home.tsx (Dashboard)
   - Fetch /api/tasks on mount
   - Display real tasks
   - Show real credit balance from /api/credits/balance
   - Update task status when completed

4. AnalyticsDashboard.tsx
   - Fetch /api/tasks for metrics
   - Fetch /api/credits/history for spending
   - Calculate real statistics
   - Show real charts

5. TeamCollaboration.tsx
   - Fetch /api/teams/:id on mount
   - Call /api/teams/:id/members to invite
   - Call /api/teams/:id/members/:id to change role
   - Call DELETE /api/teams/:id/members/:id to remove

6. APIKeyManagement.tsx
   - Fetch /api/keys on mount
   - Call POST /api/keys to create
   - Call DELETE /api/keys/:id to revoke
   - Call POST /api/keys/:id/regenerate

7. NotificationBell.tsx
   - Fetch /api/notifications on mount
   - Setup WebSocket for real-time updates
   - Mark as read on click
   - Delete notification

8. Settings.tsx
   - Fetch /api/settings on mount
   - Call PUT /api/settings to save
   - Call PUT /api/profile to update profile
   - Call POST /api/password/change for password

API BASE URL:
const API_URL = process.env.REACT_APP_API_URL || 'https://your-backend.com';

AUTHENTICATION HEADER:
const token = localStorage.getItem('token');
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

ERROR HANDLING:
- Catch network errors
- Show error toast messages
- Redirect to login on 401
- Show retry buttons on failures
- Log errors for debugging

LOADING STATES:
- Show loading spinner while fetching
- Disable buttons during submission
- Show skeleton screens for data
- Handle empty states

DELIVERABLES:
1. Updated all component API calls
2. Error handling throughout
3. Loading states for all async operations
4. Token management (localStorage)
5. Automatic logout on 401
6. Toast notifications for user feedback
7. Proper TypeScript types for API responses
8. Environment variable configuration
```

---

## PROMPT 10: Testing & Launch

```
You are preparing Forge for launch.

TASK: Test all features end-to-end and prepare for production deployment.

REQUIREMENTS:
1. Test all authentication flows
2. Test all task operations
3. Test credit system
4. Test team collaboration
5. Test API keys
6. Test notifications
7. Performance testing
8. Security testing

TESTING CHECKLIST:

Authentication:
- [ ] Signup with valid email/password
- [ ] Signup with invalid email (error)
- [ ] Signup with duplicate email (error)
- [ ] Login with correct credentials
- [ ] Login with wrong password (error)
- [ ] JWT token valid after login
- [ ] Token expires after 7 days
- [ ] Logout clears token
- [ ] Protected routes reject no token
- [ ] Protected routes reject invalid token

Tasks:
- [ ] Create task with sufficient credits
- [ ] Create task with insufficient credits (error)
- [ ] List tasks (pagination works)
- [ ] Filter tasks by status
- [ ] Search tasks by title
- [ ] Get single task details
- [ ] Update task status
- [ ] Delete task
- [ ] Task execution time tracked
- [ ] Credits deducted on completion

Credits:
- [ ] Balance displays correctly
- [ ] Transaction history shows all transactions
- [ ] Credits deducted on task creation
- [ ] Credits refunded on task failure
- [ ] Low credit alert triggers at < 10
- [ ] Monthly allowance resets for tier users
- [ ] Purchase credits increases balance

Teams:
- [ ] Create team
- [ ] List teams
- [ ] Get team details
- [ ] Invite team member
- [ ] Change member role
- [ ] Remove team member
- [ ] Non-owner cannot manage team
- [ ] Member can access shared tasks

API Keys:
- [ ] Generate API key
- [ ] Masked key displays correctly
- [ ] Full key shown only once
- [ ] Revoke API key
- [ ] Regenerate API key
- [ ] API key usage tracked
- [ ] Invalid key rejected

Notifications:
- [ ] Notification created on task completion
- [ ] Notification displays in bell
- [ ] Mark notification as read
- [ ] Delete notification
- [ ] Email notification sent (if enabled)
- [ ] Low credit notification triggers

PERFORMANCE:
- [ ] Page load < 2 seconds
- [ ] API response < 500ms
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Caching implemented
- [ ] Images optimized

SECURITY:
- [ ] No SQL injection possible
- [ ] No XSS vulnerabilities
- [ ] No CSRF vulnerabilities
- [ ] Passwords hashed properly
- [ ] API keys hashed
- [ ] Rate limiting working
- [ ] CORS configured correctly
- [ ] HTTPS enforced
- [ ] Sensitive data not logged

DEPLOYMENT:
1. Set up production database
2. Configure environment variables
3. Deploy to Railway/Render
4. Run database migrations
5. Test all endpoints in production
6. Set up monitoring/alerts
7. Configure custom domain
8. Enable SSL/TLS
9. Set up backups
10. Document deployment process

LAUNCH CHECKLIST:
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete
- [ ] Team trained
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Support process defined
- [ ] Ready for users

DELIVERABLES:
1. Test results document
2. Performance report
3. Security audit results
4. Deployment guide
5. Monitoring setup
6. Backup configuration
7. Support documentation
8. Launch announcement

LAUNCH COMMAND:
npm run build && npm start

MONITORING:
- Set up error tracking (Sentry)
- Set up performance monitoring (New Relic)
- Set up uptime monitoring (Pingdom)
- Set up log aggregation (LogRocket)
- Set up alerts for critical errors

POST-LAUNCH:
- Monitor error rates
- Monitor performance metrics
- Gather user feedback
- Fix critical bugs immediately
- Plan feature releases
- Iterate based on usage patterns
```

---

## How to Use These Prompts

1. **Copy each prompt** into Codex one at a time
2. **Follow the order** (1-10) - each builds on previous
3. **Review generated code** before accepting
4. **Test as you go** - don't wait until the end
5. **Ask clarifying questions** if anything is unclear
6. **Iterate** - if something doesn't work, ask Codex to fix it

## Expected Output

After all 10 prompts:
- ✅ Complete Express.js backend
- ✅ PostgreSQL database with schema
- ✅ All API endpoints implemented
- ✅ Authentication system
- ✅ Credit system
- ✅ Team collaboration
- ✅ Notifications
- ✅ Error handling
- ✅ Logging
- ✅ Ready for deployment

## Deployment

After Codex builds everything:

```bash
# 1. Push to GitHub
git add .
git commit -m "Forge backend complete"
git push origin main

# 2. Deploy to Railway
# - Connect GitHub repo
# - Add PostgreSQL plugin
# - Set environment variables
# - Deploy

# 3. Test production
curl https://your-backend.railway.app/health

# 4. Update frontend API URL
# - Set REACT_APP_API_URL to production backend
# - Redeploy frontend

# 5. Launch!
```

## Support

- Frontend: https://github.com/carswqqqq1/forge-operator
- Backend spec: FORGE_BACKEND_SPEC.md
- Quick start: FORGE_QUICK_START.md
- Issues: Create GitHub issues

**You now have everything needed to launch Forge. Use these prompts with Codex and you'll have a production-ready backend in hours.**
