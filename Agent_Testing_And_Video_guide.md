# Agent Testing & Video Guide

Practical notes for driving the Paper app with the `local-tools` **web journey builder** MCP tool — especially for the Phaser canvas games (Toss Paper, Origami Trail). Read this before authoring a new journey.

## What the tool can do

`mcp__local-tools__web_journey_builder_call` runs Playwright in headless Chromium and records a `.webm`. Step kinds you actually need:

| Step | Shape | Notes |
|---|---|---|
| `wait_for_selector` | `"text=…"` or CSS | **Only DOM**. Phaser-drawn text on the canvas is NOT queryable. |
| `wait_for` | URL | Waits on `pushRoute` navigation. |
| `delay` | ms | Use for animations / Phaser scene lifecycle gaps. |
| `click` | `"selector"` **or** `{"selector": ..., "position": [x,y]}` | Position is offset within the selector's bounding box. Use this for canvas clicks. |
| `drag` | `{"selector": ..., "from": [x,y], "to": [x,y], "steps": N}` | Offsets within selector. `steps≥15` for visible animation (Phaser drives slingshot preview from `pointermove`). |
| `fill` | `[selector, value]` | Standard input fill. |
| `evaluate` | JS string | Runs in page context. Use to poke `window.__PAPER_GAME__` for deterministic state. |
| `screenshot` | `"name.png"` | Full-page. Lives in `/Users/jason/Development/mcp_services/paper/`. |

`record_video: true` writes to `/Users/jason/Development/mcp_services/journeys/videos/`. The returned `video_url_localhost` (port 3005) is **gated by Bearer auth** — agents can't open it. Copy the `.webm` into the project dir and `open` it directly.

## Paper app entry points

| URL | What renders | DOM or Canvas? |
|---|---|---|
| `/` | Home page | DOM (`text=Toss Paper` link works) |
| `/login` | Email → password / signup | DOM |
| `/paper-crew` | Crew hub (auth required) | DOM |
| `/paper-crew/create` | Create crew form | DOM |
| `/paper-crew/join` | Join crew form | DOM |
| `/paper-crew-room/{uuid}` | Crew detail | DOM |
| `/toss-paper/single` | Toss Paper solo | **Phaser canvas** + Vue overlay |
| `/toss-paper/multi/{uuid}` | Toss Paper multiplayer | **Phaser canvas** (needs login + crew) |
| `/origami-trail` / `/origami-trail/multi/...` | Origami Trail | **Phaser canvas** |

Solo modes need NO login. Multi modes need a logged-in user and a crew UUID — bake into the journey via signup-with-invite-code, then create-crew (see `Paper_full_tour_…` saved journey).

## Canvas coordinate math

Phaser game config:
- World: `800 × 600` (`WORLD_WIDTH=4000` for Toss Paper scrollable field, but viewport is 800×600)
- Scale mode: `Phaser.Scale.FIT` + `CENTER_BOTH`

At Playwright's default viewport `1280 × 720` with the Paper HeaderNav (~52px):
- Canvas DOM size: **890 × 668** (height-constrained, 4:3)
- Canvas page offset: `((1280-890)/2, ~52) = (195, 52)`
- **Scale factor: ≈ 1.113** (`668/600 = 890/800`)

**World → canvas-local pixel:** `(worldX × 1.113, worldY × 1.113)`

The `drag` and `click position` actions take **canvas-local** offsets, not page coords — Playwright adds the bounding box offset itself.

To probe live: `{"evaluate": "(()=>{const c=document.querySelector('canvas'),r=c.getBoundingClientRect();return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height,scale:r.height/600});})()"}`

## Toss Paper specifics

### Key world coordinates
```
LAUNCH:    (180, 350)        — plane resets here each throw
GROUND_Y:  480               — y >= 480 = landed
MAX_DRAG:  160 world units   — slingshot pull cap
GRID_SIZE: 40                — obstacle snap, score unit
GRAVITY:   200 px/s²
MAX_SPEED: 950
Plane body: 36×16, centered on sprite
Wall body:  80×40, origin (0,0) → covers (gridX..gridX+80, gridY..gridY+40)
```

### Slingshot drag mechanics

`onPointerDown` accepts only if pointer is within **80 world units** of LAUNCH (= ~89 canvas px). Pull direction is **inverse** of launch direction — pull down-left → launch up-right.

Known-good throw (lands around grid 50, lots of arc):
```json
{"drag": {"selector": "canvas",
          "from": [200, 390],  // canvas px ~ world (180, 350) — on plane
          "to":   [83, 473],   // canvas px ~ world (75, 425)  — pulled down-left
          "steps": 20}}
```
Power ≈ 0.81, launch angle ≈ -35° (up-right), `vx≈624`, `vy≈-445`.

### Wind randomizes per throw

