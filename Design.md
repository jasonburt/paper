# Paper - Design System

## Philosophy

Clean. Like a white piece of paper. The UI should feel like a fresh sheet — minimal, bright, and tactile. Color comes from the origami itself, not the chrome around it.

## Background

- Primary background: `#FFFFFF` (pure white — the paper)
- Secondary background: `#F9F9F9` (slight warmth for cards/panels)
- Game canvas: `#FAFAFA`

## Core Brand Colors

High-energy origami paper colors for the main interface and brand identity.

| Color Name       | Hex       | Usage                                      |
|------------------|-----------|---------------------------------------------|
| Star Yellow      | `#FDE801` | Primary brand color, accents, icons         |
| Petal Orange     | `#FF8F01` | Secondary brand color, hover states         |
| Gift Red-Orange  | `#FF4F36` | CTA buttons, alerts                         |
| Sky Blue         | `#4992FF` | Active links, navigation, secondary buttons |

## Text

| Role        | Color     | Notes                        |
|-------------|-----------|------------------------------|
| Primary     | `#1A1A1A` | Headlines, body text         |
| Secondary   | `#6B6B6B` | Subtitles, captions          |
| On Color    | `#FFFFFF` | Text on colored backgrounds  |

## Typography

- Headings: Georgia, serif (paper/craft feel)
- Body: System sans-serif stack
- Game UI: Monospace or pixel-style (per game)

## Layout Principles

1. **White space is the design** — generous margins, no clutter
2. **Color is earned** — only origami elements and interactive controls use brand colors
3. **Paper texture** — subtle paper grain on game backgrounds, not on UI chrome
4. **Fold lines** — dividers use a light crease aesthetic, not hard borders

## Interactive States

| State    | Treatment                              |
|----------|----------------------------------------|
| Default  | Clean, minimal                         |
| Hover    | Petal Orange (`#FF8F01`) text or border |
| Active   | Gift Red-Orange (`#FF4F36`)            |
| Focus    | Sky Blue (`#4992FF`) ring              |
| Disabled | `#D0D0D0` with 50% opacity            |

## Shadows

Minimal. Use soft paper-like elevation only where needed:
- Cards: `0 1px 3px rgba(0,0,0,0.08)`
- Modals: `0 4px 12px rgba(0,0,0,0.12)`

## Origami Creatures

Scanned origami should stand out against the white background — they ARE the color. The UI frames them, it doesn't compete with them.
