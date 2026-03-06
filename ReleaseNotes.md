# Release Notes

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
