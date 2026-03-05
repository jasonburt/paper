# Placeable Objects - Spec

## Overview

After completing a turn, players pick an object to place in the game world for the next player. Objects are selected from a searchable catalog of pixel art items, themed per game. Each game has its own set of objects — wagons, boulders, and campfires for Origami Trail; fans, tape rolls, and sticky notes for Toss Paper.

---

## Experience Flow

### 1. Turn Completes → Object Picker Opens

After the player finishes their action (throw in Toss Paper, shooting round in Origami Trail), a bottom sheet slides up showing the object picker.

```
┌─────────────────────────────┐
│                             │
│   Game world visible above  │
│                             │
├─────────────────────────────┤
│  Place something for        │
│  the next player            │
│                             │
│  🔍 [ Search objects...   ] │
│                             │
│  ┌─────┐ ┌─────┐ ┌─────┐  │
│  │     │ │     │ │     │  │
│  │ Fan │ │Wall │ │Tape │  │
│  └─────┘ └─────┘ └─────┘  │
│  ┌─────┐ ┌─────┐ ┌─────┐  │
│  │     │ │     │ │     │  │
│  │Note │ │Book │ │ Cup │  │
│  └─────┘ └─────┘ └─────┘  │
│                             │
│         [ Skip ]            │
└─────────────────────────────┘
```

### 2. Search & Browse

- Text input filters the catalog in real time
- Items are shown as pixel art thumbnails in a grid (3 columns)
- Available items show their sprite + name
- Unavailable items show a grayed-out silhouette + "Coming Soon" label
- Categories can be browsed by scrolling (no separate category tabs for MVP)

### 3. Select & Place

- Tap an available item → bottom sheet collapses
- Selected object follows the player's finger/cursor on the game field
- Tap to place, drag to reposition
- Confirm button locks placement
- Object snaps to grid (same grid system Toss Paper already uses)

### 4. Placed Object Appears for Next Player

- Object is saved with position data
- Next player sees it rendered in the game world
- Object has gameplay effect based on its type (blocking, environmental, cosmetic)

---

## Search

### Input
- DOM input overlay positioned over the Phaser canvas (same pattern as Paper Crew text inputs)
- Placeholder text: "Search objects..."
- Filters as the user types (client-side, no API call — catalog is small enough to ship entirely)
- Case-insensitive, matches name and tags (e.g. searching "wind" finds "Fan" because it has a "wind" tag)

### Results
- Available items appear first, sorted alphabetically
- "Coming Soon" items appear after, also sorted alphabetically
- Empty state: "No objects found" if nothing matches
- Clear button (X) resets the search and shows the full catalog

---

## Object Catalog

Each game has its own catalog. Objects have a gameplay effect category:

- **Blocker** — physically blocks movement/projectiles
- **Environmental** — applies a force or effect in a zone
- **Cosmetic** — no gameplay effect, just visual flavor

### Toss Paper Objects

| Object | Effect | Status | Tags |
|--------|--------|--------|------|
| Paper Wall | Blocker — stops plane on contact | Available | wall, barrier, block |
| Paper Fan | Environmental — creates wind gust zone | Available | fan, wind, gust, blow |
| Crumpled Ball | Environmental — bouncy deflection | Available | ball, crumple, bounce |
| Sticky Note | Blocker — plane sticks and stops | Available | sticky, note, trap |
| Tape Roll | Blocker — narrow tall barrier | Available | tape, roll, barrier |
| Paper Cup | Environmental — plane bounces out at random angle | Available | cup, bounce, deflect |
| Origami Crane | Cosmetic — sits in the field, no effect | Available | crane, bird, origami |
| Pencil | Blocker — thin diagonal barrier | Coming Soon | pencil, diagonal, block |
| Eraser | Environmental — removes one nearby obstacle on place | Coming Soon | eraser, remove, clear |
| Stapler | Blocker — wide low barrier | Coming Soon | stapler, block, wide |
| Paper Clip | Environmental — redirects plane along a curve | Coming Soon | clip, redirect, curve |
| Rubber Band | Environmental — slingshots plane in a new direction | Coming Soon | band, sling, launch |
| Glue Stick | Environmental — slow zone, reduces plane speed | Coming Soon | glue, slow, sticky |
| Bookmark | Blocker — tall narrow barrier | Coming Soon | bookmark, tall, block |
| Protractor | Environmental — ramp, deflects plane upward | Coming Soon | protractor, ramp, angle |

### Origami Trail Objects

