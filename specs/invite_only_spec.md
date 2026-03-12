# Invite-Only Access — Feature Spec
*Version 2.0 — March 2026*

---

## Overview

Paper becomes invite-only. New users can request access but land on a waitlist until approved. Existing users can send invite codes to bypass the waitlist. Requests are reviewed every Thursday, keeping the cadence aligned with Paper League's weekly rhythm.

---

## User States

```
Visitor → Requests Access → Waitlisted → Approved → Active Player
                                              ↑
              Invited by existing player ──────┘ (skips waitlist)
```

| State | What they can do |
|---|---|
| **Visitor** | View landing pages, About, League pages. Cannot play or access crews. |
| **Waitlisted** | Sees a "You're on the list" confirmation page. Gets a position number. Cannot play. |
| **Approved** | Full access — play games, join/create crews, enter Paper League. |

---

## Request Access Flow

### Step 1: Sign In page changes

The current Sign In page becomes the access request form for new users:

1. User enters email
2. If email exists → normal login (existing approved user)
3. If email not found → show expanded signup form:
   - **Username** (existing field)
   - **"Why do you want to join Paper?"** — free-text textarea, 20–500 characters
   - Optional: **"How did you hear about us?"** — short text field
   - Submit button changes to `[ Request Access ]`

### Step 2: Confirmation

After submitting, the user sees:

```
You're on the list.

We review requests every Thursday.
You'll get an email when you're in.

Position: #42
```

No account is created yet. The request is stored in a `waitlist` table.

### Step 3: Thursday Review

Every Thursday (aligned with Paper League reset), an admin reviews pending requests. Options per request:
- **Approve** → account is created, user gets an email with a login link
- **Reject** → request is removed (no email sent, they can re-apply)
- **Star** → flag interesting applications for priority

---

## Invite Codes

Existing approved players can invite others directly, bypassing the waitlist.

### How it works

