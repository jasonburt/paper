# Paper League — Feature Spec
*Version 1.0 — March 2026*

---

## Overview

Paper League is a weekly competitive layer built on top of Paper's existing game modes (Toss Paper, Origami Trail). Crews compete head-to-head each week in a structured league format inspired by LearnedLeague — with promotion/relegation tiers, a defense mechanic, and rotating weekly game tweaks.

---

## Core Loop

```
Thursday reset → Matchups generated → Crews play all week →
Defense picks submitted → Scores tallied → Promotion/relegation → repeat
```

Each week:
1. Crews are matched against a rival Crew in their Tier
2. All Crew members play that week's games and contribute scores
3. Each Crew submits one **Defense Pick** (modifier) before play begins
4. Thursday: scores lock, standings update, new matchups + tweaks go live

---

## Weekly Schedule

| Day | Event |
|---|---|
| Thursday (reset) | New matchups generated, game tweaks go live, Defense Picks open |
| Thursday–Wednesday | Play window — all members contribute scores |
| Wednesday 11pm | Score submission deadline |
| Thursday (early AM) | Results locked, standings update, promotions/relegations applied |

---

## Tiers (Rundles)

Crews are sorted into four tiers based on performance:

| Tier | Name | Notes |
|---|---|---|
| 4 | **Scrap** | Entry level, all new Crews start here |
| 3 | **Fold** | Mid tier |
| 2 | **Press** | Upper mid |
| 1 | **Paper Champion** | Elite — top Crews only |

**Promotion:** Top 2 Crews in each Tier move up at season end
**Relegation:** Bottom 2 Crews drop down
**Weekly advancement:** Weekly match winner faces a higher-tier opponent the following week (cross-tier challenge match)

---

## The Defense Mechanic

Inspired by LearnedLeague's point-assignment defense. Before the week begins, each Crew submits one **Defense Pick** — a game modifier that applies to their opponent's score calculation.

### Defense Pick Options (examples)
- **Obstacle Overload** — opponent's score is calculated with obstacle difficulty doubled
- **Speed Run** — only Toss Paper scores count; Origami Trail ignored this week
- **Combo Lock** — opponent must hit 3+ combo chains or their score is halved
- **No Retry** — opponent's first attempt per level is the only one that counts
- **Clean Sheet** — opponent loses 10% of score for each miss

### Counter-Pick
After seeing the opponent's Defense Pick, each Crew may submit one **Counter-Pick** — a modifier that applies back to the opponent's pick (e.g. reduces its severity by 50%, or redirects it to only affect one game mode).

**Strategy:** Crews research opponent strengths/weaknesses via public stats (per-mode averages, streak data) before picking — mirroring LL's defensive research dynamic.

---

## Scoring

**Weekly match score = (Aggregate Crew member scores) × Defense modifier**

- All Crew members who play during the week contribute their top single-session score per game mode
- Minimum participation: at least 50% of Crew members must play for the score to count (prevents ghost Crews)
- Match result: Win (2pts), Draw (1pt), Loss (0pts) — points accumulate across the season

---

## Season Structure

- **Season length:** 4 weeks
- **End-of-season:** Crew Championship — top Crew from each Tier competes in a single-session playoff
- **Championship format:** One live play window (Friday evening), 90 minutes, all game modes active, no Defense Picks

---

## Weekly Game Tweaks

Every Thursday, 1–2 rule/mode tweaks go live league-wide. These keep the meta fresh and reward adaptable Crews.

### Examples
- Week 1: Standard rules
- Week 2: Origami Trail — enemy wave speed +20%
- Week 3: Toss Paper — wind physics enabled
- Week 4: Both modes — scoring multiplier for rare origami characters

Tweaks are announced Thursday AM so both Crews can adapt. They apply equally to both sides.

---

## Origami Scanner Integration

The **Origami Scanner** (upcoming feature) plugs directly into Paper League:
- Scan a new origami character → unlock them as a **Crew mascot** or **playable skin** for that week
- Rare characters (complex folds, unusual animals) grant a small score multiplier
- Encourages players to keep scanning and building the character roster

---

## Stats & Crew Profile

Each Crew has a public profile showing:
- Current Tier + win/loss record
- Season history (tier progression)
- Top contributing members (weekly + all-time)
- Best weekly score
- Defense Pick history (visible after match resolves)

Individual players see:
- Personal contribution to each week's Crew score
- Per-mode averages (used by opponents for Defense research)
- Streak and participation data

---

## Notifications

- **Thursday AM:** New matchup revealed + opponent Defense Pick visible
- **Wednesday PM:** Reminder to play before deadline
- **Thursday early AM:** Results + standings update

---

## Open Questions / TBD

- [ ] How many members minimum to form a Crew eligible for league play?
- [ ] How are Crew scores normalized if Crews have different member counts?
- [ ] Is Defense Pick selection open to whole Crew (vote) or just Crew leader?
- [ ] Should cross-tier challenge matches affect tier placement immediately or only at season end?
- [ ] How do we handle Crews that go inactive mid-season?

---

## Implementation Phases

### Phase 1 — Weekly Reset Infrastructure
- Thursday cron job: reset scores, generate matchups, apply tweaks
- Crew match record tracking (W/L/D + points)

### Phase 2 — Defense Picks
- Pick submission UI
- Modifier calculation engine
- Counter-pick flow

### Phase 3 — Tiers + Promotion/Relegation
- Tier assignment logic
- End-of-season promotion/relegation processing
- Crew tier history

### Phase 4 — Season Championship
- Championship bracket generation
- Live play window with real-time leaderboard
- Champion badge / trophy system

### Phase 5 — Scanner Integration
- Origami Scanner unlock → mascot/skin pipeline
- Rare character multiplier system
