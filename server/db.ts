import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function initDb() {
  const dbPath = process.env.NODE_ENV === 'production'
    ? '/tmp/paper.db'
    : path.join(__dirname, 'paper.db');
  const db = new Database(dbPath);

  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      session_token TEXT,
      icon TEXT NOT NULL DEFAULT 'plane',
      color TEXT NOT NULL DEFAULT '#FF4F36',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crew_members (
      crew_id INTEGER REFERENCES crews(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (crew_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      game TEXT NOT NULL,
      score INTEGER NOT NULL,
      crew_id INTEGER REFERENCES crews(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS obstacles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crew_id INTEGER REFERENCES crews(id) ON DELETE CASCADE NOT NULL,
      game TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      type TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      color TEXT NOT NULL DEFAULT '#D0D0D0',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_scores_game ON scores(game);
    CREATE INDEX IF NOT EXISTS idx_scores_crew ON scores(crew_id);
    CREATE INDEX IF NOT EXISTS idx_obstacles_crew ON obstacles(crew_id, game);
    CREATE INDEX IF NOT EXISTS idx_crews_uuid ON crews(uuid);
  `);

  // Migrations — add columns to existing tables
  try {
    db.exec(`ALTER TABLE users ADD COLUMN icon TEXT NOT NULL DEFAULT 'plane'`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN color TEXT NOT NULL DEFAULT '#FF4F36'`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN email TEXT UNIQUE`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN session_token TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE crews ADD COLUMN uuid TEXT UNIQUE`);
    // Backfill existing crews with generated UUIDs
    const existing = db.prepare('SELECT id FROM crews WHERE uuid IS NULL').all() as any[];
    const update = db.prepare('UPDATE crews SET uuid = ? WHERE id = ?');
    for (const crew of existing) {
      update.run(crypto.randomUUID().replace(/-/g, '').substring(0, 12), crew.id);
    }
  } catch { /* column already exists */ }

  // Waitlist table
  db.exec(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      reason TEXT NOT NULL,
      source TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      ai_recommendation TEXT,
      ai_reasoning TEXT,
      ai_confidence TEXT,
      ai_welcome_message TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
    CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
  `);

  // Weekly highlights table — weekly score snapshots per crew per game
  db.exec(`
    CREATE TABLE IF NOT EXISTS weekly_highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crew_id INTEGER REFERENCES crews(id) ON DELETE CASCADE,
      game TEXT NOT NULL,
      week_start TEXT NOT NULL,
      week_end TEXT NOT NULL,
      winner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      winner_username TEXT NOT NULL,
      winner_score INTEGER NOT NULL,
      runner_up_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      runner_up_username TEXT,
      runner_up_score INTEGER,
      total_plays INTEGER NOT NULL DEFAULT 0,
      participant_count INTEGER NOT NULL DEFAULT 0,
      scores_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(crew_id, game, week_start)
    );
    CREATE INDEX IF NOT EXISTS idx_highlights_crew ON weekly_highlights(crew_id);
    CREATE INDEX IF NOT EXISTS idx_highlights_week ON weekly_highlights(week_start);
  `);

  // Invite codes table — approved users can invite friends
  db.exec(`
    CREATE TABLE IF NOT EXISTS invite_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
      used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
    CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON invite_codes(created_by);
  `);

  return db;
}
