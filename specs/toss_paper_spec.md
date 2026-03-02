# Toss Paper - Game Spec

## Overview

Paper airplane throwing competition. Players take turns throwing planes and placing obstacles for the next player. Mobile-first design — played in portrait orientation with touch controls.

---

## Mobile-First Design

### Viewport
- **Orientation**: Portrait (9:16 aspect ratio)
- **Target resolution**: 375x667 (iPhone SE baseline), scales up
- **Phaser scale mode**: `FIT` with `CENTER_BOTH`
- **Touch area**: Bottom 40% of screen is the launch zone

### Layout (Portrait, top to bottom)
```
┌─────────────────────┐
│  Score / Wind / Turn │  ← HUD bar (48px)
├─────────────────────┤
│                     │
│    Flight Path      │  ← Sky area (scrolls with throw)
│    & Obstacles      │
│                     │
│                     │
├─────────────────────┤
│                     │
│   Launch Zone       │  ← Touch interaction area
│   (drag & release)  │
│                     │
│    ✈ [plane here]   │
└─────────────────────┘
```

### Touch Controls
- **Drag back**: Pull the plane backward to set power (like a slingshot)
- **Angle**: Drag direction sets the launch angle
- **Release**: Launches the plane
- **Visual feedback**: Dotted trajectory preview line while dragging
- **Power meter**: Arc gauge fills as drag distance increases

---

## Game Flow

### 1. Pre-Throw
- Player sees the field with all existing obstacles
- Wind indicator shows current direction and strength
- Camera is zoomed in on the launch zone

### 2. Throw Phase
- Player drags and releases to throw
- Camera follows the plane as it flies
- Physics simulation: gravity arc, wind drift, obstacle collisions
- Plane tumbles and lands — distance is marked

### 3. Obstacle Placement Phase
- After the throw, camera pulls back to show the full field
- Player taps to place ONE obstacle anywhere on the field
- Obstacle snaps to a grid for fairness
- Confirmation tap to lock placement
- Obstacle types rotate each turn (or player picks from 2 options)

### 4. Turn Complete
- Score is calculated and displayed
- Turn data is saved (throw trajectory + obstacle placement)
- Next player is notified (push notification or in-app)

---

## Scoring

| Action                        | Points        |
|-------------------------------|---------------|
| Base distance                 | 1 pt per unit |
| Close call (near obstacle)    | +50 bonus     |
| Thread the needle (gap pass)  | +100 bonus    |
| Perfect landing (flat)        | +25 bonus     |
| Longest throw in crew         | +200 bonus    |

### Multipliers
- **Combo**: If your throw beats the previous player's distance, 1.5x multiplier
- **Headwind bonus**: Throwing into the wind grants 1.2x multiplier

---

## Physics

### Airplane
- Initial velocity from drag power (max cap to prevent infinite throws)
- Gravity: constant downward force
- Wind: horizontal force applied each frame (varies per throw)
- Drag coefficient: plane slows over time (air resistance)
- Rotation: plane tilts based on velocity angle (nose follows arc)

### Collisions
- **Paper walls**: Full stop, plane crumples
- **Paper fans**: Gust pushes plane sideways, may help or hurt
- **Crumpled paper balls**: Bouncy deflection, random angle

### Wind System
- Random wind per throw: -3 to +3 strength
- Direction shown as arrow + particles drifting across screen
- Wind changes slightly mid-flight (gusts)

---

## Obstacle Types

| Obstacle       | Visual               | Effect                    | Size     |
|----------------|----------------------|---------------------------|----------|
| Paper Wall     | Folded paper barrier | Blocks path completely    | 2x1 grid |
| Paper Fan      | Spinning fan          | Wind gust zone (±2 force)| 1x2 grid |
| Crumpled Ball  | Wadded paper          | Bouncy deflection         | 1x1 grid |

- Max obstacles on field: 20 (oldest removed if exceeded)
- Obstacle grid: 10 columns x 20 rows covering the flight path

---

## Origami Integration

- Players scan or upload their paper airplane photo
- Background is removed, plane becomes the throw sprite
- Custom planes are cosmetic only (no gameplay advantage)
- Default planes provided for players without scanned origami

---

## Async Multiplayer

### Turn Structure
- Paper Crew room holds 2-8 players
- Turn order is set when the room is created
- Each player gets a push/notification when it's their turn
- 24-hour turn timer (auto-forfeit if expired, configurable)

### Data Per Turn
```json
{
  "player_id": 1,
  "throw": {
    "power": 0.85,
    "angle": 72,
    "wind": { "strength": 1.5, "direction": "left" },
    "distance": 342,
    "score": 467
  },
  "obstacle": {
    "type": "paper_wall",
    "grid_x": 4,
    "grid_y": 12
  },
  "timestamp": "2026-03-01T12:00:00Z"
}
```

### Replays
- Before throwing, player can watch the previous player's throw as a replay
- Replay shows trajectory, obstacle placement, and score
- Builds anticipation and competitive tension

---

## HUD Elements (Mobile)

| Element          | Position       | Description                        |
|------------------|----------------|------------------------------------|
| Score            | Top-left       | Current player's total score       |
| Wind indicator   | Top-center     | Arrow + strength number            |
| Turn counter     | Top-right      | "Turn 3 of 8" or "Your throw"     |
| Power gauge      | Bottom-left    | Arc meter, visible during drag     |
| Angle readout    | Bottom-right   | Degrees, visible during drag       |

---

## Screens

### 1. Game Lobby (in Paper Crew)
- List of players in the room
- Current standings / leaderboard
- "Your Turn" button or "Waiting for [player]..." status

### 2. Pre-Throw View
- Field with obstacles visible
- "Watch Replay" button (previous throw)
- Wind indicator
- Tap anywhere to start dragging

### 3. Flight View
- Camera follows plane
- Distance counter ticking up
- Slow-mo on near misses (dramatic effect)

### 4. Obstacle Placement
- Top-down or angled view of the field
- Drag obstacle to position
- "Confirm" button

### 5. Results
- Distance + score breakdown
- Comparison to other players
- "Share" button (screenshot of throw)

---

## Technical Notes

### Phaser Scenes
- `TossPaperScene` — main game scene
- `TossPaperHUD` — overlay scene for UI elements
- `TossPaperResults` — post-throw results overlay

### Key Phaser Features
- `Phaser.Physics.Arcade` for flight simulation
- `Phaser.Cameras.Scene2D` for camera follow and zoom
- `Phaser.Input.Pointer` for drag-to-throw gesture
- `Phaser.GameObjects.Particles` for wind visualization
- `Phaser.Tweens` for slow-mo effect on near misses

### API Endpoints
- `POST /api/games/toss-paper/throw` — submit a throw
- `GET /api/games/toss-paper/field/:crew_id` — get current obstacles
- `GET /api/games/toss-paper/replay/:crew_id/:turn` — get replay data
- `POST /api/games/toss-paper/obstacle` — place an obstacle

### Mobile Considerations
- No pinch-to-zoom (disabled)
- Haptic feedback on throw release (navigator.vibrate)
- Large touch targets (min 44px)
- Prevent pull-to-refresh during gameplay
- Preload assets during lobby screen
