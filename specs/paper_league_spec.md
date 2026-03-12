# Paper League — Feature Spec
*Version 2.0 — March 2026*

---

## Overview

Paper League is a weekly competitive layer built on top of Paper's existing game modes (Toss Paper, Origami Trail). Crews compete head-to-head each week in a structured league format inspired by LearnedLeague and fantasy football — with promotion/relegation tiers, a defense mechanic, roster strategy, capped attempts, and anti-cheat systems.

---

## Core Loop

```
Thursday reset → Set lineup + Defense Pick → Play (5 attempts per mode) →
Mid-week check-in → Scores lock → Results + promotion/relegation → repeat
```

Each week:
1. Crews are matched against a rival Crew in their Tier
2. Crew leader sets the **active roster** (which members count toward the match)
3. Each Crew submits one **Defense Pick** (modifier applied to opponent)
4. Members play their games (capped attempts) throughout the week
5. Thursday: scores lock, standings update, new matchups + tweaks go live

---

## Weekly Schedule

| Day | Event |
|---|---|
| Thursday (reset) | New matchups generated, game tweaks go live |
| Thursday | Crew leaders set active roster + Defense Picks |
| Thursday–Wednesday | Play window — active roster members play their capped attempts |
| Mid-week | Live matchup score visible — decide whether to use remaining attempts |
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
**Anti-sandbagging:** Automatic promotion after 2 consecutive dominant wins (>150% of opponent score)
**Weekly advancement:** Weekly match winner faces a higher-tier opponent the following week (cross-tier challenge match)

---

## Scoring System

### Attempt Caps

Each player gets **5 scoring attempts per game mode per week**. This is the core mechanic that makes Paper League feel like fantasy football — every attempt matters, you can't just grind.

- 5 attempts × Toss Paper + 5 attempts × Origami Trail = 10 total plays per week
- Your **best 3 of 5** attempts per mode count toward your contribution
- Unused attempts expire at deadline — no rollover

### Percentile-Based Scoring

Raw scores are converted to **percentile points** based on the global weekly distribution of all league players. This normalizes across game modes and skill levels.

| Your performance | Percentile points |
|---|---|
| Top 5% of all players that week | 95–100 pts |
| Top 25% | 75–94 pts |
| Median | 50 pts |
| Bottom 25% | 1–25 pts |

**Why percentile?** A 500pt Toss Paper score and a 200pt Origami Trail score can both be "top 10%." This prevents mode inflation and makes boosting with alt accounts pointless — your alt's score is measured against everyone else.

### Crew Match Score

```
Crew Score = Sum of (active roster members' percentile scores) × Defense modifier
```

- Only **active roster** members count (see Roster Strategy below)
- Each member's contribution = average of their best-3 percentile scores across both modes
- Minimum participation: at least 3 active roster members must play for the score to count

### Match Results

- **Win:** 2 season points
- **Draw:** 1 season point
- **Loss:** 0 season points

---

## Roster Strategy

Each week, the crew leader selects **3–5 members** as the active roster for the match. This is the "setting your fantasy lineup" moment.

- **Active roster** — these members' scores count toward the crew match score
- **Bench** — other crew members can still play for personal stats, streaks, and practice, but don't affect the match
- Roster locks after Thursday's reset (no changes mid-week)
- If a rostered player doesn't play, their contribution is 0 — choosing the right lineup matters

This creates crew-internal competition: members want to prove they deserve a roster spot.

---

## Individual Incentives

These mechanics keep players motivated beyond just the crew match:

### Personal Best Tracking
- Track your PB per mode; beating your PB during a league week earns a **1.1x bonus multiplier** on that score for the crew

### Contribution Rank
- Show each member's % contribution to crew score
- Weekly **MVP badge** for top contributor

### Streak Bonus
- Consecutive weeks of participation adds a small multiplier to your percentile score:
  - 2 weeks: 1.05x
  - 3 weeks: 1.10x
  - 4+ weeks: 1.15x (cap)
- Missing a week resets your streak

### Improvement Score
- Bonus points for improving over your own rolling 4-week average
- Rewards getting better, not just being good — keeps lower-skill players engaged

---

## The Defense Mechanic

Inspired by LearnedLeague's point-assignment defense. Before the week begins, each Crew submits one **Defense Pick** — a game modifier that applies to their opponent's score calculation.

### Defense Pick Options
- **Obstacle Overload** — opponent's score is calculated with obstacle difficulty doubled
- **Speed Run** — only Toss Paper scores count; Origami Trail ignored this week
- **Combo Lock** — opponent must hit 3+ combo chains or their Origami Trail score is halved
- **No Retry** — opponent's first attempt per mode is the only one that counts (reduces their 5 attempts to 1)
- **Clean Sheet** — opponent loses 10% of score for each miss in Origami Trail

### Counter-Pick
After seeing the opponent's Defense Pick, each Crew may submit one **Counter-Pick** — a modifier that applies back to the opponent's pick (e.g. reduces its severity by 50%, or redirects it to only affect one game mode).