| Object | Effect | Status | Tags |
|--------|--------|--------|------|
| Boulder | Blocker — creatures hide behind it | Available | rock, boulder, stone, hide |
| Paper Tree | Blocker — blocks shots, creatures pass behind | Available | tree, forest, block |
| Wagon | Blocker — wide obstacle creatures run behind | Available | wagon, cart, vehicle |
| Campfire | Environmental — creatures speed up running past | Available | fire, camp, campfire, speed |
| Tall Grass | Environmental — creatures become semi-transparent inside | Available | grass, hide, stealth |
| Fence | Blocker — creatures jump over, brief moment to shoot | Available | fence, jump, barrier |
| Log | Blocker — low obstacle, runners duck behind it | Coming Soon | log, low, duck |
| River | Environmental — creatures slow down crossing | Coming Soon | river, water, slow |
| Bridge | Cosmetic — creatures walk across, visual only | Coming Soon | bridge, cross, path |
| Tent | Blocker — large cover, creatures fully hidden inside | Coming Soon | tent, cover, hide |
| Scarecrow | Environmental — creatures avoid the area | Coming Soon | scarecrow, scare, avoid |
| Wind Chime | Environmental — alerts creatures, they speed up nearby | Coming Soon | chime, wind, alert, speed |
| Hay Bale | Blocker — round, creatures roll behind | Coming Soon | hay, bale, round |
| Mushroom | Cosmetic — no effect, visual flavor | Coming Soon | mushroom, shroom, decor |
| Barrel | Blocker — medium cover | Coming Soon | barrel, container, block |

---

## Data Model

### Object Definition (shipped with the client)

```typescript
interface PlaceableObject {
  id: string;             // "paper_fan", "wagon", etc.
  name: string;           // Display name
  game: string;           // "toss-paper" | "origami-trail"
  effect: "blocker" | "environmental" | "cosmetic";
  description: string;    // Short description of what it does
  tags: string[];         // Searchable tags
  status: "available" | "coming_soon";
  spriteKey: string;      // Phaser texture key
  gridWidth: number;      // Grid cells wide (1-3)
  gridHeight: number;     // Grid cells tall (1-3)
}
```

### Placed Object (saved per turn)

```typescript
interface PlacedObject {
  object_id: string;      // References PlaceableObject.id
  grid_x: number;
  grid_y: number;
  placed_by: number;      // user_id
}
```

### Turn Data Update

Extends existing turn data structures. For Toss Paper:

```json
{
  "player_id": 1,
  "throw": { "...": "..." },
  "placed_object": {
    "object_id": "paper_fan",
    "grid_x": 4,
    "grid_y": 12
  }
}
```

This replaces the current `obstacle` field with the more flexible `placed_object` field.

---

## Pixel Art Assets

All objects are 16x16 or 32x32 pixel art sprites with a paper/origami aesthetic:

- Limited palette (8-12 colors per sprite matching the paper look)
- 1px black outline
- Slightly crumpled/folded texture to match the paper theme
- Each object needs: idle sprite (required), placement preview sprite with transparency (required)

### Asset File Structure

```
assets/
  objects/
    toss-paper/
      paper_wall.png
      paper_fan.png
      crumpled_ball.png
      sticky_note.png
      tape_roll.png
      paper_cup.png
      origami_crane.png
    origami-trail/
      boulder.png
      paper_tree.png
      wagon.png
      campfire.png
      tall_grass.png
      fence.png
    coming_soon_placeholder.png   ← generic silhouette used for all "Coming Soon" items
```

---

## Items to Build

### Frontend
1. **Object Catalog Registry** — static TypeScript file exporting the full catalog per game, typed with `PlaceableObject[]`
2. **Object Picker UI** — bottom sheet Phaser scene overlay with search input (DOM) and sprite grid
3. **Search/Filter Logic** — client-side filter function matching query against name + tags
4. **Placement Mode** — object follows cursor/finger, snap-to-grid, confirm/cancel controls
5. **"Coming Soon" Treatment** — grayed-out rendering with label overlay for unavailable items

### Assets
6. **Toss Paper Sprites** — pixel art for the 7 available Toss Paper objects
7. **Origami Trail Sprites** — pixel art for the 6 available Origami Trail objects
8. **Coming Soon Placeholder** — single generic silhouette sprite
9. **Placement Preview Sprites** — semi-transparent versions for drag-to-place state

### Backend
10. **Update Turn Data Schema** — replace `obstacle` with `placed_object` in Toss Paper turn submissions
11. **Object Validation** — server rejects placements of "coming_soon" objects or invalid IDs

### Integration
12. **Toss Paper Integration** — swap current obstacle placement flow for the new object picker
13. **Origami Trail Integration** — add object placement phase after shooting round ends
14. **Object Rendering** — render placed objects in the game world with correct physics/behavior per effect type

---

## Constraints

- Max 1 object placed per turn (same as current obstacle limit)
- Max 20 objects on field at once (oldest removed if exceeded, same as current)
- "Coming Soon" items are visible but not selectable — tapping shows a toast: "Coming soon!"
- Object catalog ships with the client — no API call to fetch the list
- Skip button lets players opt out of placing anything
- Objects placed by the current player cannot overlap existing objects