`enterPreThrow()` runs `windStrength = Math.Between(-3,3) * 20` every time the plane resets. **Pin it for reproducibility** AFTER each `enterPreThrow` trigger:
```json
{"evaluate":
  "(()=>{const s=window.__PAPER_GAME__.scene.getScene('TossPaperScene'); s.windStrength=0; if(s.windText) s.windText.setText('Wind: calm'); return 'wind=0';})()"}
```
Trigger points: (a) after canvas first loads, (b) ~1.2s after every `confirmObstaclePlacement` click (single mode loops back to PRE_THROW which re-randomizes).

### Game state loop (single mode)

```
PRE_THROW  →  DRAGGING (pointer down near plane)
            →  FLYING  (pointer up, launchPlane fires)
            →  LANDED  (hit ground, hit wall/blocker, or low speed)
            → (1.5s)
            →  OBJECT_PICKER  (camera scrolls back, Vue overlay fades in)
            →  PLACE_OBSTACLE (after picker click)
            →  PRE_THROW      (loop, plane resets)
```

Multi mode differs: after one obstacle placement it `pushRoute`s back to crew room.

### Picker overlay (Vue, not Phaser)

Rendered by `ObjectPicker.vue` when the scene fires `paper:show-picker`. DOM:
- Container: `.object-picker-overlay`
- Cells: `.picker-cell` (add `:not(.coming-soon)` to skip locked items)
- Search input: `.picker-search`

First available cell is always **Paper Wall** (the canonical blocker). Cells fire `paper:object-selected`; the scene picks it up and switches to PLACE_OBSTACLE.

### Placing obstacles

After picker click, click the canvas at the desired pixel — Phaser snaps to a 40-unit grid in world coords. **Snap quirk**: `gridX = floor(worldX/40)*40`. Click at canvas pixel `(401, 200)` → world `(360, 180)`, but with floating-point round-off it can land at `(320, 160)` instead. **Safety margin: click well inside the desired cell**, e.g., add ~20px past the cell boundary.

`confirmObstaclePlacement` rejects `gridX < 200` or `gridY >= 480`.

### Trajectory cheat sheet (wind=0, known-good throw above)

Approximate `(x, y)` of plane center during ascending arc:

| t (s) | world x | world y |
|---|---|---|
| 0.0 | 180 | 350 |
| 0.2 | ~300 | ~265 |
| 0.3 | ~360 | ~225 |
| 0.4 | ~420 | ~190 |
| 0.5 | ~470 | ~155 |

To place a **high blocking wall** in the plane's path: `gridX=360, gridY=200` (covers `360–440 × 200–240`). Plane body intersects this rectangle around `x=360–400`, `y=200–215`. Click at canvas `(430, 240)` snaps cleanly there. See `paper-toss-paper-blocker.webm` / saved journey `Paper_solo_Toss_Paper___high-wall_blocker_demo_…`.

## Logged-in flows

The full-tour journey (`Paper_full_tour___signup_with_invite_code…`) signs up a fresh user via invite code. To replay, reset the DB:
```sh
sqlite3 server/paper.db "DELETE FROM users WHERE email='journey-tour@test.com';
                         DELETE FROM waitlist WHERE email='journey-tour@test.com';
                         UPDATE invite_codes SET used_by=NULL, used_at=NULL
                         WHERE code='48CE25F2';"
```

## Gotchas

1. **Phaser text isn't DOM** — `wait_for_selector "text=Drag the plane to throw"` always times out (10s wasted). Wait on `canvas` + a 1.5s `delay` instead.
2. **MCP video URL is auth-gated** — `http://127.0.0.1:3005/...` returns 401. Copy the `.webm` into the project and `open` it.
3. **Backend doesn't hot-reload** — `npm run server` must be restarted after editing `server/index.ts`. Frontend (Vite) does reload.
4. **`npm run dev:all` is broken** — `concurrently` isn't installed; run `npm run dev` and `npm run server` as two background processes.
5. **Drag direction is inverted** — pull *away from* the launch direction. Down-left pull = up-right throw.
6. **`text=Toss Paper` on `/`** is unique (homepage has Toss Paper / Origami Trail / Paper Crew / Paper League). Safe to click without `nth=0`.

## Running and saving journeys

```jsonc
// Run + record
{
  "action": "run_steps",
  "projectname": "paper",
  "start_url": "http://localhost:5173/",
  "record_video": true,
  "slow_mo_ms": 100,
  "playwright_steps": [ ... ]
}

// Save the definition (no run)
{
  "action": "save_steps",
  "projectname": "paper",
  "description": "...",
  "start_url": "...",
  "playwright_steps": [ ... ]
}

// List existing
{ "action": "list_steps", "projectname": "paper" }
```

Reading the timeline: durations near **30000ms or 10000ms** with `"Error: ... Timeout ... exceeded"` in `result_text` are Playwright timeouts (`click` defaults to 30s, `wait_for_selector` to 10s). Fast steps (<200ms) succeeded.

## Reference journeys

- `Paper_solo_Toss_Paper___high-wall_blocker_demo_…` — shows obstacle-blocks-plane (this guide's worked example).
- `Paper_solo_Toss_Paper_tour___30s_…` — two throws + two obstacle placements, no blocking.
- `Paper_full_tour___signup_with_invite_code_…` — auth + crew creation + Toss Paper launch.
