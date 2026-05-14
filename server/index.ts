import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { initDb } from './db.js';
import { backupToGCS, restoreFromGCS, listBackups, startHourlyBackup } from './backup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3011;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

app.use(cors());
app.use(express.json());

// Restore from GCS before initializing DB (production only)
if (process.env.NODE_ENV === 'production' && process.env.BACKUP_BUCKET) {
  try {
    await restoreFromGCS();
    console.log('[startup] DB restore attempted');
  } catch (err) {
    console.error('[startup] DB restore failed, starting fresh:', err);
  }
}

const db = initDb();

// Start hourly backups (production only)
if (process.env.NODE_ENV === 'production' && process.env.BACKUP_BUCKET) {
  startHourlyBackup();
}

// --- Auth helpers ---

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function createInviteCodes(userId: number, count: number = 2): string[] {
  const codes: string[] = [];
  const stmt = db.prepare('INSERT INTO invite_codes (code, created_by) VALUES (?, ?)');
  for (let i = 0; i < count; i++) {
    let code = '';
    let attempts = 0;
    while (attempts < 5) {
      code = generateInviteCode();
      const existing = db.prepare('SELECT id FROM invite_codes WHERE code = ?').get(code);
      if (!existing) break;
      attempts++;
    }
    stmt.run(code, userId);
    codes.push(code);
  }
  return codes;
}

function resolveCrewId(uuid: string): number | null {
  const crew = db.prepare('SELECT id FROM crews WHERE uuid = ?').get(uuid) as any;
  return crew?.id || null;
}

/** Extract user from Authorization header. Returns null if invalid or non-active. */
function authenticateRequest(req: express.Request): { id: number; username: string } | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const user = db.prepare('SELECT id, username, status FROM users WHERE session_token = ?').get(token) as any;
  if (!user || user.status !== 'active') return null;
  return user;
}

// Health check
const BOOT_TIME = new Date().toISOString();
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'Paper API', booted: BOOT_TIME });
});

// Users

// Check if email exists and whether it needs a password
app.post('/api/auth/check', (req, res) => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: 'Email required' }); return; }
  const cleanEmail = String(email).trim().toLowerCase();

  const user = db.prepare('SELECT id, username, password_hash, status FROM users WHERE email = ?').get(cleanEmail) as any;
  if (user) {
    res.json({
      exists: true,
      has_password: !!user.password_hash,
      status: user.status,
    });
    return;
  }

  // Check waitlist
  const waitlisted = db.prepare('SELECT id, status FROM waitlist WHERE email = ?').get(cleanEmail) as any;
  if (waitlisted) {
    res.json({ exists: false, waitlisted: true, waitlist_status: waitlisted.status });
    return;
  }

  res.json({ exists: false, waitlisted: false });
});

