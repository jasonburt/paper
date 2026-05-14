# Weekly Highlights — Feature Spec
*Version 1.0 — March 2026*

---

## Overview

Weekly Highlights captures each crew's scores at the end of every week, crowns winners per game, and presents a fun, browsable history of week-over-week champions. After the snapshot, the crew's weekly leaderboard resets so the next week starts fresh.

This is a lightweight precursor to Paper League — no tiers, no rosters, no defense picks. Just: who won this week?

---

## Core Loop

```
Thursday midnight UTC → Cron snapshots all crew scores →
  Winners crowned per game per crew →
  Scores reset for new week →
  Crew members see the Highlights tab with history
```

---

## What Gets Captured

For each crew, for each game (`toss-paper`, `origami-trail`), the weekly snapshot saves:

| Field | Description |
|---|---|
| `crew_id` | Which crew |
| `game` | Game mode |
| `week_start` | Monday 00:00 UTC of the scored week |
| `week_end` | Sunday 23:59 UTC |
| `winner_user_id` | User with the highest score that week |
| `winner_username` | Denormalized for display |
| `winner_score` | Their best score |
| `runner_up_user_id` | Second place (nullable if < 2 players) |
| `runner_up_username` | |
| `runner_up_score` | |
| `total_plays` | Number of score submissions across all members |
| `participant_count` | How many unique members played |
| `scores_json` | Full leaderboard snapshot (top 8, JSON array) |

**Winner determination:** Highest single score in that game for that crew during the week. Ties broken by earliest submission.

---

## Database

### New Table: `weekly_highlights`

```sql
CREATE TABLE IF NOT EXISTS weekly_highlights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crew_id INTEGER REFERENCES crews(id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  week_start TEXT NOT NULL,        -- ISO date: '2026-03-16'
  week_end TEXT NOT NULL,          -- ISO date: '2026-03-22'
  winner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  winner_username TEXT NOT NULL,
  winner_score INTEGER NOT NULL,
  runner_up_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  runner_up_username TEXT,
  runner_up_score INTEGER,
  total_plays INTEGER NOT NULL DEFAULT 0,
  participant_count INTEGER NOT NULL DEFAULT 0,
  scores_json TEXT,                -- JSON array: [{username, score, user_id}]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(crew_id, game, week_start)
);

CREATE INDEX IF NOT EXISTS idx_highlights_crew ON weekly_highlights(crew_id);
CREATE INDEX IF NOT EXISTS idx_highlights_week ON weekly_highlights(week_start);
```

No changes to the existing `scores` table — scores are queried by `created_at` date range for the snapshot, then remain in the table as historical data. The "reset" is purely visual: the crew room leaderboard only shows the current week's scores.

---

## API Endpoints

### `GET /api/crews/:uuid/highlights`

Returns weekly highlight history for a crew, newest first.

**Query params:**
- `limit` — max results (default 12, max 52)
- `game` — filter by game (optional)

**Response:**
```json
[
  {
    "id": 1,
    "game": "toss-paper",
    "week_start": "2026-03-16",
    "week_end": "2026-03-22",
    "winner": {
      "user_id": 5,
      "username": "Sara",
      "score": 892,
      "icon": "crane",
      "color": "#4992FF"
    },
    "runner_up": {
      "user_id": 2,
      "username": "Jason",
      "score": 467
    },
    "total_plays": 23,
    "participant_count": 4,
    "scores": [
      { "username": "Sara", "score": 892 },
      { "username": "Jason", "score": 467 },
      { "username": "Mike", "score": 234 },
      { "username": "Alex", "score": 102 }
    ]
  }
]
```

### `POST /api/admin/highlights/snapshot`

Manually trigger a weekly snapshot (admin-only). Used for testing and catch-up.

**Body:**
```json
{ "week_start": "2026-03-16" }
```

If `week_start` is omitted, snapshots the most recently completed week.

### `GET /api/scores/:game` (modified)

Add a `week` query param to filter scores by week. The crew room leaderboard will pass `week=current` to only show this week's scores.

- `?crew_id=xxx&week=current` — scores from Monday 00:00 UTC to now
- `?crew_id=xxx&week=2026-03-16` — scores from that week
- `?crew_id=xxx` (no week param) — all-time scores (existing behavior, unchanged)

---

## Weekly Snapshot Process

Runs as a cron job every Thursday at 00:05 UTC (or triggered manually via admin endpoint).

### Algorithm

```
1. Calculate week boundaries:
   - week_start = most recent Monday 00:00 UTC
   - week_end = Sunday 23:59 UTC before that

2. For each crew:
   For each game ('toss-paper', 'origami-trail'):
     a. Query: SELECT user_id, username, MAX(score) as best_score
              FROM scores
              WHERE crew_id = ? AND game = ? AND created_at >= week_start AND created_at < next_monday
              GROUP BY user_id
              ORDER BY best_score DESC, MIN(created_at) ASC

     b. If no scores → skip (no highlight for inactive weeks)

     c. Insert into weekly_highlights:
        - winner = row[0]
        - runner_up = row[1] (if exists)
        - total_plays = COUNT(*) of all scores that week
        - participant_count = COUNT(DISTINCT user_id)
        - scores_json = JSON of all rows

3. No scores are deleted — the "reset" is just the crew room filtering to current week
```

### Idempotency

The `UNIQUE(crew_id, game, week_start)` constraint prevents duplicate snapshots. Re-running the cron for the same week is a no-op (INSERT OR IGNORE).

