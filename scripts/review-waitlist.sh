#!/bin/bash
# Interactive waitlist review script
# Usage: ./scripts/review-waitlist.sh [base_url]
# Requires PAPER_ADMIN_TOKEN and PAPER_URL env vars (or pass URL as argument)

URL="${1:-$PAPER_URL}"
TOKEN="$PAPER_ADMIN_TOKEN"

if [ -z "$URL" ] || [ -z "$TOKEN" ]; then
  echo "Error: Set PAPER_URL and PAPER_ADMIN_TOKEN env vars"
  echo "  export PAPER_URL=\"https://paper-571241173634.us-west1.run.app\""
  echo "  export PAPER_ADMIN_TOKEN=\"your-token\""
  exit 1
fi

BASE="$URL/api"
APPROVED=0
REJECTED=0
SKIPPED=0

# Fetch pending entries
ENTRIES=$(curl -s "$BASE/admin/waitlist?status=pending" \
  -H "Authorization: Bearer $TOKEN")

COUNT=$(echo "$ENTRIES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)

if [ "$COUNT" = "0" ] || [ -z "$COUNT" ]; then
  echo "No pending waitlist requests."
  exit 0
fi

echo "=== Paper Waitlist Review ==="
echo "$COUNT pending request(s)"
echo ""

# Process each entry
echo "$ENTRIES" | python3 -c "
import sys, json
entries = json.load(sys.stdin)
for e in entries:
    print(f\"ID:{e['id']}\")
    print(f\"EMAIL:{e['email']}\")
    print(f\"USERNAME:{e['username']}\")
    print(f\"REASON:{e['reason']}\")
    print(f\"SOURCE:{e.get('source') or 'unknown'}\")
    print(f\"DATE:{e['created_at']}\")
    ai_rec = e.get('ai_recommendation') or ''
    ai_reason = e.get('ai_reasoning') or ''
    ai_conf = e.get('ai_confidence') or ''
    ai_msg = e.get('ai_welcome_message') or ''
    print(f\"AI_REC:{ai_rec}\")
    print(f\"AI_REASON:{ai_reason}\")
    print(f\"AI_CONF:{ai_conf}\")
    print(f\"AI_MSG:{ai_msg}\")
    print('---END---')
" | while IFS= read -r line; do
  case "$line" in
    ID:*) ID="${line#ID:}" ;;
    EMAIL:*) EMAIL="${line#EMAIL:}" ;;
    USERNAME:*) USERNAME="${line#USERNAME:}" ;;
    REASON:*) REASON="${line#REASON:}" ;;
    SOURCE:*) SOURCE="${line#SOURCE:}" ;;
    DATE:*) DATE="${line#DATE:}" ;;
    AI_REC:*) AI_REC="${line#AI_REC:}" ;;
    AI_REASON:*) AI_REASON="${line#AI_REASON:}" ;;
    AI_CONF:*) AI_CONF="${line#AI_CONF:}" ;;
    AI_MSG:*) AI_MSG="${line#AI_MSG:}" ;;
    ---END---)
      echo "────────────────────────────────────"
      echo "#$ID  $EMAIL — \"$USERNAME\""
      echo "    \"$REASON\""
      echo "    Source: $SOURCE"
      echo "    Submitted: $DATE"
      if [ -n "$AI_REC" ]; then
        echo "    🤖 AI: $AI_REC ($AI_CONF) — $AI_REASON"
        if [ -n "$AI_MSG" ]; then
          echo "    Welcome draft: \"$AI_MSG\""
        fi
      fi
      echo "────────────────────────────────────"
      printf "    [a]ccept  [r]eject  [s]kip  [q]uit: "
      read -r -n 1 ACTION </dev/tty
      echo ""

      case "$ACTION" in
        a|A)
          RESP=$(curl -s -X POST "$BASE/admin/waitlist/$ID/approve" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
          if echo "$RESP" | grep -q '"ok":true'; then
            echo "    ✓ Approved"
            APPROVED=$((APPROVED + 1))
          else
            echo "    ✗ Failed: $RESP"
          fi
          ;;
        r|R)
          RESP=$(curl -s -X POST "$BASE/admin/waitlist/$ID/reject" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
          if echo "$RESP" | grep -q '"ok":true'; then
            echo "    ✓ Rejected"
            REJECTED=$((REJECTED + 1))
          else
            echo "    ✗ Failed: $RESP"
          fi
          ;;
        s|S)
          echo "    → Skipped"
          SKIPPED=$((SKIPPED + 1))
          ;;
        q|Q)
          echo ""
          echo "Quit. Remaining requests stay pending."
          break
          ;;
        *)
          echo "    → Skipped (unknown input)"
          SKIPPED=$((SKIPPED + 1))
          ;;
      esac
      echo ""
      ;;
  esac
done

echo ""
echo "=== Session Summary ==="
echo "Approved: $APPROVED"
echo "Rejected: $REJECTED"
echo "Skipped:  $SKIPPED"

# Show current stats
STATS=$(curl -s "$BASE/admin/stats" -H "Authorization: Bearer $TOKEN")
echo ""
echo "$STATS" | python3 -c "
import sys, json
s = json.load(sys.stdin)
print(f\"Active players: {s['active_users']}\")
print(f\"Crews: {s['crews']}\")
print(f\"Waitlist pending: {s['waitlist']['pending']}\")
"
