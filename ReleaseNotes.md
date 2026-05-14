# Release Notes

## v0.8.0 — Weekly Highlights (2026-03-19)

### Added
- **Weekly Highlights system** — scores are snapshotted every Thursday, crowning winners per game per crew
- **Highlights tab in Crew Room** — `[ Leaderboard | Weekly Winners ]` tab navigation
- **Winner cards** — shows weekly champion with star icon, avatar in their color, runner-up, and expandable full leaderboard
- **Stats summary** — "Most Wins" and "Top Score" stats bar above the week history
- **Streak badges** — 🔥 icon when a player wins the same game 2+ consecutive weeks
- **Weekly score filter** — leaderboard now shows "This Week" by default with "Show All Time" toggle
- **`GET /api/crews/:uuid/highlights`** — weekly highlight history endpoint with streak detection
- **`GET /api/crews/:uuid/highlights/stats`** — stats summary (most wins, top score)
- **`POST /api/admin/highlights/snapshot`** — manual snapshot trigger for testing/backfill
- **`?week=current` filter** on `GET /api/scores/:game` — filters scores to current week
- **Snapshot script** — `npm run snapshot` (`scripts/weekly-snapshot.sh`) triggers the weekly snapshot against production
- **Automatic Thursday cron** — server-side fallback snapshots at ~noon PST every Thursday in production
- **Smoke tests expanded** — 50 tests (up from 42), covering snapshot, highlights, stats, weekly filter

### Changed
- Crew Room leaderboard now defaults to current week's scores (was all-time)
- Object Picker extracted to reusable Vue component (from previous session)
- Fixed scroll vs place bug in Toss Paper (from previous session)

---

## v0.7.0 — Invite Codes (2026-03-19)

### Added
- **User invite codes** — approved users get 2 invite codes they can share with friends to skip the waitlist
- **Invite code signup** — new users with a valid invite code go directly to an active account (no waitlist)
- **Invite chain** — invited users also receive 2 invite codes, enabling organic growth
- **Invite code validation** — `GET /api/invites/check?code=` public endpoint to verify codes before signup
- **My invites endpoint** — `GET /api/invites` (authenticated) returns a user's codes with usage status
- **Invite UI in crew hub** — users see their invite codes with copy buttons and usage status
- **Login page invite field** — signup form accepts an optional invite code with live validation
- **Smoke tests expanded** — 42 tests (up from 23), covering full invite code lifecycle

### Changed
- Admin approval now auto-generates 2 invite codes for newly approved users
- Signup with invite code returns user data + token directly (no waitlist step)

---

## v0.6.1 — Deploy Fix (2026-03-14)

### Fixed
- **Deploy script** — changed `--set-env-vars` to `--update-env-vars` so deploys don't wipe existing Cloud Run env vars
- **Startup timeout** — added `--cpu-boost` flag to avoid health check timeouts during cold starts (container was starting successfully but too slowly for the default probe)
- **Admin token** — `ADMIN_TOKEN` now properly set on Cloud Run, enabling admin/waitlist/backup endpoints in production

---

## v0.6.0 — Password Auth & Waitlist (2026-03-12)

### Added
- **Password authentication** — all users now need a password to sign in; existing users are prompted to set one on next login
- **Waitlist system** — new signups go to a waitlist with a reason field; requests are reviewed on Thursdays
- **Admin waitlist management** — `GET /api/admin/waitlist`, `POST /api/admin/waitlist/:id/approve`, `POST /api/admin/waitlist/:id/reject`, `GET /api/admin/stats` (all admin-token protected)
- **Auth check endpoint** — `POST /api/auth/check` determines login state (existing user, grandfathered, waitlisted, or new)
- **Interactive review script** — `npm run waitlist` opens a terminal UI to approve/reject pending requests
- **Waitlist confirmation page** — `/waitlist-confirmed` shows pending status after signup
- **Smoke tests expanded** — 31 tests covering auth check, waitlist signup, admin approval, password enforcement, and admin stats

### Changed
- Login page redesigned with three-step flow: email → password → signup (if new)
- `authenticateRequest()` now checks user status — non-active users are blocked from protected endpoints
- Signup requires a reason ("Why do you want to join Paper?") — minimum effort filter

---

## v0.5.1 — Database Backup & Persistence (2026-03-11)

### Added
- **GCS database backups** — SQLite DB is automatically backed up to Google Cloud Storage hourly and on every deploy
- **Auto-restore on boot** — new instances restore the latest backup from GCS before initializing, so deploys no longer wipe data
- **Admin backup API** — `POST /api/admin/backup` triggers a backup, `GET /api/admin/backup/download` downloads the raw DB, `GET /api/admin/backup/list` lists recent backups (all protected by admin token)
- **Pre-deploy backup script** — `npm run backup` saves a local copy and uploads to GCS before deploying
- **Deploy script** — `npm run deploy` backs up then deploys to Cloud Run in one command
- **READMEDB.md** — full documentation for the backup system, setup, and commands

### Fixed
- **Crews disappearing after login** — Cloud Run was routing requests across multiple instances, each with its own empty SQLite DB; fixed by setting max-instances to 1
- **Single-instance deployment** — min and max instances set to 1 to ensure all requests hit the same SQLite file

---

## v0.5.0 — Login, Logout & User Settings (2026-03-06)

### Added
- **Email-based login** — new `/login` page; enter email to sign in or sign up with a username
- **Logout** — log out button on the crew hub clears session and returns home
- **Session tokens** — lightweight auth prevents user impersonation; all mutating API endpoints require a valid token
- **Session validation** — detects stale localStorage after production DB resets and redirects to login instead of crashing
- **UUID crew IDs** — crew URLs now use 12-char hex IDs instead of auto-increment integers (e.g. `/paper-crew-room/a1b2c3d4e5f6`)
- **User settings** — edit your username and view your email from the profile settings (⚙ gear icon)
- **Username uniqueness** — server rejects duplicate usernames with a clear error message