// Login / Signup — email + password identity
app.post('/api/users', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const cleanEmail = String(email).trim().toLowerCase();

  // Check if email already exists (login)
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;
  if (existing) {
    // Grandfathered user (no password yet) — set their password
    if (!existing.password_hash) {
      if (!password) {
        res.status(400).json({ error: 'Password required', needs_password: true });
        return;
      }
      const hash = await bcrypt.hash(String(password), 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, existing.id);
    } else {
      // Verify password
      if (!password) {
        res.status(400).json({ error: 'Password required' });
        return;
      }
      const valid = await bcrypt.compare(String(password), existing.password_hash);
      if (!valid) {
        res.status(401).json({ error: 'Invalid password' });
        return;
      }
    }

    if (existing.status !== 'active') {
      res.status(403).json({ error: 'Account is not active', status: existing.status });
      return;
    }

    // Refresh session token on login
    const token = generateToken();
    db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(token, existing.id);
    res.json({ id: existing.id, username: existing.username, email: existing.email, icon: existing.icon, color: existing.color, token });
    return;
  }

  // New user — check for invite code or go to waitlist
  if (!username || !password) {
    res.status(400).json({ error: 'Email, username, and password are required for signup' });
    return;
  }
  const cleanName = String(username).trim();
  const reason = req.body.reason ? String(req.body.reason).trim() : '';
  const invite_code = req.body.invite_code ? String(req.body.invite_code).trim().toUpperCase() : '';

  // If using an invite code, skip waitlist entirely
  if (invite_code) {
    const invite = db.prepare('SELECT * FROM invite_codes WHERE code = ?').get(invite_code) as any;
    if (!invite) {
      res.status(400).json({ error: 'Invalid invite code' });
      return;
    }
    if (invite.used_by) {
      res.status(400).json({ error: 'This invite code has already been used' });
      return;
    }

    try {
      const hash = await bcrypt.hash(String(password), 10);

      // Check username uniqueness
      const usernameTaken = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanName) as any;
      if (usernameTaken) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }

      // If they were on the waitlist, mark it as approved
      const waitlistEntry = db.prepare('SELECT id FROM waitlist WHERE email = ?').get(cleanEmail) as any;
      if (waitlistEntry) {
        db.prepare('UPDATE waitlist SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?').run('approved', waitlistEntry.id);
      }

      // Create user directly (skip waitlist)
      const token = generateToken();
      const stmt = db.prepare('INSERT INTO users (username, email, password_hash, session_token, status) VALUES (?, ?, ?, ?, ?)');
      const result = stmt.run(cleanName, cleanEmail, hash, token, 'active');
      const newUserId = result.lastInsertRowid as number;

      // Mark invite code as used
      db.prepare('UPDATE invite_codes SET used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?').run(newUserId, invite.id);

      // Give the new user their own 2 invite codes
      createInviteCodes(newUserId);

      res.json({ id: newUserId, username: cleanName, email: cleanEmail, icon: 'plane', color: '#FF4F36', token });
    } catch (e: any) {
      if (e.message?.includes('UNIQUE')) {
        res.status(409).json({ error: 'Email or username already taken' });
      } else {
        res.status(400).json({ error: e.message });
      }
    }
    return;
  }

  // No invite code — go to waitlist
  if (!reason) {
    res.status(400).json({ error: 'Please tell us why you want to join' });
    return;
  }

  try {
    const hash = await bcrypt.hash(String(password), 10);

    // Check if already on waitlist
    const existingWaitlist = db.prepare('SELECT id, status FROM waitlist WHERE email = ?').get(cleanEmail) as any;
    if (existingWaitlist) {
      if (existingWaitlist.status === 'pending') {
        res.status(409).json({ error: 'You\'re already on the waitlist! We review requests on Thursdays.' });
      } else if (existingWaitlist.status === 'rejected') {
        // Allow re-application — update the existing entry
        db.prepare('UPDATE waitlist SET username = ?, password_hash = ?, reason = ?, status = ?, reviewed_at = NULL WHERE id = ?')
          .run(cleanName, hash, reason, 'pending', existingWaitlist.id);
        res.json({ waitlisted: true, message: 'Your request has been resubmitted. We review on Thursdays.' });
      } else {
        res.status(409).json({ error: 'An account with this email already exists' });
      }
      return;
    }

    // Check if username is taken (in users or waitlist)
    const usernameTaken = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanName) as any;
    const waitlistNameTaken = db.prepare('SELECT id FROM waitlist WHERE username = ? AND status = ?').get(cleanName, 'pending') as any;
    if (usernameTaken || waitlistNameTaken) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    db.prepare('INSERT INTO waitlist (email, username, password_hash, reason) VALUES (?, ?, ?, ?)')
      .run(cleanEmail, cleanName, hash, reason);
    res.json({ waitlisted: true, message: 'You\'re on the list! We review requests on Thursdays.' });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      res.status(409).json({ error: 'Email or username already taken' });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// Session validation — requires valid session token (not just email)
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
  if (user.status !== 'active') {
    res.status(403).json({ error: 'Account is not active', status: user.status });
    return;
  }
  // Refresh token
  const token = generateToken();
  db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(token, user.id);
  res.json({ id: user.id, username: user.username, email: user.email, icon: user.icon, color: user.color, has_password: !!user.password_hash, token });
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
  const { crew_id, week } = req.query;
  let scores;

  // Week filter: 'current' = this week (Monday 00:00 UTC to now), or ISO date for specific week
  let weekFilter = '';
  const weekParams: string[] = [];
  if (week) {
    const weekStart = week === 'current' ? getCurrentWeekStart() : String(week);
    const weekEnd = getWeekEnd(weekStart);
    weekFilter = ' AND s.created_at >= ? AND s.created_at < ?';
    weekParams.push(weekStart + ' 00:00:00', weekEnd + ' 00:00:00');
  }

  if (crew_id) {
    const internalId = resolveCrewId(String(crew_id));
    if (!internalId) { res.json([]); return; }
    scores = db.prepare(
      `SELECT s.*, u.username FROM scores s JOIN users u ON s.user_id = u.id WHERE s.game = ? AND s.crew_id = ?${weekFilter} ORDER BY s.score DESC LIMIT 50`
    ).all(game, internalId, ...weekParams);
  } else {
    scores = db.prepare(
      `SELECT s.*, u.username FROM scores s JOIN users u ON s.user_id = u.id WHERE s.game = ?${weekFilter} ORDER BY s.score DESC LIMIT 50`
    ).all(game, ...weekParams);
  }
  res.json(scores);
});