---

## Frontend: Highlights Tab

### Crew Room Changes

Add a tab bar to the crew room:

```
[ Leaderboard ]    [ Highlights ]
```

- **Leaderboard** (default) — shows current week's scores (existing behavior, now filtered to current week)
- **Highlights** — shows the weekly winners history

### Highlights Page Design

The highlights page should feel like a sports trophy case — celebratory and fun to scroll through.

```
┌─────────────────────────────────────┐
│           WEEKLY WINNERS            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Mar 16 – Mar 22            │    │
│  │                              │    │
│  │  TOSS PAPER                  │    │
│  │  ★ Sara ........... 892 pts  │    │
│  │    Jason .......... 467 pts  │    │
│  │    3 others played           │    │
│  │                              │    │
│  │  ORIGAMI TRAIL               │    │
│  │  ★ Mike ........... 340 pts  │    │
│  │    Alex .......... 210 pts   │    │
│  │    2 others played           │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Mar 9 – Mar 15             │    │
│  │  ...                         │    │
│  └─────────────────────────────┘    │
│                                     │
│  No highlights before Mar 9.        │
│                                     │
└─────────────────────────────────────┘
```

### Visual Details

- **Winner row:** Star icon (★) + PlayerIcon avatar + username + score, in the winner's chosen color
- **Runner-up:** Smaller text, no star, muted color
- **"X others played"** link — expands to show full leaderboard for that week
- **Week header:** Date range in friendly format ("Mar 16 – Mar 22")
- **Crown streak:** If a player wins the same game 2+ weeks in a row, show a flame icon (🔥) or "2-week streak" badge next to their name
- **Empty state:** "No highlights yet — play some games this week!" with a call-to-action to play
- **Week cards:** Subtle paper-like background (`bg-[#FAFAFA]`), thin border, slight rounding — consistent with design system

### Stats Summary (top of page)

Above the week cards, show a quick stats bar:

```
┌──────────────────────────────────┐
│  Most Wins          │ Top Score  │
│  ★ Sara (6 weeks)   │ 1,247 pts │
│  Toss Paper         │ by Mike   │
└──────────────────────────────────┘
```

- **Most Wins:** Player with the most weekly wins across all games + which game
- **Top Score:** Highest single score ever recorded in highlights

---

## Crew Room Leaderboard: Weekly Reset

The current leaderboard in `CrewRoom.vue` shows all-time scores. Change it to show **this week only** by default:

- Leaderboard header: "This Week" with a small "All-Time" toggle link
- API call: `GET /api/scores/toss-paper?crew_id=X&week=current`
- If no scores this week, show: "No scores yet this week — be the first!"

This makes weekly play feel fresh without deleting any data.

---

## Scheduling

### Cron Job

The snapshot should run automatically. Two options (in order of preference):

1. **Server-side setInterval** — similar to the existing hourly backup. Add a weekly check in `server/index.ts`:
   ```typescript
   // Check every hour if it's Thursday and snapshot hasn't run yet this week
   ```

2. **Manual trigger** — admin runs `POST /api/admin/highlights/snapshot` via the review CLI or a script

### Timezone

All week boundaries are UTC. Monday 00:00 UTC to Sunday 23:59 UTC. This keeps it simple and consistent across timezones.

---

## Implementation Plan

### Phase 1 — Backend (snapshot + API)
1. Add `weekly_highlights` table to `server/db.ts`
2. Add `GET /api/crews/:uuid/highlights` endpoint
3. Add `POST /api/admin/highlights/snapshot` endpoint
4. Modify `GET /api/scores/:game` to support `?week=current` filter
5. Add snapshot cron logic (weekly check in production)
6. Add smoke tests for highlights endpoints

### Phase 2 — Frontend (highlights tab)
1. Create `WeeklyHighlights.vue` component
2. Add tab navigation to `CrewRoom.vue` (Leaderboard | Highlights)
3. Update `CrewRoom.vue` leaderboard to show current week by default
4. Style the week cards with winner display, streaks, and stats

### Phase 3 — Polish
1. Streak detection (same winner 2+ consecutive weeks)
2. Stats summary bar (most wins, top score)
3. "X others played" expandable sections
4. Empty states and loading skeletons
5. Mobile responsiveness for the highlights cards

---

## Open Questions

- **Backfill:** Should we generate highlights retroactively from existing score data? (Yes — the snapshot query can be run for any past week.)
- **Single-player scores:** Only crew scores are highlighted (scores with a `crew_id`). Solo play is excluded.
- **Minimum activity:** Should we require a minimum number of participants (e.g., 2+) to generate a highlight? (Suggested: yes, require at least 2 unique players to crown a winner — otherwise it's just someone playing alone.)
- **Multiple games per week:** Each game gets its own winner. A player can win both games in the same week.

---

## Resolved Decisions

- **No score deletion:** The "weekly reset" is a frontend filter, not data deletion. All scores remain for all-time leaderboards and future Paper League percentile calculations.
- **Thursday snapshot:** Matches the existing Thursday review cadence and future Paper League schedule.
- **UTC boundaries:** Keeps it simple. If players complain about timezone issues, we can add crew-level timezone settings later.
- **Denormalized winner data:** `winner_username` is stored directly in the highlights table so we don't need joins for the common read path. If a user changes their username, old highlights keep the name they won under (intentional — it's a historical record).