### Fixed
- **"Session expired" errors** — the root cause: ephemeral production DB resets left stale localStorage IDs causing FOREIGN KEY crashes; now handled gracefully via email-based session recovery

---

## v0.4.2 — Toss Paper Mobile-Friendly (2026-03-06)

### Improved
- **Nav visible during gameplay** — moved the back button out of the Phaser canvas and into the HeaderNav so it's always accessible and touch-friendly
- **Off-screen drag fix** — dragging the plane off the edge of the screen no longer leaves it stuck; `pointerupoutside` and `gameout` events now trigger launch correctly
- **Scroll buttons for obstacle placement** — ◀ ▶ buttons let mobile users pan across the full 4000px launch field when placing obstacles

---

## v0.4.1 — Create Crew Fix + Placeable Objects (2026-03-05)

### Fixed
- **Create Crew crashes in production** — stale user IDs from localStorage caused an unhandled FOREIGN KEY error on the server, returning a 500 with no feedback to the user; added server-side validation, user existence check, and invite code collision retry
- **Silent error swallowing on Create Crew form** — replaced `catch { // ignore }` with proper error display so users see actionable messages like "Your session expired"
- **Invite codes could be shorter than 6 characters** — `Math.random().toString(36)` can produce short strings; codes are now padded and trimmed to exactly 6 chars

---

## v0.4.0 — Vue Migration + Origami Trail (2026-03-04)

### Added
- **Origami Trail mini game** — duck-hunt style shooting game with wave system, combo scoring, and obstacle placement between waves
- **Origami Trail multiplayer** — 3-wave crew mode with score posting and shared obstacles

### Changed
- **Migrated all UI pages from Phaser canvas to Vue + Tailwind CSS**
  - Home page, Paper Crew hub, Create Crew, Join Crew, and Crew Room are now real HTML
  - Selectable text, native clipboard, accessible forms, proper inputs
  - Phaser canvas now only used for actual game scenes (Toss Paper, Origami Trail)
- **App.vue handles all routing** — conditional rendering between Vue pages and Phaser GameCanvas
- **HeaderNav simplified** — delegates all navigation through `pushRoute()` and App.vue
- **PlayerIcon SVG component** — replaces Phaser `drawPlayerIcon()` with inline SVG for Vue pages

---

## v0.3.1 — Multi-Mode + Player Identity (2026-03-02)

### Added
- **Player color picker** — choose from 6 origami-inspired colors before each multi game
- **Player icon selection** — pick an icon and color to represent yourself in crews
- **Obstacle persistence** — obstacles placed in multi mode are saved to the server for the next player
- **Player-colored obstacles** — each player's obstacles appear in their chosen color
- **One throw per turn** — in multi mode, player throws once, places one obstacle, then returns to crew room

### Changed
- Multi mode now auto-navigates back to crew room after placing an obstacle
- HUD shows "Your Turn" in multi mode instead of throw count
- `user_id` now falls back to localStorage when not passed in scene data

---

## v0.3.0 — Paper Crew + Routing (2026-03-02)

### Added
- **Paper Crew system** — invite-based crew rooms for async multiplayer
  - Create crews, get a 6-character invite code, share with friends
  - Join crews by entering an invite code
  - Crew hub lists your crews with member counts
  - Crew detail shows members, leaderboard, and invite code (click to copy)
- **Client-side routing** — URL-based navigation with browser back/forward
  - `/toss-paper/single` — solo practice mode
  - `/toss-paper/multi/:crewId` — crew multiplayer with score tracking
  - `/paper-crew`, `/paper-crew/create`, `/paper-crew/join`, `/paper-crew-room/:id`
- **User identity** — lightweight localStorage-based username system
- **Distance markers** — ground-level distance labels in Toss Paper
- **Back button after obstacle placement** — players can exit after throwing and placing

### Changed
- Toss Paper now has two modes: solo practice (`/single`) and crew multiplayer (`/multi/:crewId`)
- Backend API moved to port 3011
- Express 5 SPA catch-all fixed for production builds

### Fixed
- CreateCrewScene restart bug (removeAllListeners killed transition timer)
- Express 5 path-to-regexp catch-all route syntax (`/{*path}`)

---

## v0.2.0 — Toss Paper MVP (2026-03-01)

### Added
- **Toss Paper mini game** — solo-playable paper airplane throwing game
  - Slingshot drag-to-throw controls with trajectory preview
  - Physics: gravity arc, wind drift, air drag, nose rotation
  - Camera follows the plane during flight
  - Distance-based scoring (1 point per grid unit)
  - Obstacle placement after each throw (cycles: Paper Wall → Crumpled Ball → Paper Fan)
  - Obstacles compound across throws, making each round harder
  - Collision handling: walls stop, balls deflect, fans gust
  - Wind randomized per throw with HUD indicator
  - Back button to return to main menu
- **Design system** applied to game: white paper background, origami brand colors for HUD

### Changed
- Main menu "Toss Paper" now navigates to the game scene

---

## v0.1.0 — Project Setup (2026-03-01)

### Added
- Phaser 3 + Vite + TypeScript frontend scaffold
- Express + SQLite backend scaffold (users, crews, scores API)
- Main menu with Toss Paper, Origami Trail, Paper Crew entries
- Design system (Design.md) with origami color palette
- Game specs: Toss Paper, Origami Trail, Origami Scanner