// Obstacles — persist crew game obstacles (current week only by default)
app.get('/api/obstacles/:game', (req, res) => {
  const { game } = req.params;
  const { crew_id, week } = req.query;
  if (!crew_id) {
    res.status(400).json({ error: 'crew_id required' });
    return;
  }
  const internalId = resolveCrewId(String(crew_id));
  if (!internalId) { res.json([]); return; }

  // Default to current week — only show obstacles placed this week
  const showAll = week === 'all';
  if (showAll) {
    const obstacles = db.prepare(
      'SELECT o.*, u.username FROM obstacles o LEFT JOIN users u ON o.user_id = u.id WHERE o.crew_id = ? AND o.game = ? ORDER BY o.created_at'
    ).all(internalId, game);
    res.json(obstacles);
  } else {
    const weekStart = getCurrentWeekStart() + ' 00:00:00';
    const obstacles = db.prepare(
      'SELECT o.*, u.username FROM obstacles o LEFT JOIN users u ON o.user_id = u.id WHERE o.crew_id = ? AND o.game = ? AND o.created_at >= ? ORDER BY o.created_at'
    ).all(internalId, game, weekStart);
    res.json(obstacles);
  }
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

// --- Waitlist ---

// Check waitlist status by email
app.get('/api/waitlist/status', (req, res) => {
  const { email } = req.query;
  if (!email) { res.status(400).json({ error: 'Email required' }); return; }
  const entry = db.prepare('SELECT status, created_at FROM waitlist WHERE email = ?').get(String(email).toLowerCase()) as any;
  if (!entry) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ status: entry.status, submitted: entry.created_at });
});

// --- Week helpers ---

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday = 1
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff));
  return monday.toISOString().slice(0, 10);
}

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

