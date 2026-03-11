# Database Backup & Restore

Paper uses SQLite (`better-sqlite3`) with an ephemeral DB on Cloud Run (`/tmp/paper.db`). This means every deploy or instance restart wipes the database. The backup system solves this by persisting the DB to Google Cloud Storage.

## How It Works

```
Startup:   GCS (paper-latest.db) → download → /tmp/paper.db → initDb()
Hourly:    /tmp/paper.db → upload → GCS (timestamped + latest)
Deploy:    backup-db.sh → GCS + local copy → gcloud run deploy → auto-restore on boot
```

- **On boot**: The server checks GCS for `backups/paper-latest.db` and restores it before initializing the DB
- **Every hour**: A `setInterval` uploads the current DB to GCS with a timestamped key and overwrites `paper-latest.db`
- **Pre-deploy**: The `deploy.sh` script triggers a backup via the admin API before deploying

## One-Time GCP Setup

### 1. Create the GCS bucket

```bash
gcloud storage buckets create gs://paper-db --location=us-west1
```

### 2. Generate an admin token

Pick a strong random token for protecting backup endpoints:

```bash
export PAPER_ADMIN_TOKEN=$(openssl rand -hex 32)
echo "Save this: $PAPER_ADMIN_TOKEN"
```

### 3. Set environment variables on Cloud Run

```bash
gcloud run services update paper \
  --region us-west1 \
  --set-env-vars "BACKUP_BUCKET=paper-db,ADMIN_TOKEN=$PAPER_ADMIN_TOKEN"
```

### 4. Set local env vars

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export PAPER_URL="https://paper-xxxxx-uw.a.run.app"   # your Cloud Run URL
export PAPER_ADMIN_TOKEN="your-token-here"
```

## Commands

### Deploy with automatic backup

```bash
npm run deploy
# or
./scripts/deploy.sh
```

This will:
1. Back up the current production DB to GCS and a local `backups/` copy
2. Deploy to Cloud Run with `BACKUP_BUCKET` and `ADMIN_TOKEN` env vars
3. The new instance auto-restores from GCS on startup

### Manual backup (no deploy)

```bash
npm run backup
# or
./scripts/backup-db.sh
```

Downloads a local copy to `backups/` and uploads to GCS.

### Trigger backup via API

```bash
# Trigger GCS backup
curl -X POST https://your-app.run.app/api/admin/backup \
  -H "Authorization: Bearer $PAPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label": "manual"}'

# Download DB file directly
curl https://your-app.run.app/api/admin/backup/download \
  -H "Authorization: Bearer $PAPER_ADMIN_TOKEN" \
  -o paper-backup.db

# List recent backups in GCS
curl https://your-app.run.app/api/admin/backup/list \
  -H "Authorization: Bearer $PAPER_ADMIN_TOKEN"
```

### Inspect a backup locally

```bash
sqlite3 backups/paper-20260310-143000-pre-deploy.db
> SELECT COUNT(*) FROM users;
> SELECT COUNT(*) FROM crews;
> .tables
```

## Admin API Endpoints

All require `Authorization: Bearer <ADMIN_TOKEN>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/backup` | Trigger backup to GCS. Optional `{"label": "..."}` body |
| `GET` | `/api/admin/backup/download` | Download the raw `.db` file |
| `GET` | `/api/admin/backup/list` | List recent backups in GCS |

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `BACKUP_BUCKET` | Cloud Run | GCS bucket name (e.g. `paper-db`) |
| `ADMIN_TOKEN` | Cloud Run | Secret token for admin endpoints |
| `PAPER_URL` | Local | Cloud Run service URL (for scripts) |
| `PAPER_ADMIN_TOKEN` | Local | Same as `ADMIN_TOKEN` (for scripts) |

## Architecture Decisions

- **GCS over Cloud SQL**: SQLite is simple and sufficient for this project's scale. GCS backup keeps the stack minimal — no managed DB service, no connection pooling, no schema migration tooling.
- **Hourly over continuous**: Litestream (continuous replication) costs ~$1.30/month vs ~$0.12/month for hourly. For a casual game with light traffic, up to 1 hour of data loss is acceptable.
- **Auto-restore on boot**: The server restores from GCS before `initDb()` runs, so the `CREATE TABLE IF NOT EXISTS` statements and migrations work seamlessly on top of restored data.
- **Local + GCS copies**: Pre-deploy backup saves both a local file (for quick inspection/rollback) and a GCS copy (for the next deploy's auto-restore).
- **Admin token auth**: Simple Bearer token, separate from user auth. Set via env var so it's not in code.

## Cost

- **GCS storage**: < $0.01/month (DB is < 1MB)
- **GCS operations**: ~720 writes/month (hourly) = < $0.01/month
- **Cloud Scheduler**: Not needed — hourly backup runs via `setInterval` inside the Node process
- **Total**: ~$0.12/month
