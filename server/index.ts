import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3011;

app.use(cors());
app.use(express.json());

const db = initDb();

// --- Auth helpers ---

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function resolveCrewId(uuid: string): number | null {
  const crew = db.prepare('SELECT id FROM crews WHERE uuid = ?').get(uuid) as any;
  return crew?.id || null;
}

/** Extract user from Authorization header. Returns null if invalid. */
function authenticateRequest(req: express.Request): { id: number; username: string } | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const user = db.prepare('SELECT id, username FROM users WHERE session_token = ?').get(token) as any;
  return user || null;
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'Paper API' });
});

// Users

// Login / Signup — email-based identity
app.post('/api/users', (req, res) => {
  const { email, username } = req.body;
  if (!email || !username) {
    res.status(400).json({ error: 'Email and username are required' });
    return;
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(username).trim();

  // Check if email already exists (login)
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;
  if (existing) {
    // Refresh session token on login
    const token = generateToken();
    db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(token, existing.id);
    res.json({ id: existing.id, username: existing.username, email: existing.email, icon: existing.icon, color: existing.color, token });
    return;
  }

  // New user — signup
  try {
    const token = generateToken();
    const stmt = db.prepare('INSERT INTO users (username, email, session_token) VALUES (?, ?, ?)');
    const result = stmt.run(cleanName, cleanEmail, token);
    res.json({ id: result.lastInsertRowid, username: cleanName, email: cleanEmail, token });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      res.status(409).json({ error: 'Username already taken' });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// Session validation — check if user exists by email
app.get('/api/users/me', (req, res) => {
  const { email } = req.query;
  if (!email) {
    res.status(400).json({ error: 'Email query param required' });
    return;
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase()) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  // Refresh token
  const token = generateToken();
  db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(token, user.id);
  res.json({ id: user.id, username: user.username, email: user.email, icon: user.icon, color: user.color, token });
});

app.get('/api/users', (_req, res) => {
  const users = db.prepare('SELECT id, username, icon, color, created_at FROM users').all();
  res.json(users);
});

app.patch('/api/users/:id', (req, res) => {
  const authed = authenticateRequest(req);
  if (!authed) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { id } = req.params;
  if (authed.id !== Number(id)) { res.status(403).json({ error: 'Forbidden' }); return; }
  const { icon, color, username } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const newIcon = icon || user.icon;
  const newColor = color || user.color;
  const newUsername = username ? String(username).trim() : user.username;
  if (username) {
    // Check uniqueness if changing username
    const clash = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(newUsername, user.id) as any;
    if (clash) { res.status(409).json({ error: 'Username already taken' }); return; }
  }
  db.prepare('UPDATE users SET icon = ?, color = ?, username = ? WHERE id = ?').run(newIcon, newColor, newUsername, id);
  res.json({ id: user.id, username: newUsername, email: user.email, icon: newIcon, color: newColor });
});

// Paper Crews — specific routes BEFORE :id catch-all

app.post('/api/crews', (req, res) => {
  const authed = authenticateRequest(req);
  if (!authed) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { name, created_by } = req.body;
  if (!name || !String(name).trim()) {
    res.status(400).json({ error: 'Crew name is required' });
    return;
  }
  if (!created_by) {
    res.status(400).json({ error: 'User ID is required' });
    return;
  }
  // Verify user exists
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(created_by);
  if (!user) {
    res.status(400).json({ error: 'User not found. Please refresh and try again.' });
    return;
  }
  // Generate a 6-char invite code with collision retry
  let code = '';
  let attempts = 0;
  while (attempts < 5) {
    code = Math.random().toString(36).substring(2, 8).padEnd(6, '0').substring(0, 6).toUpperCase();
    const existing = db.prepare('SELECT id FROM crews WHERE invite_code = ?').get(code);
    if (!existing) break;
    attempts++;
  }
  try {
    const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    const stmt = db.prepare('INSERT INTO crews (uuid, name, invite_code, created_by) VALUES (?, ?, ?, ?)');
    const result = stmt.run(uuid, String(name).trim(), code, created_by);
    // Also add creator as a member
    db.prepare('INSERT OR IGNORE INTO crew_members (crew_id, user_id) VALUES (?, ?)').run(result.lastInsertRowid, created_by);
    res.json({ id: uuid, name: String(name).trim(), invite_code: code });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to create crew. Please try again.' });
  }
});

app.post('/api/crews/join', (req, res) => {
  const authed = authenticateRequest(req);
  if (!authed) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { invite_code, user_id } = req.body;
  const crew = db.prepare('SELECT * FROM crews WHERE invite_code = ?').get(invite_code) as any;
  if (!crew) {
    res.status(404).json({ error: 'Invalid invite code' });
    return;
  }
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM crew_members WHERE crew_id = ?').get(crew.id) as any;
  if (memberCount.count >= 8) {
    res.status(400).json({ error: 'Crew is full (max 8 members)' });
    return;
  }
  const existing = db.prepare('SELECT * FROM crew_members WHERE crew_id = ? AND user_id = ?').get(crew.id, user_id);
  if (existing) {
    res.status(400).json({ error: 'Already a member' });
    return;
  }
  db.prepare('INSERT INTO crew_members (crew_id, user_id) VALUES (?, ?)').run(crew.id, user_id);
  const newCount = db.prepare('SELECT COUNT(*) as count FROM crew_members WHERE crew_id = ?').get(crew.id) as any;
  res.json({ crew_id: crew.uuid, name: crew.name, member_count: newCount.count });
});

app.get('/api/crews/user/:user_id', (req, res) => {
  const { user_id } = req.params;
  const crews = db.prepare(`
    SELECT c.uuid as id, c.name, c.invite_code, c.created_at, COUNT(cm2.user_id) as member_count
    FROM crew_members cm
    JOIN crews c ON c.id = cm.crew_id
    LEFT JOIN crew_members cm2 ON cm2.crew_id = c.id
    WHERE cm.user_id = ?
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all(user_id);
  res.json(crews);
});

app.get('/api/crews', (_req, res) => {
  const crews = db.prepare('SELECT * FROM crews').all();
  res.json(crews);
});

app.get('/api/crews/:uuid', (req, res) => {
  const { uuid } = req.params;
  const crew = db.prepare('SELECT * FROM crews WHERE uuid = ?').get(uuid) as any;
  if (!crew) {
    res.status(404).json({ error: 'Crew not found' });
    return;
  }
  const members = db.prepare(`
    SELECT u.id, u.username, u.icon, u.color, cm.joined_at
    FROM crew_members cm JOIN users u ON u.id = cm.user_id
    WHERE cm.crew_id = ?
    ORDER BY cm.joined_at
  `).all(crew.id);
  const games = db.prepare(`
    SELECT DISTINCT game FROM scores WHERE crew_id = ?
  `).all(crew.id) as any[];
  res.json({ id: crew.uuid, name: crew.name, invite_code: crew.invite_code, members, game_count: games.length });
});

app.get('/api/crews/:uuid/members', (req, res) => {
  const { uuid } = req.params;
  const crewId = resolveCrewId(uuid);
  if (!crewId) { res.status(404).json({ error: 'Crew not found' }); return; }
  const members = db.prepare(`
    SELECT u.id, u.username, cm.joined_at
    FROM crew_members cm JOIN users u ON u.id = cm.user_id
    WHERE cm.crew_id = ?
    ORDER BY cm.joined_at
  `).all(crewId);
  res.json(members);
});

app.delete('/api/crews/:uuid/members/:user_id', (req, res) => {
  const authed = authenticateRequest(req);
  if (!authed) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { uuid, user_id } = req.params;
  const crewId = resolveCrewId(uuid);
  if (!crewId) { res.status(404).json({ error: 'Crew not found' }); return; }
  db.prepare('DELETE FROM crew_members WHERE crew_id = ? AND user_id = ?').run(crewId, user_id);
  res.json({ ok: true });
});

// Scores
app.post('/api/scores', (req, res) => {
  const authed = authenticateRequest(req);
  if (!authed) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { user_id, game, score, crew_id } = req.body;
  const internalCrewId = crew_id ? resolveCrewId(String(crew_id)) : null;
  const stmt = db.prepare('INSERT INTO scores (user_id, game, score, crew_id) VALUES (?, ?, ?, ?)');
  const result = stmt.run(user_id, game, score, internalCrewId);
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/scores/:game', (req, res) => {
  const { game } = req.params;
  const { crew_id } = req.query;
  let scores;
  if (crew_id) {
    const internalId = resolveCrewId(String(crew_id));
    if (!internalId) { res.json([]); return; }
    scores = db.prepare(
      'SELECT s.*, u.username FROM scores s JOIN users u ON s.user_id = u.id WHERE s.game = ? AND s.crew_id = ? ORDER BY s.score DESC LIMIT 50'
    ).all(game, internalId);
  } else {
    scores = db.prepare(
      'SELECT s.*, u.username FROM scores s JOIN users u ON s.user_id = u.id WHERE s.game = ? ORDER BY s.score DESC LIMIT 50'
    ).all(game);
  }
  res.json(scores);
});

// Obstacles — persist crew game obstacles
app.get('/api/obstacles/:game', (req, res) => {
  const { game } = req.params;
  const { crew_id } = req.query;
  if (!crew_id) {
    res.status(400).json({ error: 'crew_id required' });
    return;
  }
  const internalId = resolveCrewId(String(crew_id));
  if (!internalId) { res.json([]); return; }
  const obstacles = db.prepare(
    'SELECT o.*, u.username FROM obstacles o LEFT JOIN users u ON o.user_id = u.id WHERE o.crew_id = ? AND o.game = ? ORDER BY o.created_at'
  ).all(internalId, game);
  res.json(obstacles);
});

app.post('/api/obstacles', (req, res) => {
  const authed = authenticateRequest(req);
  if (!authed) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { crew_id, game, user_id, type, x, y, color } = req.body;
  const internalCrewId = crew_id ? resolveCrewId(String(crew_id)) : null;
  if (crew_id && !internalCrewId) { res.status(404).json({ error: 'Crew not found' }); return; }
  const stmt = db.prepare('INSERT INTO obstacles (crew_id, game, user_id, type, x, y, color) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(internalCrewId, game, user_id, type, x, y, color || '#D0D0D0');
  res.json({ id: result.lastInsertRowid });
});

// SPA catch-all (production only — Vite handles this in dev)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Paper API running on http://localhost:${PORT}`);
});