function getPreviousWeekStart(): string {
  const d = new Date(getCurrentWeekStart() + 'T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

function snapshotWeek(weekStart: string): { crews: number; highlights: number } {
  const weekEnd = getWeekEnd(weekStart);
  const weekStartTs = weekStart + ' 00:00:00';
  const weekEndTs = weekEnd + ' 00:00:00';
  const games = ['toss-paper', 'origami-trail'];

  const allCrews = db.prepare('SELECT id, uuid FROM crews').all() as any[];
  let highlightCount = 0;

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO weekly_highlights
    (crew_id, game, week_start, week_end, winner_user_id, winner_username, winner_score,
     runner_up_user_id, runner_up_username, runner_up_score, total_plays, participant_count, scores_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const crew of allCrews) {
    for (const game of games) {
      // Get best score per user for this week
      const leaders = db.prepare(`
        SELECT s.user_id, u.username, u.icon, u.color, MAX(s.score) as best_score, MIN(s.created_at) as first_play
        FROM scores s JOIN users u ON s.user_id = u.id
        WHERE s.crew_id = ? AND s.game = ? AND s.created_at >= ? AND s.created_at < ?
        GROUP BY s.user_id
        ORDER BY best_score DESC, first_play ASC
      `).all(crew.id, game, weekStartTs, weekEndTs) as any[];

      if (leaders.length < 2) continue; // Require at least 2 participants

      const totalPlays = db.prepare(`
        SELECT COUNT(*) as count FROM scores
        WHERE crew_id = ? AND game = ? AND created_at >= ? AND created_at < ?
      `).get(crew.id, game, weekStartTs, weekEndTs) as any;

      const winner = leaders[0];
      const runnerUp = leaders[1] || null;
      const scoresJson = JSON.stringify(leaders.map((l: any) => ({
        user_id: l.user_id, username: l.username, score: l.best_score, icon: l.icon, color: l.color,
      })));

      const result = insertStmt.run(
        crew.id, game, weekStart, weekEnd,
        winner.user_id, winner.username, winner.best_score,
        runnerUp?.user_id || null, runnerUp?.username || null, runnerUp?.best_score || null,
        totalPlays.count, leaders.length, scoresJson
      );
      if (result.changes > 0) highlightCount++;
    }
  }

  return { crews: allCrews.length, highlights: highlightCount };
}

// --- Weekly highlights ---

app.get('/api/crews/:uuid/highlights', (req, res) => {
  const { uuid } = req.params;
  const crewId = resolveCrewId(uuid);
  if (!crewId) { res.status(404).json({ error: 'Crew not found' }); return; }

  const limit = Math.min(Number(req.query.limit) || 12, 52);
  const gameFilter = req.query.game ? ' AND game = ?' : '';
  const params: any[] = [crewId];
  if (req.query.game) params.push(String(req.query.game));

  const highlights = db.prepare(`
    SELECT h.*, u1.icon as winner_icon, u1.color as winner_color,
           u2.icon as runner_up_icon, u2.color as runner_up_color
    FROM weekly_highlights h
    LEFT JOIN users u1 ON u1.id = h.winner_user_id
    LEFT JOIN users u2 ON u2.id = h.runner_up_user_id
    WHERE h.crew_id = ?${gameFilter}
    ORDER BY h.week_start DESC
    LIMIT ?
  `).all(...params, limit) as any[];

  // Compute streaks: check if the same winner won the previous week for the same game
  const result = highlights.map((h: any) => {
    const prev = db.prepare(`
      SELECT winner_user_id FROM weekly_highlights
      WHERE crew_id = ? AND game = ? AND week_start < ?
      ORDER BY week_start DESC LIMIT 1
    `).get(crewId, h.game, h.week_start) as any;

    const streak = prev && prev.winner_user_id === h.winner_user_id;

    return {
      id: h.id,
      game: h.game,
      week_start: h.week_start,
      week_end: h.week_end,
      winner: {
        user_id: h.winner_user_id,
        username: h.winner_username,
        score: h.winner_score,
        icon: h.winner_icon,
        color: h.winner_color,
        streak,
      },
      runner_up: h.runner_up_user_id ? {
        user_id: h.runner_up_user_id,
        username: h.runner_up_username,
        score: h.runner_up_score,
        icon: h.runner_up_icon,
        color: h.runner_up_color,
      } : null,
      total_plays: h.total_plays,
      participant_count: h.participant_count,
      scores: h.scores_json ? JSON.parse(h.scores_json) : [],
    };
  });

  res.json(result);
});

// Highlights stats summary (most wins, top score)
app.get('/api/crews/:uuid/highlights/stats', (req, res) => {
  const { uuid } = req.params;
  const crewId = resolveCrewId(uuid);
  if (!crewId) { res.status(404).json({ error: 'Crew not found' }); return; }

  const mostWins = db.prepare(`
    SELECT winner_user_id as user_id, winner_username as username, COUNT(*) as wins, game
    FROM weekly_highlights WHERE crew_id = ?
    GROUP BY winner_user_id, game
    ORDER BY wins DESC LIMIT 1
  `).get(crewId) as any;

  const topScore = db.prepare(`
    SELECT winner_user_id as user_id, winner_username as username, winner_score as score, game, week_start
    FROM weekly_highlights WHERE crew_id = ?
    ORDER BY winner_score DESC LIMIT 1
  `).get(crewId) as any;

  res.json({ most_wins: mostWins || null, top_score: topScore || null });
});

// --- Invite codes ---

// Get my invite codes
app.get('/api/invites', (req, res) => {
  const authed = authenticateRequest(req);
  if (!authed) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const codes = db.prepare(`
    SELECT ic.code, ic.used_by, ic.used_at, ic.created_at, u.username as used_by_username
    FROM invite_codes ic
    LEFT JOIN users u ON u.id = ic.used_by
    WHERE ic.created_by = ?
    ORDER BY ic.created_at
  `).all(authed.id);
  res.json(codes);
});

// Validate an invite code (public, no auth needed)
app.get('/api/invites/check', (req, res) => {
  const { code } = req.query;
  if (!code) { res.status(400).json({ error: 'Code required' }); return; }
  const invite = db.prepare('SELECT ic.code, ic.used_by, u.username as invited_by FROM invite_codes ic JOIN users u ON u.id = ic.created_by WHERE ic.code = ?')
    .get(String(code).trim().toUpperCase()) as any;
  if (!invite) { res.json({ valid: false }); return; }
  if (invite.used_by) { res.json({ valid: false, reason: 'already_used' }); return; }
  res.json({ valid: true, invited_by: invite.invited_by });
});

// --- Admin: Waitlist management ---

app.get('/api/admin/waitlist', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const status = req.query.status ? String(req.query.status) : undefined;
  const entries = status
    ? db.prepare('SELECT id, email, username, reason, source, status, ai_recommendation, ai_reasoning, ai_confidence, ai_welcome_message, reviewed_at, created_at FROM waitlist WHERE status = ? ORDER BY created_at').all(status)
    : db.prepare('SELECT id, email, username, reason, source, status, ai_recommendation, ai_reasoning, ai_confidence, ai_welcome_message, reviewed_at, created_at FROM waitlist ORDER BY created_at').all();
  res.json(entries);
});

app.post('/api/admin/waitlist/:id/approve', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const entry = db.prepare('SELECT * FROM waitlist WHERE id = ?').get(req.params.id) as any;
  if (!entry) { res.status(404).json({ error: 'Waitlist entry not found' }); return; }
  if (entry.status === 'approved') { res.status(400).json({ error: 'Already approved' }); return; }

  try {
    // Create the user account from waitlist data
    const token = generateToken();
    const stmt = db.prepare('INSERT INTO users (username, email, password_hash, session_token, status) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(entry.username, entry.email, entry.password_hash, token, 'active');

    // Mark waitlist entry as approved
    db.prepare('UPDATE waitlist SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?').run('approved', entry.id);

    // Generate 2 invite codes for the new user
    const inviteCodes = createInviteCodes(result.lastInsertRowid as number);

    res.json({ ok: true, user_id: result.lastInsertRowid, username: entry.username, email: entry.email, invite_codes: inviteCodes });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      res.status(409).json({ error: 'Username or email already exists as a user' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

app.post('/api/admin/waitlist/:id/reject', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const entry = db.prepare('SELECT * FROM waitlist WHERE id = ?').get(req.params.id) as any;
  if (!entry) { res.status(404).json({ error: 'Waitlist entry not found' }); return; }

  db.prepare('UPDATE waitlist SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?').run('rejected', entry.id);
  res.json({ ok: true });
});

app.get('/api/admin/stats', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const users = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = ?').get('active') as any;
  const pending = db.prepare('SELECT COUNT(*) as count FROM waitlist WHERE status = ?').get('pending') as any;
  const approved = db.prepare('SELECT COUNT(*) as count FROM waitlist WHERE status = ?').get('approved') as any;
  const rejected = db.prepare('SELECT COUNT(*) as count FROM waitlist WHERE status = ?').get('rejected') as any;
  const crews = db.prepare('SELECT COUNT(*) as count FROM crews').get() as any;
  res.json({
    active_users: users.count,
    crews: crews.count,
    waitlist: { pending: pending.count, approved: approved.count, rejected: rejected.count },
  });
});

// --- Admin: User management ---

app.post('/api/admin/users/:id/reset-password', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(req.params.id) as any;
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const { password } = req.body;
  if (!password) { res.status(400).json({ error: 'Password required' }); return; }
  const hash = await bcrypt.hash(String(password), 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
  res.json({ ok: true, user_id: user.id, username: user.username });
});

// --- Admin: Weekly highlights snapshot ---

app.post('/api/admin/highlights/snapshot', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const weekStart = req.body?.week_start || getPreviousWeekStart();
  try {
    const result = snapshotWeek(weekStart);
    res.json({ ok: true, week_start: weekStart, ...result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Admin: DB backup endpoints ---

function requireAdmin(req: express.Request, res: express.Response): boolean {
  if (!ADMIN_TOKEN) {
    res.status(503).json({ error: 'Admin token not configured' });
    return false;
  }
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ') || auth.slice(7) !== ADMIN_TOKEN) {
    res.status(401).json({ error: 'Invalid admin token' });
    return false;
  }
  return true;
}

// Download the raw DB file
app.get('/api/admin/backup/download', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const dbPath = process.env.NODE_ENV === 'production'
    ? '/tmp/paper.db'
    : path.join(__dirname, 'paper.db');
  if (!fs.existsSync(dbPath)) {
    res.status(404).json({ error: 'No database file found' });
    return;
  }
  res.download(dbPath, 'paper.db');
});

// Trigger a backup to GCS
app.post('/api/admin/backup', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const label = req.body?.label || 'manual';
    const key = await backupToGCS(label);
    res.json({ status: 'ok', key });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List recent backups
app.get('/api/admin/backup/list', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const backups = await listBackups();
    res.json({ backups });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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

// Weekly highlights cron (production only)
// Targets noon PST Thursday = 19:00 or 20:00 UTC depending on DST
// Checks every 15 minutes on Thursdays after 19:00 UTC
if (process.env.NODE_ENV === 'production') {
  let lastSnapshotWeek = '';
  setInterval(() => {
    const now = new Date();
    if (now.getUTCDay() === 4 && now.getUTCHours() >= 19) {
      const prevWeek = getPreviousWeekStart();
      if (prevWeek !== lastSnapshotWeek) {
        try {
          const result = snapshotWeek(prevWeek);
          lastSnapshotWeek = prevWeek;
          console.log(`[highlights] Snapshot for week ${prevWeek}: ${result.highlights} highlights from ${result.crews} crews`);
        } catch (err) {
          console.error('[highlights] Snapshot failed:', err);
        }
      }
    }
  }, 15 * 60 * 1000); // Check every 15 minutes
}
