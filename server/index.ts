import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3011;

app.use(cors());
app.use(express.json());

const db = initDb();

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'Paper API' });
});

// Users
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO users (username) VALUES (?)');
    const result = stmt.run(username);
    res.json({ id: result.lastInsertRowid, username });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
      res.json({ id: existing.id, username: existing.username });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

app.get('/api/users', (_req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

app.patch('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { icon, color } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const newIcon = icon || user.icon;
  const newColor = color || user.color;
  db.prepare('UPDATE users SET icon = ?, color = ? WHERE id = ?').run(newIcon, newColor, id);
  res.json({ id: user.id, username: user.username, icon: newIcon, color: newColor });
});

// Paper Crews — specific routes BEFORE :id catch-all

app.post('/api/crews', (req, res) => {
  const { name, created_by } = req.body;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const stmt = db.prepare('INSERT INTO crews (name, invite_code, created_by) VALUES (?, ?, ?)');
  const result = stmt.run(name, code, created_by);
  // Also add creator as a member
  db.prepare('INSERT OR IGNORE INTO crew_members (crew_id, user_id) VALUES (?, ?)').run(result.lastInsertRowid, created_by);
  res.json({ id: result.lastInsertRowid, name, invite_code: code });
});

app.post('/api/crews/join', (req, res) => {
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
  res.json({ crew_id: crew.id, name: crew.name, member_count: newCount.count });
});

app.get('/api/crews/user/:user_id', (req, res) => {
  const { user_id } = req.params;
  const crews = db.prepare(`
    SELECT c.*, COUNT(cm2.user_id) as member_count
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

app.get('/api/crews/:id', (req, res) => {
  const { id } = req.params;
  const crew = db.prepare('SELECT * FROM crews WHERE id = ?').get(id) as any;
  if (!crew) {
    res.status(404).json({ error: 'Crew not found' });
    return;
  }
  const members = db.prepare(`
    SELECT u.id, u.username, u.icon, u.color, cm.joined_at
    FROM crew_members cm JOIN users u ON u.id = cm.user_id
    WHERE cm.crew_id = ?
    ORDER BY cm.joined_at
  `).all(id);
  const games = db.prepare(`
    SELECT DISTINCT game FROM scores WHERE crew_id = ?
  `).all(id) as any[];
  res.json({ ...crew, members, game_count: games.length });
});

app.get('/api/crews/:id/members', (req, res) => {
  const { id } = req.params;
  const members = db.prepare(`
    SELECT u.id, u.username, cm.joined_at
    FROM crew_members cm JOIN users u ON u.id = cm.user_id
    WHERE cm.crew_id = ?
    ORDER BY cm.joined_at
  `).all(id);
  res.json(members);
});

app.delete('/api/crews/:id/members/:user_id', (req, res) => {
  const { id, user_id } = req.params;
  db.prepare('DELETE FROM crew_members WHERE crew_id = ? AND user_id = ?').run(id, user_id);
  res.json({ ok: true });
});

// Scores
app.post('/api/scores', (req, res) => {
  const { user_id, game, score, crew_id } = req.body;
  const stmt = db.prepare('INSERT INTO scores (user_id, game, score, crew_id) VALUES (?, ?, ?, ?)');
  const result = stmt.run(user_id, game, score, crew_id || null);
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/scores/:game', (req, res) => {
  const { game } = req.params;
  const { crew_id } = req.query;
  let scores;
  if (crew_id) {
    scores = db.prepare(
      'SELECT s.*, u.username FROM scores s JOIN users u ON s.user_id = u.id WHERE s.game = ? AND s.crew_id = ? ORDER BY s.score DESC LIMIT 50'
    ).all(game, crew_id);
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
  const obstacles = db.prepare(
    'SELECT o.*, u.username FROM obstacles o LEFT JOIN users u ON o.user_id = u.id WHERE o.crew_id = ? AND o.game = ? ORDER BY o.created_at'
  ).all(crew_id, game);
  res.json(obstacles);
});

app.post('/api/obstacles', (req, res) => {
  const { crew_id, game, user_id, type, x, y, color } = req.body;
  const stmt = db.prepare('INSERT INTO obstacles (crew_id, game, user_id, type, x, y, color) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(crew_id, game, user_id, type, x, y, color || '#D0D0D0');
  res.json({ id: result.lastInsertRowid });
});

// SPA catch-all (production only — Vite handles this in dev)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Paper API running on http://localhost:${PORT}`);
});
