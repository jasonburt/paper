# Agent Guide to Game Building

Quick reference for building new games that work with Paper's crew and league systems.

## Shared Components

- **ObjectPicker** (`src/components/ObjectPicker.vue`) — Reusable HTML/CSS picker overlay for selecting placeable objects. Communicates with Phaser via window events (`paper:show-picker`, `paper:object-selected`, `paper:picker-skip`).
- **GameCanvas** (`src/components/GameCanvas.vue`) — Phaser mount point + ObjectPicker overlay. Register new scenes in the `scene` array here.
- **Leaderboard** (`src/components/Leaderboard.vue`) — Score display, used in CrewRoom.
- **WeeklyHighlights** (`src/components/WeeklyHighlights.vue`) — Weekly winner history per crew.
- **PlayerIcon** (`src/components/PlayerIcon.vue`) — Renders user avatar icons with color.
- **Placeable Objects** (`src/data/placeable-objects.ts`) — Object definitions (id, effect, grid size, sprite key). Add new objects here + textures in the scene + collision handler.

## Game Scene Setup

Every game scene must handle these states:

1. **Color pick** (multi mode) — Let player choose their obstacle color
2. **Load obstacles** — `GET /api/obstacles/{game}?crew_id=X` (returns current week only by default)
3. **Gameplay** — Your game loop
4. **Score submission** — `POST /api/scores` with `{ user_id, game, score, crew_id }`
5. **Place obstacle** — Show ObjectPicker, confirm placement, `POST /api/obstacles`
6. **Navigate back** — `pushRoute(/paper-crew-room/${crewId})` after placing (multi) or restart (single)

## Weekly Lifecycle

- **Scores** — Filtered by week via `?week=current`. All-time data stays in DB.
- **Obstacles** — `GET /api/obstacles` defaults to current week. Old obstacles are not deleted but hidden.
- **Highlights snapshot** — `npm run snapshot` (Thursday noon PST) captures winners and resets the visible leaderboard.
- **No data deletion** — The "reset" is a filter, not a purge. All historical data persists for all-time views and future league percentile calculations.

## Adding a New Game

1. Create scene in `src/scenes/YourGameScene.ts` extending `Phaser.Scene`
2. Register it in `GameCanvas.vue` scene array
3. Add routes in `src/router.ts` (`/your-game/single`, `/your-game/multi/:crewId`)
4. Add route handling in `src/App.vue`
5. Add play button in `CrewRoom.vue`
6. Add game name to `snapshotWeek()` games array in `server/index.ts`
7. Add object definitions to `placeable-objects.ts` if the game has placeable obstacles

## Key Conventions

- Crew IDs are 12-char hex UUIDs in URLs, integer IDs internally — use `resolveCrewId()`
- Auth via `Authorization: Bearer <token>` header — `api.ts` injects it automatically
- Obstacle placement uses 40px grid snapping
- Player colors tint placed obstacles — stored in `obstacles.color`
- Single mode loops (throw → place → throw); multi mode places once then returns to crew room
