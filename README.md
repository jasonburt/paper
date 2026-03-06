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
├── specs/             # Game and system specs
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
