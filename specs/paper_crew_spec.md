# Paper Crew - Spec

## Overview

Paper Crew is the social/multiplayer layer of Paper. Players create or join rooms to compete asynchronously in any mini game. Each crew has a shared leaderboard, invite system, and game history.

---

## Core Concepts

### Crew
A named group of 2–8 players. The creator picks a name. An auto-generated 6-character invite code lets others join. Crews persist — they're not single-game sessions.

### Invite Flow
1. **Creator** makes a crew → gets a shareable invite code (e.g. `XK2F9A`)
2. **Joiner** enters the code on the Join Crew screen → added to the crew
3. No accounts/passwords — just a username chosen on first launch (stored locally + server)

### Async Games
- Crew members play games on their own time
- Scores are submitted to the crew's leaderboard
- No real-time sync needed — all turn data stored server-side

---

## User Identity (Lightweight)

No login system. Identity is:
1. First launch → prompt for username
2. Server creates user → returns `user_id`
3. `user_id` + `username` stored in localStorage
4. All API calls include `user_id`

If localStorage is cleared, the user creates a new identity. This is acceptable for MVP — account recovery is a future feature.

---

## Screens

### 1. Paper Crew Hub (from main menu)

```
┌─────────────────────────────┐
│        Paper Crew           │
├─────────────────────────────┤
│                             │
│  Your Crews:                │
│  ┌───────────────────────┐  │
│  │ 🟡 Lunch Squad    (4) │  │
│  │     Active · 3 games  │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ 🔵 Family Fun     (2) │  │
│  │     Active · 1 game   │  │
│  └───────────────────────┘  │
│                             │
│  [ Create Crew ]            │
│  [ Join Crew   ]            │
│                             │
│  ← Back                     │
└─────────────────────────────┘
```

- Lists all crews the user belongs to
- Each crew card shows: name, member count, game count
- Tap a crew → Crew Detail screen

### 2. Create Crew

```
┌─────────────────────────────┐
│      Create a Crew          │
├─────────────────────────────┤
│                             │
│  Crew Name:                 │
│  ┌───────────────────────┐  │
│  │ [                   ] │  │
│  └───────────────────────┘  │
│                             │
│       [ Create ]            │
│                             │
│  ← Back                     │
└─────────────────────────────┘
```

- User enters a crew name (max 24 chars)
- On submit → `POST /api/crews` → shows the invite code
- Transitions to the Share Code screen

### 3. Share Invite Code

```
┌─────────────────────────────┐
│      Crew Created!          │
├─────────────────────────────┤
│                             │
│   Your invite code:         │
│                             │
│      ┌──────────┐          │
│      │  XK2F9A  │          │
│      └──────────┘          │
│                             │
│  Share this code with       │
│  friends to invite them.    │
│                             │
│     [ Copy Code ]           │
│     [ Done      ]           │
│                             │
└─────────────────────────────┘
```

- Large, readable invite code
- Copy button uses `navigator.clipboard.writeText()`
- Done → goes to Crew Detail

### 4. Join Crew

```
┌─────────────────────────────┐
│       Join a Crew           │
├─────────────────────────────┤
│                             │
│  Enter invite code:         │
│  ┌───────────────────────┐  │
│  │ [      ] [      ]     │  │
│  └───────────────────────┘  │
│                             │
│       [ Join ]              │
│                             │
│  ← Back                     │
└─────────────────────────────┘
```

- 6-character code input (auto-uppercase)
- On submit → `POST /api/crews/join` with code + user_id
- Success → added to crew, go to Crew Detail
- Error → "Invalid code" or "Crew is full"

### 5. Crew Detail

```
┌─────────────────────────────┐
│  Lunch Squad          XK2F9A│
├─────────────────────────────┤
│                             │
│  Members (4):               │
│   Jason, Mike, Sara, Alex   │
│                             │
│  ── Leaderboard ──          │
│  Toss Paper:                │
│   1. Sara     892           │
│   2. Jason    467           │
│   3. Mike     234           │
│   4. Alex     102           │
│                             │
│  [ Play Toss Paper ]        │
│  [ Invite Code: XK2F9A ]   │
│                             │
│  ← Back                     │
└─────────────────────────────┘
```

- Crew name + invite code visible
- Member list
- Leaderboard per game (highest score per member)
- Play buttons launch the game with `crew_id` context
- Scores submitted during gameplay are tagged with this crew

