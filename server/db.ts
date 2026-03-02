import Database from 'better-sqlite3';
import path from 'path';

export function initDb() {
  const db = new Database(path.join(__dirname, 'paper.db'));

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL DEFAULT 'plane',
      color TEXT NOT NULL DEFAULT '#FF4F36',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crew_members (
      crew_id INTEGER REFERENCES crews(id),
      user_id INTEGER REFERENCES users(id),
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (crew_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      game TEXT NOT NULL,
      score INTEGER NOT NULL,
      crew_id INTEGER REFERENCES crews(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS obstacles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crew_id INTEGER REFERENCES crews(id) NOT NULL,
      game TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id),
      type TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      color TEXT NOT NULL DEFAULT '#D0D0D0',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_scores_game ON scores(game);
    CREATE INDEX IF NOT EXISTS idx_scores_crew ON scores(crew_id);
    CREATE INDEX IF NOT EXISTS idx_obstacles_crew ON obstacles(crew_id, game);
  `);

  // Migrations — add columns to existing tables
  try {
    db.exec(`ALTER TABLE users ADD COLUMN icon TEXT NOT NULL DEFAULT 'plane'`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN color TEXT NOT NULL DEFAULT '#FF4F36'`);
  } catch { /* column already exists */ }

  return db;
}
