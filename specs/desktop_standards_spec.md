# Desktop Standards Spec

## Overview

Desktop is the default layout for all Paper games. Applies when the rendered canvas width is 550px or wider. The game runs at its native 800x600 internal resolution and UI elements use their base sizes without any scaling multiplier.

---

## Viewport & Layout

- **Header**: Visible on all pages including during gameplay
- **Container**: `max-w-4xl` centers content on wide screens (except during gameplay, where the canvas fills available width)
- **Phaser scale mode**: `FIT` with `CENTER_BOTH` — preserves 4:3 aspect ratio, centers in available space
- **Internal resolution**: 800x600 — all game-coordinate values map 1:1 at this resolution

---

## Detection

Desktop is the default path in `src/utils/responsive.ts`:

- If no canvas is found, desktop defaults are returned
- If the canvas rendered width is >= 550px, desktop defaults are used
- `uiScale` is `1.0` — no size compensation needed

---

## Font Sizes (game coordinates)

All sizes are in Phaser game-coordinate pixels. On desktop these closely match real rendered pixels.

| Element | Game-coord size |
|---------|----------------|
| HUD text (score, wind) | 18px |
| HUD small (throw counter) | 14px |
| Body text (hints, labels) | 16px |
| Small labels (item names) | 11px |
| Buttons (back, skip) | 14px |
| Title text | 14px |

---

## Touch / Click Targets

- **Minimum click target**: 44px in game coordinates
- **Back button**: Standard font size, no extra padding needed
- **Object picker grid items**: 4 columns, standard cell sizing
- **Skip button**: 14px font

---

## Object Picker (Desktop)

- **Panel position**: Starts at 35% from top
- **Grid columns**: 4
- **Thumbnail size**: 40px
- **Search input**: Standard width with base font
- **Item labels**: 11px game coords

---

## Scrolling & Gestures

- Mouse-based interactions: click-and-drag to throw, click to place obstacles
- Standard browser scrolling behavior on non-game pages
- No special gesture handling needed

---

## Non-Game Pages

Menu, Paper Crew, and other Vue pages use the standard header and `max-w-4xl` container with standard Tailwind responsive classes.
