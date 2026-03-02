# Release Notes

## v0.2.0 — Toss Paper MVP (2026-03-01)

### Added
- **Toss Paper mini game** — solo-playable paper airplane throwing game
  - Slingshot drag-to-throw controls with trajectory preview
  - Physics: gravity arc, wind drift, air drag, nose rotation
  - Camera follows the plane during flight
  - Distance-based scoring (1 point per grid unit)
  - Obstacle placement after each throw (cycles: Paper Wall → Crumpled Ball → Paper Fan)
  - Obstacles compound across throws, making each round harder
  - Collision handling: walls stop, balls deflect, fans gust
  - Wind randomized per throw with HUD indicator
  - Back button to return to main menu
- **Design system** applied to game: white paper background, origami brand colors for HUD

### Changed
- Main menu "Toss Paper" now navigates to the game scene

---

## v0.1.0 — Project Setup (2026-03-01)

### Added
- Phaser 3 + Vite + TypeScript frontend scaffold
- Express + SQLite backend scaffold (users, crews, scores API)
- Main menu with Toss Paper, Origami Trail, Paper Crew entries
- Design system (Design.md) with origami color palette
- Game specs: Toss Paper, Origami Trail, Origami Scanner
