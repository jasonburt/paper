import express from 'express';
import cors from 'cors';
import { initDb } from './db';

const app = express();
const PORT = 3001;

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
  const stmt = db.prepare('INSERT INTO users (username) VALUES (?)');
  const result = stmt.run(username);
  res.json({ id: result.lastInsertRowid, username });
});

app.get('/api/users', (_req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

// Paper Crews
app.post('/api/crews', (req, res) => {
  const { name, created_by } = req.body;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const stmt = db.prepare('INSERT INTO crews (name, invite_code, created_by) VALUES (?, ?, ?)');
  const result = stmt.run(name, code, created_by);
  res.json({ id: result.lastInsertRowid, name, invite_code: code });
});

app.get('/api/crews', (_req, res) => {
  const crews = db.prepare('SELECT * FROM crews').all();
  res.json(crews);
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

app.listen(PORT, () => {
  console.log(`Paper API running on http://localhost:${PORT}`);
});
