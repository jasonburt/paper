# Paper — Admin User Guide

You're the admin. This guide covers everything you need to manage Paper: reviewing waitlist requests, managing players, running backups, and deploying updates.

All admin work happens locally in your terminal. There are no admin pages in the app.

---

## Setup

### Prerequisites

Make sure these env vars are in your `~/.zshrc`:

```bash
export PAPER_URL="https://paper-571241173634.us-west1.run.app"
export PAPER_ADMIN_TOKEN="your-admin-token-here"
```

Reload after editing: `source ~/.zshrc`

### Verify access

```bash
curl -s "$PAPER_URL/api/admin/backup/list" \
  -H "Authorization: Bearer $PAPER_ADMIN_TOKEN"
```

If you get a JSON response, you're good.

---

## Weekly Routine — Thursdays

Paper League resets on Thursdays. This is also when you review waitlist requests. Here's the recommended flow:

### 1. Review the waitlist

```bash
npm run waitlist
```

This opens an interactive terminal session. For each pending request you'll see:

```
#1  jane@example.com — "janefolds"
    "I've been making origami since I was 6. My crane collection
     is legendary. Looking for people who take paper seriously."
    Source: Twitter
    Submitted: 2026-03-10
    🤖 AI: ACCEPT (high) — Genuine interest, specific hobby detail
    Welcome draft: "Welcome to Paper, Jane! Your crane collection
     sounds incredible — wait until you see what happens when you throw one."
    ──────────────────────────────────
    [a]ccept  [r]eject  [s]kip  [q]uit
```

**What to press:**
- `a` — Approve. Creates their account with the password they set during signup. They can log in immediately.
- `r` — Reject silently. No email is sent. They can re-apply with a new reason.
- `s` — Skip. Come back to this one later.
- `q` — Quit. Skipped and remaining requests stay pending.

**Tips:**
- Trust the AI on high-confidence accepts — just press `a` and move on.
- Read the full reason text for anything marked `REVIEW`.
- Don't feel bad about rejecting low-effort requests ("idk looks cool"). They can re-apply with more effort.
- Aim to clear the queue each Thursday. Don't let it pile up.

### 2. Check the stats

At the end of the review session, the script shows active player count, crews, and remaining pending requests.

### 3. Run the weekly highlights snapshot

```bash
npm run snapshot
```

This captures the previous week's scores, crowns winners per game per crew, and makes them visible in the "Weekly Winners" tab in each crew room. The leaderboard automatically shows only the current week's scores, so this effectively "resets" the weekly competition.

