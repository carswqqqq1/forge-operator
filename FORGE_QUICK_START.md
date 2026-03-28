# Forge Backend - Quick Start Implementation Guide

**Status:** Ready to build  
**Estimated time:** 6-8 hours  
**Difficulty:** Intermediate

This guide gets you from zero to a working Forge backend in the fastest way possible.

---

## Step 1: Project Setup (15 mins)

### Create Express.js project
```bash
mkdir forge-backend
cd forge-backend
npm init -y
npm install express cors dotenv pg bcryptjs jsonwebtoken
npm install -D nodemon
```

### Create folder structure
```
forge-backend/
├── server.js
├── .env
├── routes/
│   ├── auth.js
│   ├── tasks.js
│   ├── credits.js
│   └── teams.js
├── middleware/
│   └── auth.js
├── db/
│   ├── connection.js
│   └── schema.sql
└── package.json
```

### .env template
```
DATABASE_URL=postgresql://user:password@localhost:5432/forge
JWT_SECRET=your_super_secret_key_change_this
PORT=3001
NODE_ENV=development
FRONTEND_URL=https://forge-operator-arroyo.netlify.app
```

---

## Step 2: Database Setup (30 mins)

### Create PostgreSQL database
```bash
# Using Railway or local PostgreSQL
createdb forge
```

### Run schema (from FORGE_BACKEND_SPEC.md)
```bash
psql forge < db/schema.sql
```

### db/connection.js
```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
```

---

## Step 3: Authentication (1 hour)

### routes/auth.js
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validate
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, credits) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name',
      [email, hashedPassword, firstName, lastName, 100]
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const result = await pool.query('SELECT id, email, password_hash, first_name, last_name, credits FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token, user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, credits: user.credits } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, first_name, last_name, credits, subscription_tier FROM users WHERE id = $1', [req.user.id]);
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### middleware/auth.js
```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## Step 4: Tasks System (1 hour)

### routes/tasks.js
```javascript
const express = require('express');
const pool = require('../db/connection');
const auth = require('../middleware/auth');
const { v4: uuid } = require('uuid');

const router = express.Router();

// Create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, input } = req.body;
    const taskId = uuid();
    
    // Estimate credits
    const estimatedCredits = 50; // Adjust based on task type
    
    // Check balance
    const userResult = await pool.query('SELECT credits FROM users WHERE id = $1', [req.user.sub]);
    if (userResult.rows[0].credits < estimatedCredits) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    
    // Create task
    const result = await pool.query(
      'INSERT INTO tasks (id, user_id, title, description, input_data, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [taskId, req.user.sub, title, description, JSON.stringify(input), 'pending']
    );
    
    res.status(201).json({ task: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks
router.get('/', auth, async (req, res) => {
  try {
    const { status, limit = 10, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [req.user.sub];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    res.json({ tasks: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.sub]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ task: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## Step 5: Credits System (30 mins)

### routes/credits.js
```javascript
const express = require('express');
const pool = require('../db/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// Get balance
router.get('/balance', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT credits, subscription_tier FROM users WHERE id = $1', [req.user.sub]);
    res.json({ balance: result.rows[0].credits, tier: result.rows[0].subscription_tier });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get history
router.get('/history', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM credits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.user.sub]
    );
    res.json({ transactions: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deduct credits (internal)
async function deductCredits(userId, amount, description) {
  const userResult = await pool.query('SELECT credits FROM users WHERE id = $1', [userId]);
  const balanceBefore = userResult.rows[0].credits;
  const balanceAfter = balanceBefore - amount;
  
  await pool.query('UPDATE users SET credits = $1 WHERE id = $2', [balanceAfter, userId]);
  
  await pool.query(
    'INSERT INTO credits (user_id, amount, transaction_type, description, balance_before, balance_after) VALUES ($1, $2, $3, $4, $5, $6)',
    [userId, -amount, 'debit', description, balanceBefore, balanceAfter]
  );
}

module.exports = { router, deductCredits };
```

---

## Step 6: Main Server (30 mins)

### server.js
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const creditsRoutes = require('./routes/credits').router;

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/credits', creditsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Forge backend running on port ${PORT}`);
});
```

### package.json scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

---

## Step 7: Deployment (30 mins)

### Option A: Railway (Recommended)
1. Push code to GitHub
2. Connect Railway to GitHub repo
3. Add PostgreSQL plugin
4. Set environment variables
5. Deploy

### Option B: Render
1. Create new Web Service
2. Connect GitHub repo
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

### Option C: Vercel (Serverless)
1. Add serverless functions
2. Connect to external PostgreSQL
3. Deploy

---

## Step 8: Frontend Integration

### Update frontend API calls

In frontend components, replace mock data with actual API calls:

```javascript
// Example: UserProfileDropdown.tsx
const [user, setUser] = useState(null);

useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    fetch('https://your-backend.com/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setUser(data.user));
  }
}, []);
```

---

## Testing Checklist

```bash
# Test signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}'

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test protected route (use token from login response)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Next Steps After Basic Backend

1. **Add task execution** (integrate with agent system)
2. **Add Stripe payments** (for credit purchases)
3. **Add email notifications** (SendGrid)
4. **Add team management** (team endpoints)
5. **Add API key management** (API key endpoints)
6. **Add real-time notifications** (WebSocket)

---

## Resources

- Express.js: https://expressjs.com
- PostgreSQL: https://www.postgresql.org
- JWT: https://jwt.io
- Railway: https://railway.app
- Frontend repo: https://github.com/carswqqqq1/forge-operator

---

**You're ready to build. Start with Step 1 and follow the guide. Each step builds on the previous one.**
