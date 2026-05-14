#!/usr/bin/env bash
# Weekly Highlights Snapshot
# Captures the previous week's scores, crowns winners, and resets the weekly leaderboard.
# Schedule this to run at noon Thursday PST.
#
# Usage: ./scripts/weekly-snapshot.sh [SERVICE_URL] [ADMIN_TOKEN]
#
# Can also set via environment variables:
#   PAPER_URL           - Cloud Run service URL
#   PAPER_ADMIN_TOKEN   - Admin token

set -euo pipefail

SERVICE_URL="${1:-${PAPER_URL:-}}"
TOKEN="${2:-${PAPER_ADMIN_TOKEN:-}}"

if [ -z "$SERVICE_URL" ] || [ -z "$TOKEN" ]; then
  echo "Usage: ./scripts/weekly-snapshot.sh <SERVICE_URL> <ADMIN_TOKEN>"
  echo "  or set PAPER_URL and PAPER_ADMIN_TOKEN env vars"
  exit 1
fi

echo "==> Running weekly highlights snapshot..."
echo "    Target: $SERVICE_URL"
echo "    Time:   $(date)"

RESPONSE=$(curl -sf -X POST "${SERVICE_URL}/api/admin/highlights/snapshot" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "    Result: $RESPONSE"

# Parse result
HIGHLIGHTS=$(echo "$RESPONSE" | grep -o '"highlights":[0-9]*' | cut -d: -f2)
CREWS=$(echo "$RESPONSE" | grep -o '"crews":[0-9]*' | cut -d: -f2)
WEEK=$(echo "$RESPONSE" | grep -o '"week_start":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "==> Snapshot complete!"
echo "    Week:       $WEEK"
echo "    Crews:      $CREWS"
echo "    Highlights: $HIGHLIGHTS"
