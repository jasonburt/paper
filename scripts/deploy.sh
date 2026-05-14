#!/usr/bin/env bash
# Deploy with automatic pre-deploy backup
# Usage: ./scripts/deploy.sh
#
# Requires env vars:
#   PAPER_URL          - Current Cloud Run service URL
#   PAPER_ADMIN_TOKEN  - Admin token for backup endpoints

set -euo pipefail

# Step 1: Backup current production DB
if [ -n "${PAPER_URL:-}" ] && [ -n "${PAPER_ADMIN_TOKEN:-}" ]; then
  echo "==> Backing up production DB before deploy..."
  ./scripts/backup-db.sh
  echo ""
else
  echo "==> Skipping backup (PAPER_URL or PAPER_ADMIN_TOKEN not set)"
  echo "    Set these env vars to enable pre-deploy backups"
  echo ""
fi

# Step 2: Deploy to Cloud Run
echo "==> Deploying to Cloud Run..."
gcloud run deploy paper \
  --source . \
  --region us-west1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 1 \
  --update-env-vars "BACKUP_BUCKET=paper-db,ADMIN_TOKEN=${PAPER_ADMIN_TOKEN:-}" \
  --cpu-boost

echo ""
echo "==> Deploy complete! The new instance will auto-restore from the latest GCS backup."
