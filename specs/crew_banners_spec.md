# Crew Banners & Player Flags — Feature Spec
*Version 1.0 — March 2026*

---

## Overview

After a throw lands in Toss Paper, a small flag/banner plants at the landing spot showing who threw and how far. Placed obstacles also display the placer's icon and crew banner. In multiplayer, this turns the field into a visual history of everyone's plays — you can see where your crewmates (and rivals) landed and what they placed.

---

## Player Flags (Landing Markers)

### What happens after a throw lands

A small flag appears at the landing position showing:
- **Player icon** (plane, crane, etc.) in their chosen color
- **Username** (tiny monospace label)
- **Distance score** (e.g. "47 pts")

Flags persist for the current game session (single mode) or until the weekly reset (multi mode).

### Multi-mode: see everyone's throws

When loading a crew game, fetch all landing markers for the current week:
- `GET /api/landings/:game?crew_id=X` — returns position, user, score, color
- Render each as a small colored flag along the ground
- Hovering/tapping a flag shows the player name and score

### Storage

New table:
```sql
CREATE TABLE IF NOT EXISTS landings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crew_id INTEGER REFERENCES crews(id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  x REAL NOT NULL,
  score INTEGER NOT NULL,
  color TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Filtered by current week (same as obstacles).

### API

- `POST /api/landings` — `{ crew_id, game, user_id, x, score, color }` — called in `triggerLanded()` for multi mode
- `GET /api/landings/:game?crew_id=X` — returns current week's landings

---

## Crew Banners

### What is a banner

Each crew can set a **banner** — a simple symbol + color combo that represents the crew. Think sports team pennant, not a full image upload.

### Banner options

Choose from a set of symbols (same approach as player icons):
- Shapes: shield, diamond, circle, star, triangle, hexagon
- Motifs: lightning, flame, wave, leaf, crown, sword

Combined with a crew color (chosen from the existing PLAYER_COLORS palette).

### Where banners appear

1. **Landing flags** — the crew banner appears as a tiny pennant next to the player flag, so you can tell which crew made each throw
2. **Placed obstacles** — a small banner icon overlays the corner of placed obstacles
3. **Crew Room header** — the banner displays next to the crew name
4. **Weekly Highlights** — winner cards show the crew banner

### Storage

Add columns to the `crews` table:
```sql
ALTER TABLE crews ADD COLUMN banner_symbol TEXT DEFAULT 'shield';
ALTER TABLE crews ADD COLUMN banner_color TEXT DEFAULT '#4992FF';
```

### API

- `PATCH /api/crews/:uuid` — update `{ banner_symbol, banner_color }` (auth required, crew creator only)
- Banner data included in existing `GET /api/crews/:uuid` response

---

## Obstacle Identity

### Current behavior

Placed obstacles are tinted with the player's color but don't show who placed them.

### New behavior

- Each placed obstacle renders a small **player icon badge** in the corner (8x8px circle with their icon)
- In multi mode, the **crew banner** also appears as a tiny pennant attached to the obstacle
- Hovering/tapping an obstacle shows a tooltip: "Placed by {username}" with their icon

### Phaser rendering

- After creating the obstacle sprite, add a small circle graphic at the top-right corner with the player's icon color
- Use `setDepth()` to layer the badge above the obstacle
- The badge is part of the obstacle group so it moves/destroys with the obstacle

---

## Visual Design

### Flag style
```
    ┌──┐
    │♦ │  ← crew banner symbol in crew color
    └──┘
     │    ← thin pole line
     │
  ───┴─── ground
   47 pts
   jason
```

### Obstacle badge
```
  ┌──────────┐
  │          ●│ ← 8px circle in player color
  │  WALL    │
  │          │
  └──────────┘
```

### Colors
- Flag pole: `#B0A898` (muted)
- Flag background: player's color at 80% opacity
- Score text: `#1A1A1A` monospace 10px
- Username: `#6B6B6B` monospace 9px

---

## Implementation Plan

### Phase 1 — Landing flags
1. Add `landings` table to `server/db.ts`
2. Add `POST /api/landings` and `GET /api/landings/:game` endpoints
3. Post landing data in `TossPaperScene.triggerLanded()` (multi mode)
4. Load and render flags in `startMultiGame()`
5. Filter landings by current week (same as obstacles)

### Phase 2 — Crew banners
1. Add `banner_symbol`, `banner_color` columns to `crews` table
2. Add `PATCH /api/crews/:uuid` for banner updates
3. Create banner picker UI in CrewRoom (similar to color picker)
4. Render banner in crew room header

### Phase 3 — Obstacle identity
1. Add player icon badge to placed obstacles in Phaser
2. Add crew banner pennant to obstacles in multi mode
3. Add hover/tap tooltip showing placer info

### Phase 4 — Visual polish
1. Flag animation (small wave/flutter on the pennant)
2. Landing flags fade slightly over time (older = more transparent)
3. Dense flag areas stack/offset to avoid overlap
