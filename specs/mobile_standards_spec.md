# Mobile Standards Spec

## Overview

Mobile-first standards for all Paper games. Applies when the rendered canvas width is below 550px (roughly any phone in portrait). The game's internal resolution stays at 800x600 but all UI elements scale up so they remain legible and tappable after the canvas is shrunk to fit the phone screen.

---

## Viewport & Layout

- **Header**: Hidden during gameplay — the full screen is given to the Phaser canvas
- **Container**: No `max-width` constraint during gameplay — canvas fills the entire viewport width
- **Body**: `overscroll-behavior: none` and `overflow: hidden` to prevent pull-to-refresh and rubber-banding
- **Viewport meta**: `width=device-width, initial-scale=1.0, viewport-fit=cover` (safe area support)
- **Phaser scale mode**: `FIT` with `CENTER_BOTH` — preserves 4:3 aspect ratio, centers in available space

---

## Detection

Mobile is detected at scene creation via `src/utils/responsive.ts`:

- Measures the canvas element's rendered width from `getBoundingClientRect()`
- If rendered width < 550px → mobile mode
- Computes a `uiScale` multiplier (typically 1.8–2.2x) to compensate for canvas shrinkage
- All font sizes, padding, and touch targets are multiplied by this scale

---

## Font Sizes (game coordinates)

All sizes are in Phaser game-coordinate pixels. On a phone with ~0.47x canvas scale, these render at approximately the real-pixel sizes shown.

| Element | Game-coord size | Real px (375px phone) |
|---------|----------------|----------------------|
| HUD text (score, wind) | 32–36px | ~15–17px |
| HUD small (throw counter) | 25–28px | ~12–13px |
| Body text (hints, labels) | 28–32px | ~13–15px |
| Small labels (item names) | 22–24px | ~10–11px |
| Buttons (back, skip) | 32–36px | ~15–17px |
| Title text | 28–32px | ~13–15px |

---

## Touch Targets

- **Minimum tap target**: 44px real pixels (approximately `44 * uiScale` in game coordinates, typically ~80-90px)
- **Back button**: Enlarged font + expanded hit area (extra 10px padding on all sides)
- **Object picker grid items**: Each cell is `width / 3` wide, 100px tall in game coords — gives generous tap targets
- **Skip button**: Uses button font size (32–36px game coords)

---

## Object Picker (Mobile)

- **Panel position**: Starts at 20% from top (vs 35% on desktop) — more room for items
- **Grid columns**: 3 (vs 4 on desktop)
- **Cell size**: Full-width divided by 3, 100px tall
- **Thumbnail size**: 52px (vs 40px on desktop)
- **Search input**: Nearly full width with larger font
- **Item labels**: 22–24px game coords

---

## Scrolling & Gestures

- Page-level scroll is disabled during gameplay (`overscroll-behavior: none`)
- No pinch-to-zoom on the game canvas
- Drag-to-throw gesture works via Phaser pointer events
- All interactive zones capture touch events to prevent pass-through

---

## Non-Game Pages

Menu, Paper Crew, and other Vue pages retain the standard header and `max-w-4xl` container. These pages already use responsive Tailwind classes (`text-sm md:text-lg`, `px-3 md:px-4`).
