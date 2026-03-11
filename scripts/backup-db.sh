#!/usr/bin/env bash
# Backup the production DB before deploying
# Usage: ./scripts/backup-db.sh [SERVICE_URL] [ADMIN_TOKEN]
#
# Can also set via environment variables:
#   PAPER_URL       - Cloud Run service URL (e.g. https://paper-xxxxx-uw.a.run.app)
#   PAPER_ADMIN_TOKEN - Admin token matching ADMIN_TOKEN env var on Cloud Run

set -euo pipefail

SERVICE_URL="${1:-${PAPER_URL:-}}"
TOKEN="${2:-${PAPER_ADMIN_TOKEN:-}}"

if [ -z "$SERVICE_URL" ] || [ -z "$TOKEN" ]; then
  echo "Usage: ./scripts/backup-db.sh <SERVICE_URL> <ADMIN_TOKEN>"
  echo "  or set PAPER_URL and PAPER_ADMIN_TOKEN env vars"
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

echo "==> Triggering GCS backup..."
RESPONSE=$(curl -sf -X POST "${SERVICE_URL}/api/admin/backup" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"label": "pre-deploy"}')
echo "    GCS backup: $RESPONSE"

echo "==> Downloading local copy..."
curl -sf "${SERVICE_URL}/api/admin/backup/download" \
  -H "Authorization: Bearer ${TOKEN}" \
  -o "${BACKUP_DIR}/paper-${TIMESTAMP}-pre-deploy.db"
echo "    Saved to ${BACKUP_DIR}/paper-${TIMESTAMP}-pre-deploy.db"

echo "==> Backup complete!"