- Each approved player gets **2 invite codes** per season (4-week period)
- Invite codes are 8-character alphanumeric strings
- When someone signs up with a valid invite code, they skip the waitlist and are immediately approved
- The inviter is tracked (shows "Invited by: @username" on the new player's profile)

### Where invite codes appear

- **Profile/Settings page** — "Your invite codes" section with copy buttons
- **Crew Room** — "Invite a friend" action that shows the user's invite code

### Invite code rules

- Each code is single-use
- Codes expire after 30 days if unused
- Codes cannot be regenerated early — you get your next batch at the start of the next season
- If an invited player gets banned, the inviter loses one invite code next season (accountability)

---

## Admin Interface — Local Only

The admin interface is **not part of the public web app**. It runs locally via a CLI script that hits the admin API endpoints on the running server. This keeps the admin UI out of the production bundle entirely — no admin routes to discover, no admin Vue components to ship.

### CLI tool: `scripts/review-waitlist.sh`

A local script that fetches pending requests, displays them in the terminal, and lets the admin approve/reject:

```bash
./scripts/review-waitlist.sh
# or
npm run waitlist
```

Output:
```
Paper Waitlist — 7 pending requests
══════════════════════════════════════

#1  jane@example.com — "janefolds"
    "I've been making origami since I was 6. My crane collection
     is legendary. Looking for people who take paper seriously."
    Source: Twitter
    Submitted: 2026-03-10
    🤖 AI Review: ACCEPT — Genuine interest, specific hobby detail, organic discovery
    ──────────────────────────────────
    [a]ccept  [r]eject  [s]kip  [q]uit

#2  bob@test.com — "bob123"
    "idk looks cool"
    Source: (none)
    Submitted: 2026-03-11
    🤖 AI Review: REJECT — Low effort, no specific interest, generic response
    ──────────────────────────────────
    [a]ccept  [r]eject  [s]kip  [q]uit
```

### Claude Code automation: `scripts/review-waitlist-ai.sh`

A script that uses Claude Code to pre-review all pending requests and generate recommendations. Run it before your Thursday review session:

```bash
./scripts/review-waitlist-ai.sh
# or
npm run waitlist:review
```

This script:
1. Fetches all pending waitlist entries via `/api/admin/waitlist`
2. Sends the batch to Claude with review criteria (see below)
3. Writes recommendations back via `PATCH /api/admin/waitlist/:id` (sets `ai_recommendation` and `ai_reasoning` fields)
4. Outputs a summary: "12 pending → 8 recommend accept, 3 recommend reject, 1 needs human review"

The admin then runs `npm run waitlist` to step through requests with AI recommendations pre-filled — just confirm or override.

### AI Review Criteria

Claude evaluates each request on:

| Signal | Accept | Reject | Needs Review |
|---|---|---|---|
| **Effort** | Thoughtful, specific, 2+ sentences | One word / "idk" / copy-paste | Short but genuine |
| **Interest** | Mentions origami, paper crafts, specific games, competition | Generic "looks cool" / "my friend told me" with nothing else | Vague but not dismissive |
| **Red flags** | None | Profanity, spam URLs, hostile tone, obvious bot text | Borderline language |
| **Referral source** | Specific (Twitter thread, friend's name, blog post) | Empty or suspicious | Generic ("Google") |

Claude returns per-request:
- **Recommendation**: `ACCEPT`, `REJECT`, or `REVIEW` (needs human judgment)
- **Reasoning**: 1-sentence explanation
- **Confidence**: `high` or `low`
- **Suggested response** (for accepts): A short personalized welcome message based on their reason

### Example AI output

```json
{
  "id": 1,
  "recommendation": "ACCEPT",
  "confidence": "high",
  "reasoning": "Specific origami hobby, genuine enthusiasm, found us organically via Twitter",
  "suggested_welcome": "Welcome to Paper, Jane! Your crane collection sounds incredible — wait until you see what happens when you throw one."
}
```

### Confirmation emails use AI-generated welcome

When approving, the admin can use the AI's suggested personalized welcome message in the approval email, or edit/replace it. This makes each approval feel personal without the admin writing every one.

### Stats (shown in CLI)
- Total waitlisted
- Approved this week
- Rejected this week
- Active players
- Invite codes used this season
- AI accuracy (% of AI recommendations the admin agreed with — tracked to tune criteria)

---

## Database Changes

### New table: `waitlist`

```sql
CREATE TABLE waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  reason TEXT NOT NULL,
  referral_source TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
  starred INTEGER NOT NULL DEFAULT 0,
  ai_recommendation TEXT,        -- ACCEPT, REJECT, REVIEW (set by AI review script)
  ai_reasoning TEXT,             -- 1-sentence explanation from AI
  ai_confidence TEXT,            -- high, low
  ai_welcome_message TEXT,       -- Personalized welcome suggestion from AI
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### New table: `invite_codes`

```sql
CREATE TABLE invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  season INTEGER NOT NULL DEFAULT 1,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Users table addition

```sql
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'approved';
-- 'approved' for existing users, new users start as 'waitlisted'
ALTER TABLE users ADD COLUMN invited_by INTEGER REFERENCES users(id);
```

---

## API Endpoints

### Public

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/waitlist` | Submit access request (email, username, reason, referral_source) |
| `GET` | `/api/waitlist/status?email=...` | Check waitlist position (returns position number or "approved") |
| `POST` | `/api/users` | Modified — if invite_code provided, skip waitlist; otherwise reject with 403 |

### Admin (requires `ADMIN_TOKEN`, called from local scripts only)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/waitlist` | List all pending requests |
| `POST` | `/api/admin/waitlist/:id/approve` | Approve a request → creates user account. Optional `welcome_message` body. |
| `POST` | `/api/admin/waitlist/:id/reject` | Reject a request |
| `PATCH` | `/api/admin/waitlist/:id` | Toggle star, set AI recommendation fields, update notes |
| `GET` | `/api/admin/stats` | Waitlist + player stats |

### Authenticated

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/invite-codes` | List current user's invite codes |
| `POST` | `/api/invite-codes/generate` | Generate invite codes (if eligible) |

---

## Frontend Changes

### Sign In page (`LoginPage.vue`)

- New users see expanded form with reason textarea
- Submit button text: `[ Request Access ]` instead of `[ Continue ]`
- After submit: redirect to `/waitlist-confirmation`
- Optional: invite code field — "Have an invite code?" toggle

### New page: `WaitlistConfirmation.vue`

```
You're on the list.

We review requests every Thursday.
You'll get an email when you're in.

Your position: #42
Submitted: March 12, 2026
```

- Refreshing checks `/api/waitlist/status` for updated position or approval
- If approved, auto-redirects to login

### Crew pages / game pages

- If a logged-in user has `status: 'waitlisted'`, redirect to waitlist confirmation
- `validateSession()` should check user status and block access for non-approved users

### No admin pages in the app

All admin functionality lives in local CLI scripts (`scripts/review-waitlist.sh`, `scripts/review-waitlist-ai.sh`). There are no admin routes, pages, or components in the Vue app. The production bundle ships zero admin code.

---

## Email Notifications

Keep it minimal — plain text emails via a simple SMTP service or SendGrid:

- **Approved**: "You're in! Click here to sign in and start playing."
- **Weekly digest** (to admin): "12 new requests this week. 3 starred."

No email on rejection — they can re-apply if they want.

---

## Anti-Gaming

| Threat | Mitigation |
|---|---|
| Spam requests | Rate limit: 1 request per email per 7 days |
| Fake emails | Email verification link before request is queued (optional, Phase 2) |
| Invite code sharing on social media | Codes are single-use + expire in 30 days |
| Farming invite codes with alt accounts | Invite codes tied to account age (must be 2+ weeks old to get codes) |
| Re-applying after rejection | Same email can re-apply after 14 days |

---

## Vibes & Copy

The waitlist should feel exclusive but warm, not corporate:

- **Request page heading**: "Paper is invite-only right now"
- **Reason prompt**: "Tell us why you'd be a good addition" (not "why do you want to join" — subtle shift)
- **Confirmation**: "You're on the list. We check these every Thursday. Good things take time."
- **Approval email subject**: "You're in."
- **Rejection**: Silent. No "your application was denied" energy.

---

## Rollout Plan

### Phase 1 — Waitlist MVP
- Waitlist table + API endpoints (including admin endpoints)
- Modified Sign In page with reason textarea + invite code toggle
- Waitlist confirmation page (`WaitlistConfirmation.vue`)
- Local CLI script: `scripts/review-waitlist.sh` (fetch, display, approve/reject from terminal)
- Block non-approved users from playing
- `npm run waitlist` shortcut

### Phase 2 — AI-Assisted Review
- `scripts/review-waitlist-ai.sh` — Claude Code pre-reviews pending requests
- AI recommendation, reasoning, confidence, and personalized welcome message stored per request
- CLI review script shows AI recommendations inline for quick admin decisions
- Track AI accuracy (% admin agreement) to tune review criteria over time

### Phase 3 — Invite Codes
- Invite code generation + redemption
- Invite code UI in profile/settings
- "Invited by" tracking
- Season-based code allocation (2 per player per season)

### Phase 4 — Email Notifications
- Approval emails with AI-generated personalized welcome (editable by admin before send)
- Weekly admin digest
- Optional: email verification on request

### Phase 5 — Polish
- Waitlist position updates in real-time
- Referral tracking (who drives the most signups)
- Public counter: "247 players and counting"
- "Skip the line" — special invite links for content creators / partners

---

## Open Questions

- [ ] Should we grandfather all existing users as approved, or require everyone to re-verify?
- [ ] Do we want a public waitlist counter on the landing page ("312 people waiting")?
- [ ] Should invite codes be crew-level (crew leader invites) or individual-level?
- [ ] How do we handle the transition period — hard cutoff or grace period?