### Research Dynamic
Crews research opponent strengths/weaknesses via **public stats** (per-mode averages, streak data, roster history) before picking — mirroring LearnedLeague's defensive research.

---

## Anti-Cheat & Fair Play

### Account Integrity

| Threat | Mitigation |
|---|---|
| Alt accounts boosting crew score | Email verification required; accounts must be 2+ weeks old with 2+ weeks of play history before league eligibility |
| Grinding infinite attempts | Hard cap of 5 attempts per mode per week; only best 3 count |
| Score manipulation via API | Server-side score validation — reject impossible scores (e.g. Toss Paper distance > theoretical max for physics engine) |
| Sandbagging to stay in low tier | Auto-promotion after 2 consecutive dominant wins (>150% of opponent); percentile uses rolling 4-week average, not single-week |
| Ghost/dummy opponent crews | Matchmaking only pairs crews with 3+ league-eligible, active members |
| Crew creating fake rival crews | League eligibility requires 3+ unique members with independent play history |
| Win trading between friendly crews | Matchups are system-generated, not chosen; crews cannot request opponents |

### Score Validation Rules
- **Toss Paper:** Max distance capped at physics-engine theoretical max per wind condition; scores exceeding cap are flagged and excluded
- **Origami Trail:** Max score per wave capped at (creatures × max combo multiplier); impossible scores rejected
- **Timing:** Scores must be submitted from an active game session; API-only score posts without matching session data are rejected
- **Rate limiting:** Max 5 score submissions per mode per week per player; extras are silently dropped

### Percentile as Anti-Cheat
The percentile system is inherently cheat-resistant:
- Inflating your raw score doesn't help if everyone else also improves
- Alt accounts dilute the pool but don't raise a player's percentile
- A single outlier score gets the same "top 1%" as a legitimate great score — no infinite upside from hacking

---

## Season Structure

- **Season length:** 4 weeks
- **End-of-season:** Crew Championship — top Crew from each Tier competes in a single-session playoff
- **Championship format:** One live play window (Friday evening), 90 minutes, all game modes active, no Defense Picks
- **Between seasons:** 1 week break for tier reshuffling and roster changes

---

## Weekly Game Tweaks

Every Thursday, 1–2 rule/mode tweaks go live league-wide. These keep the meta fresh and reward adaptable Crews.

### Examples
- Week 1: Standard rules
- Week 2: Origami Trail — enemy wave speed +20%
- Week 3: Toss Paper — headwind bonus doubled
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
- Active roster for the current week
- Top contributing members (weekly + all-time)
- Best weekly score
- Defense Pick history (visible after match resolves)

Individual players see:
- Personal contribution to each week's Crew score
- Contribution rank within their Crew
- Per-mode averages and percentile history (used by opponents for Defense research)
- Streak data and personal bests
- Improvement trend (are you getting better week over week?)

---

## Notifications

- **Thursday AM:** New matchup revealed, roster selection opens
- **Thursday PM:** Defense Pick deadline reminder
- **Mid-week:** Matchup score update ("You're ahead by 12 pts — 2 attempts remaining")
- **Wednesday PM:** Reminder to play before deadline
- **Thursday early AM:** Results + standings update

---

## Resolved Design Decisions

- **Minimum crew size for league:** 3 members (all must be league-eligible)
- **Score normalization across crew sizes:** Percentile-based scoring inherently normalizes — a 3-person crew and a 6-person crew both contribute percentile averages from their active roster
- **Defense Pick selection:** Crew leader decides (not a vote) — keeps it fast and strategic
- **Cross-tier challenge matches:** Affect the following week's matchup only, not tier placement (tiers only change at season end)
- **Inactive crews mid-season:** If a crew fails to meet minimum participation (3 active players) for 2 consecutive weeks, they forfeit remaining matches and are auto-relegated

---

## Implementation Phases

### Phase 1 — Attempt Caps & Weekly Reset
- Attempt tracking per player per mode per week (5 cap, best 3 count)
- Thursday cron job: reset attempts, generate matchups, apply tweaks
- Crew match record tracking (W/L/D + points)
- League eligibility checks (account age, play history)

### Phase 2 — Percentile Scoring & Roster
- Global percentile calculation engine (runs at score lock)
- Rolling 4-week average for baseline
- Active roster selection UI for crew leaders
- Roster lock mechanics

### Phase 3 — Defense Picks
- Pick submission UI with opponent stats preview
- Modifier calculation engine
- Counter-pick flow
- Defense Pick history (revealed post-match)

### Phase 4 — Tiers + Promotion/Relegation
- Tier assignment logic
- End-of-season promotion/relegation processing
- Anti-sandbagging auto-promotion
- Crew tier history

### Phase 5 — Individual Incentives
- Personal best tracking + PB bonus multiplier
- Contribution rank + MVP badge
- Streak tracking + streak bonus
- Improvement score calculation

### Phase 6 — Season Championship
- Championship bracket generation
- Live play window with real-time leaderboard
- Champion badge / trophy system

### Phase 7 — Scanner Integration
- Origami Scanner unlock → mascot/skin pipeline
- Rare character multiplier system
