# Paper

A collection of origami-themed mini games built with Vue 3, Phaser 3, and Express. Players throw paper airplanes, shoot origami creatures, create crews with friends, and place obstacles for each other.

## Games

**Toss Paper** — Paper airplane throwing competition. Drag to launch, watch the physics play out, then place an obstacle for the next player. Wind, gravity, and obstacles make each throw unique.

**Origami Trail** — Side-scrolling shooting gallery inspired by Duck Hunt. Shoot origami creatures across waves of increasing difficulty with combo multipliers and time bonuses.

Both games support solo practice and crew multiplayer.

## Paper Crew

Invite-based crew rooms for async multiplayer. Create a crew, share the 6-character invite code, and compete on shared leaderboards. Players take turns throwing and placing obstacles that persist for everyone.

## Tech Stack

- **Frontend**: Vue 3 + Phaser 3 + TypeScript + Tailwind CSS
- **Backend**: Express 5 + SQLite (better-sqlite3)
- **Build**: Vite
- **Deploy**: Docker on Google Cloud Run

## Getting Started

```bash
npm install

# Run frontend + backend together
npm run dev:all

# Or separately
npm run dev        # Vite dev server on :5173
npm run server     # Express API on :3011
```

The Vite dev server proxies `/api` requests to the Express backend.

**Note:** The backend does not hot-reload. Use `npx tsx watch server/index.ts` instead of `npm run server` for auto-restart during development.

## Testing

```bash
npm test           # Runs API smoke tests (requires backend on :3011)
```

The smoke test (`scripts/test-api.sh`) exercises the full API lifecycle: signup, login, session validation, profile updates, crew CRUD, scores, auth enforcement, and error handling. Run it after any backend change to catch regressions quickly.

You can also verify the backend is running your latest code:
```bash
curl http://localhost:3011/api/health   # Check the "booted" timestamp
```

## Build & Production

```bash
npm run build      # Builds frontend (dist/) + server (dist-server/)
npm start          # Runs production server (serves API + static files)
```

## Project Structure

```
paper/
├── src/
│   ├── components/    # Vue pages (Home, CrewHub, CreateCrew, etc.)
│   ├── scenes/        # Phaser game scenes (TossPaper, OrigamiTrail)
│   ├── data/          # Game object catalogs
│   └── utils/         # API client, responsive helpers, user identity
├── server/
│   ├── index.ts       # Express API (users, crews, scores, obstacles)
│   └── db.ts          # SQLite schema and migrations
├── scripts/
│   └── test-api.sh    # API smoke tests (23 checks)
├── specs/             # Game and system specs
├── CLAUDE.md          # Claude Code project conventions
├── Design.md          # Color palette, typography, layout rules
├── ReleaseNotes.md    # Version history
└── DEPLOYMENT.md      # Cloud Run deployment guide
```

## Design

White paper aesthetic with color from origami — Star Yellow, Petal Orange, Gift Red, Sky Blue. Georgia serif headings, system sans body. See [Design.md](./Design.md) for the full system.

## Docs

- [Release Notes](./ReleaseNotes.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Design System](./Design.md)
- [Game Specs](./specs/README.md)
- [Claude Code Conventions](./CLAUDE.md)
