const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'pulse-studio-local-secret');
const DB_PATH = path.join(__dirname, 'pulse-studio.db');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production.');
}

const db = new sqlite3.Database(DB_PATH);

function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function getQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function allQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

async function ensureDatabase() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'ideas',
      topic TEXT,
      niche TEXT,
      tone TEXT,
      duration TEXT,
      prompt TEXT,
      content TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const demoUser = await getQuery('SELECT * FROM users WHERE email = ?', ['demo@pulse.app']);
  if (!demoUser) {
    const hash = await bcrypt.hash('demo123', 10);
    await runQuery(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      ['Demo Creator', 'demo@pulse.app', hash]
    );
  }
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Pulse Studio backend is running.' });
});

app.get('/api/ai/status', (req, res) => {
  res.json({ success: true, connected: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.post('/api/ai/generate', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ success: false, message: 'Claude is not configured on this server.' });
  }

  try {
    const { mode = 'ideas', topic = 'your niche', niche = 'Creator growth', tone = 'Energetic & Fun', duration = '15 sec' } = req.body || {};
    const prompt = `Create TikTok content for the topic "${String(topic).slice(0, 300)}". Mode: ${mode}. Niche: ${niche}. Tone: ${tone}. Duration: ${duration}. Return exactly three concise options. Each option must have a short title, a hook, useful content, and a CTA when appropriate. Use plain text with one option per section and no markdown tables.`;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
        max_tokens: 900,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: payload.error?.message || 'Claude request failed.' });
    }
    const text = Array.isArray(payload.content) ? payload.content.filter((item) => item.type === 'text').map((item) => item.text).join('\n') : '';
    res.json({ success: true, text });
  } catch (error) {
    res.status(502).json({ success: false, message: error.message || 'Could not reach Claude.' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await getQuery('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const result = await runQuery(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [String(name).trim(), normalizedEmail, passwordHash]
    );

    const user = {
      id: result.id,
      name: String(name).trim(),
      email: normalizedEmail
    };

    res.status(201).json({
      success: true,
      token: createToken(user),
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Signup failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await getQuery('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(String(password), user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email };
    res.json({
      success: true,
      token: createToken(safeUser),
      user: safeUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Login failed.' });
  }
});

app.get('/api/me', authRequired, async (req, res) => {
  try {
    const user = await getQuery('SELECT id, name, email FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Could not load account.' });
  }
});

app.get('/api/projects', authRequired, async (req, res) => {
  try {
    const rows = await allQuery(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC, id DESC',
      [req.user.id]
    );

    res.json({
      success: true,
      projects: rows.map((row) => ({
        ...row,
        content: row.content ? JSON.parse(row.content || '[]') : []
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Could not load projects.' });
  }
});

app.post('/api/projects', authRequired, async (req, res) => {
  try {
    const payload = req.body || {};
    const item = {
      name: String(payload.name || 'Untitled project').trim() || 'Untitled project',
      type: String(payload.type || 'ideas'),
      topic: String(payload.topic || ''),
      niche: String(payload.niche || ''),
      tone: String(payload.tone || 'Energetic & Fun'),
      duration: String(payload.duration || '15 sec'),
      prompt: String(payload.prompt || ''),
      content: Array.isArray(payload.content) ? payload.content : []
    };

    const result = await runQuery(
      `INSERT INTO projects (user_id, name, type, topic, niche, tone, duration, prompt, content, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [req.user.id, item.name, item.type, item.topic, item.niche, item.tone, item.duration, item.prompt, JSON.stringify(item.content)]
    );

    const project = { id: result.id, user_id: req.user.id, ...item, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Could not create project.' });
  }
});

app.put('/api/projects/:id', authRequired, async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const payload = req.body || {};
    const content = Array.isArray(payload.content) ? payload.content : [];

    const current = await getQuery('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, req.user.id]);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await runQuery(
      `UPDATE projects
       SET name = ?, type = ?, topic = ?, niche = ?, tone = ?, duration = ?, prompt = ?, content = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        String(payload.name || current.name),
        String(payload.type || current.type),
        String(payload.topic || current.topic || ''),
        String(payload.niche || current.niche || ''),
        String(payload.tone || current.tone || ''),
        String(payload.duration || current.duration || ''),
        String(payload.prompt || current.prompt || ''),
        JSON.stringify(content),
        projectId,
        req.user.id
      ]
    );

    const updated = { ...current, ...payload, content, updated_at: new Date().toISOString() };
    res.json({ success: true, project: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Could not update project.' });
  }
});

app.delete('/api/projects/:id', authRequired, async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const result = await runQuery('DELETE FROM projects WHERE id = ? AND user_id = ?', [projectId, req.user.id]);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    res.json({ success: true, deleted: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Could not delete project.' });
  }
});

app.get('/api/analytics', authRequired, async (req, res) => {
  try {
    const rows = await allQuery('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    const total = rows.length;
    res.json({
      success: true,
      analytics: {
        totalProjects: total,
        exports: Math.min(9, total + 2),
        shares: Math.max(1, total + 1),
        thisWeek: Math.max(3, total + 2)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Could not load analytics.' });
  }
});

app.get('/api/feed', async (req, res) => {
  res.json({
    success: true,
    feed: [
      {
        id: 1,
        userName: 'Demo Creator',
        time: '2m ago',
        tag: 'Trending',
        title: 'The 10-second hook everyone ignores',
        copy: 'Small shift, huge retention. This idea turns a generic tip into a direct challenge with a clear payoff.',
        likes: 124,
        comments: 18,
        liked: false,
        saved: false
      },
      {
        id: 2,
        userName: 'Ava Bloom',
        time: '18m ago',
        tag: 'Editor pick',
        title: 'How we cut boring intros without losing trust',
        copy: 'Use a sharp hook, then show proof. The audience stays because the value arrives immediately.',
        likes: 96,
        comments: 12,
        liked: true,
        saved: true
      },
      {
        id: 3,
        userName: 'Jay Lee',
        time: '1h ago',
        tag: 'Launch',
        title: 'A creator workflow that feels social, not robotic',
        copy: 'Map script, hooks and CTA in one sequence so the content feels native to the feed instead of staged.',
        likes: 142,
        comments: 10,
        liked: false,
        saved: false
      }
    ]
  });
});

app.use(express.static(__dirname));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

async function startServer() {
  await ensureDatabase();
  app.listen(PORT, HOST, () => {
    console.log(`Pulse Studio backend running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
