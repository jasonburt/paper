# CLAUDE.md

Project conventions and instructions for Claude Code working on this repo.

## Architecture

- **Frontend**: Vue 3 + Phaser 3 + TypeScript + Tailwind CSS (Vite on port 5173)
- **Backend**: Express 5 + SQLite via better-sqlite3 (port 3011)
- **Routing**: Custom SPA router using `pushRoute()` with `history.pushState` + `paper-navigate` custom event
- **Auth**: Email-based login, session tokens in `Authorization: Bearer <token>` header
- **Crew IDs**: 12-char hex UUIDs in URLs, integer IDs internally for foreign keys

## Development

### Starting servers

The frontend (Vite) and backend (Express) are separate processes:

```bash
npm run dev        # Vite on :5173 (proxies /api to :3011)
npm run server     # Express API on :3011
npm run dev:all    # Both together via concurrently
```

The backend does NOT hot-reload. After editing `server/index.ts` or `server/db.ts`, you must restart it. Use `npx tsx watch server/index.ts` for auto-restart during development.

### After making changes

1. **Run smoke tests**: `npm test` (requires the backend running on :3011)
2. **Update ReleaseNotes.md**: Add a bullet or section for the change under the current version
3. **Verify `/api/health`**: Hit `http://localhost:3011/api/health` to confirm the backend is running your latest code (check the `booted` timestamp)

### Testing

`npm test` runs `scripts/test-api.sh` — a bash smoke test that exercises the full API lifecycle:
- Health check, signup, login, session validation
- Profile update (icon, color, username)
- Auth enforcement (401 without token)
- Crew CRUD (create, get, list by user)
- Scores (post and retrieve)
- Error handling (404 for missing resources)

Always run this after any backend change. All 23 tests should pass.

## Design system

- **Colors**: #1A1A1A text, #4992FF sky blue primary, #FF4F36 red-orange, #FF8F01 hover/accent, #6B6B6B secondary text, #B0A898 muted
- **Typography**: Georgia serif for headings, system sans for body, monospace for codes/labels
- **Buttons**: Text-only with bracket styling `[ Action ]`, blue primary, orange on hover
- **Layout**: Max-width 2xl (672px), centered, 4px padding, 6py vertical padding

See [Design.md](./Design.md) for the full system.

## Key patterns

- Vue components live in `src/components/`, Phaser scenes in `src/scenes/`
- User state is in localStorage (`paper_user`, `paper_token`, `paper_icon`, `paper_color`, `paper_profile_set`)
- `src/utils/user.ts` handles all identity: `getUser()`, `saveUserLocal()`, `validateSession()`, `clearUser()`
- `src/utils/api.ts` provides `api.get/post/patch/delete` with automatic auth header injection
- Crew UUIDs are resolved to internal integer IDs via `resolveCrewId()` in server/index.ts
- Production DB is ephemeral (`/tmp/paper.db`) — `validateSession()` handles DB resets gracefully

## Common pitfalls

- **Stale backend**: The Express server doesn't auto-reload. If API changes aren't taking effect, restart it.
- **Foreign key errors**: `PRAGMA foreign_keys = ON` is set. Inserting with a non-existent user/crew ID will fail. The `ON DELETE CASCADE` handles cleanup.
- **Session expiry**: If localStorage has a stale user, `validateSession()` clears it and redirects to `/login`.
- **UUID vs integer IDs**: Frontend always uses UUID strings for crew IDs. Backend resolves them to integers internally. Don't `parseInt()` crew IDs from URLs.