---

## API Endpoints

### Existing (already built)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/users` | Create user |
| `GET` | `/api/users` | List users |
| `POST` | `/api/crews` | Create crew |
| `GET` | `/api/crews` | List all crews |
| `POST` | `/api/scores` | Submit score (supports crew_id) |
| `GET` | `/api/scores/:game` | Leaderboard (supports ?crew_id filter) |

### New Endpoints Needed
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/crews/join` | Join crew by invite code |
| `GET` | `/api/crews/:id` | Get crew detail (name, members, games) |
| `GET` | `/api/crews/:id/members` | List crew members |
| `GET` | `/api/crews/user/:user_id` | List crews a user belongs to |
| `DELETE` | `/api/crews/:id/members/:user_id` | Leave a crew |

### Join Endpoint Detail

```
POST /api/crews/join
Body: { "invite_code": "XK2F9A", "user_id": 1 }

Response (success):
{ "crew_id": 3, "name": "Lunch Squad", "member_count": 4 }

Response (error):
{ "error": "Invalid invite code" }
{ "error": "Crew is full (max 8 members)" }
{ "error": "Already a member" }
```

---

## Database

### Existing Tables (already created)
- `users` — id, username, created_at
- `crews` — id, name, invite_code (unique), created_by, created_at
- `crew_members` — crew_id, user_id, joined_at (composite PK)
- `scores` — id, user_id, game, score, crew_id (nullable), created_at

No schema changes needed — the existing tables cover everything.

---

## Frontend Implementation

### Where It Lives
Paper Crew is a Phaser scene (`PaperCrewScene`) but it's mostly UI — text, buttons, and input fields rendered via Phaser's text and graphics objects. Since Phaser doesn't have native form inputs, text input will use DOM overlay elements (HTML input positioned over the canvas).

### DOM Input Strategy
For text fields (crew name, invite code), create a hidden HTML `<input>` element positioned over the Phaser canvas at the correct location. On focus, it captures keyboard input. On submit, the value is read and the input is removed.

```typescript
// Helper: create a temporary DOM input over the canvas
function createDOMInput(x: number, y: number, width: number): HTMLInputElement {
  const input = document.createElement('input');
  input.style.position = 'absolute';
  input.style.left = `${x}px`;
  input.style.top = `${y}px`;
  input.style.width = `${width}px`;
  // ... style to match game aesthetic
  document.body.appendChild(input);
  input.focus();
  return input;
}
```

### Scene Flow
```
MainMenu → PaperCrewScene (Hub)
              ├── CreateCrewScene → ShareCodeScene → CrewDetailScene
              ├── JoinCrewScene → CrewDetailScene
              └── CrewDetailScene → [Play Game with crew_id]
```

### Local Storage
```typescript
// On first launch
localStorage.setItem('paper_user', JSON.stringify({ id: 1, username: 'Jason' }));

// Read on every scene load
const user = JSON.parse(localStorage.getItem('paper_user') || 'null');
if (!user) { /* prompt for username */ }
```

---

## Score Integration

When a player launches a game from the Crew Detail screen, the `crew_id` is passed to the game scene:

```typescript
// From CrewDetailScene:
this.scene.start('TossPaperScene', { crew_id: 3, user_id: 1 });

// In TossPaperScene, on landing:
fetch('/api/scores', {
  method: 'POST',
  body: JSON.stringify({
    user_id: this.userId,
    game: 'toss-paper',
    score: this.totalScore,
    crew_id: this.crewId,  // null if playing solo
  }),
});
```

Solo play (from main menu without a crew) still works — `crew_id` is null.

---

## Constraints

- **Max 8 members** per crew
- **Crew names**: 1–24 characters, alphanumeric + spaces
- **Invite codes**: 6 uppercase alphanumeric, auto-generated, unique
- **No real-time features** — all async, polling-based refresh
- **No auth** — user identity is localStorage-based (MVP simplicity)
- **No crew deletion** — crews persist (future: add admin controls)

---

## Mobile Considerations

- Large tap targets for buttons (min 44px height)
- Invite code displayed in large monospace font for easy reading
- Copy-to-clipboard for sharing codes
- Responsive text sizing for crew names
- Keyboard auto-dismiss after input submission