**What it does:**
- Snapshots each crew's best scores per game for the previous week
- Requires at least 2 players in a game to crown a winner
- Idempotent — safe to run multiple times (won't duplicate data)
- The server also runs this automatically on Thursdays at ~noon PST as a fallback

**Check the results:**
```bash
curl -s "$PAPER_URL/api/crews/<crew-uuid>/highlights" | python3 -m json.tool
```

### 4. Back up the database

```bash
npm run backup
```

Always back up after a review session. This saves a local copy and uploads to GCS.

---

## Deploying Updates

### Standard deploy (with backup)

```bash
npm run deploy
```

This automatically:
1. Backs up the current production DB to GCS + local `backups/` folder
2. Deploys to Cloud Run
3. New instance auto-restores from the latest GCS backup

### Quick health check after deploy

```bash
curl -s "$PAPER_URL/api/health"
```

Check that the `booted` timestamp is recent.

### If something goes wrong

The pre-deploy backup is in `backups/`. You can inspect it:

```bash
sqlite3 backups/paper-YYYYMMDD-HHMMSS-pre-deploy.db
> SELECT COUNT(*) FROM users;
> SELECT COUNT(*) FROM waitlist WHERE status = 'pending';
```

The auto-restore on boot pulls from GCS, so the next deploy will also restore from the last good backup.

---

## Common Admin Tasks

### Check how many people are waiting

```bash
curl -s "$PAPER_URL/api/admin/waitlist" \
  -H "Authorization: Bearer $PAPER_ADMIN_TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
pending = [r for r in data if r['status'] == 'pending']
print(f'{len(pending)} pending requests')
"
```

### Approve someone manually (outside of Thursday review)

If someone DMs you or you want to let someone in right away:

```bash
# Find their request ID
curl -s "$PAPER_URL/api/admin/waitlist" \
  -H "Authorization: Bearer $PAPER_ADMIN_TOKEN" | python3 -c "
import sys, json
for r in json.load(sys.stdin):
    if r['status'] == 'pending':
        print(f\"#{r['id']}  {r['email']} — {r['username']}\")
"

# Approve by ID
curl -s -X POST "$PAPER_URL/api/admin/waitlist/42/approve" \
  -H "Authorization: Bearer $PAPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"welcome_message": "Welcome to Paper!"}'
```

### See active player count

```bash
curl -s "$PAPER_URL/api/admin/stats" \
  -H "Authorization: Bearer $PAPER_ADMIN_TOKEN"
```

### Download the database for inspection

```bash
curl -s "$PAPER_URL/api/admin/backup/download" \
  -H "Authorization: Bearer $PAPER_ADMIN_TOKEN" \
  -o paper-snapshot.db

sqlite3 paper-snapshot.db
> .tables
> SELECT COUNT(*) FROM users;
> SELECT COUNT(*) FROM crews;
> SELECT COUNT(*) FROM waitlist WHERE status = 'pending';
```

### Trigger a manual backup

```bash
curl -s -X POST "$PAPER_URL/api/admin/backup" \
  -H "Authorization: Bearer $PAPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label": "manual"}'
```

---

## Waitlist Review Guidelines

### Accept when:
- They wrote 2+ genuine sentences about why they want to join
- They mention origami, paper crafts, games, competition, or friends
- They found Paper through a specific source (a tweet, a friend, a blog post)
- They sound like someone you'd want in a crew

### Reject when:
- One-word or zero-effort reason ("cool", "idk", "test")
- Obvious spam (URLs, promotional text, gibberish)
- Hostile or inappropriate tone
- They already have an account (duplicate email — the system prevents this, but check)

### Use SKIP / come back later when:
- Short but not dismissive ("my friend told me about it" — maybe follow up)
- You're not sure and want to see if they re-apply with more detail
- The AI flagged it as REVIEW

### Don't overthink it
The goal isn't gatekeeping — it's keeping out bots and zero-effort signups. If someone took 30 seconds to write a real sentence, they're probably fine.

---

## How Login Works (v0.6.0+)

Users now need a password to sign in. The login flow has three paths:

1. **Existing user with password** — enters email, then password. Normal login.
2. **Grandfathered user (no password)** — users from before v0.6.0 are prompted to set a password on their next login. Once set, they log in normally.
3. **New user** — enters email, sees the signup form (password, username, reason). Goes to the waitlist. Once approved by you, they can log in with the password they chose during signup.

Passwords are hashed with bcrypt. You never see or handle plaintext passwords.

---

## Security Notes

- `ADMIN_TOKEN` is the only thing protecting admin endpoints. Keep it secret.
- Never commit `.env.backup` or share your token in Slack/Discord.
- Admin endpoints are rate-limited by Cloud Run's default limits, but there's no brute-force protection on the token itself. Use a long random token (the one generated with `openssl rand -hex 32` is fine).
- The admin API is accessible from the internet (same server as the app), but without the token it returns 401. All admin actions are performed from your local machine.
- If you suspect the token is compromised, rotate it:

```bash
# Generate new token
NEW_TOKEN=$(openssl rand -hex 32)

# Update Cloud Run
gcloud run services update paper \
  --region us-west1 \
  --set-env-vars "BACKUP_BUCKET=paper-db,ADMIN_TOKEN=$NEW_TOKEN"

# Update your local env
# Edit ~/.zshrc: export PAPER_ADMIN_TOKEN="<new token>"
source ~/.zshrc
```

---

## Quick Reference

| Task | Command |
|---|---|
| Interactive waitlist review | `npm run waitlist` |
| Weekly highlights snapshot | `npm run snapshot` |
| Deploy with backup | `npm run deploy` |
| Manual backup | `npm run backup` |
| Health check | `curl -s "$PAPER_URL/api/health"` |
| Player count | `curl -s "$PAPER_URL/api/admin/stats" -H "Authorization: Bearer $PAPER_ADMIN_TOKEN"` |
| Download DB | `curl -s "$PAPER_URL/api/admin/backup/download" -H "Authorization: Bearer $PAPER_ADMIN_TOKEN" -o snapshot.db` |

---

## Thursday Checklist

- [ ] Run `npm run snapshot` (crown weekly winners, reset leaderboard)
- [ ] Run `npm run waitlist` (approve/reject requests)
- [ ] Run `npm run backup` (save the state)
- [ ] Check player count and stats
- [ ] Deploy if there are code changes: `npm run deploy`
