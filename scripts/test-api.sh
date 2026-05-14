#!/bin/bash
# Paper API smoke tests
# Runs a full user lifecycle: signup (waitlist → approve), login, profile update, crew CRUD, scores
# Usage: ./scripts/test-api.sh [base_url]
# Requires ADMIN_TOKEN env var (or defaults to 'test-admin-token' for local dev)

BASE="${1:-http://localhost:3011}/api"
ADMIN="${ADMIN_TOKEN:-test-admin-token}"
PASS=0
FAIL=0
TOKEN=""
USER_ID=""
CREW_UUID=""
EMAIL="smoke-$(date +%s)@test.com"
USERNAME="smoketest_$$"
PASSWORD="smokepass123"

pass() { PASS=$((PASS + 1)); echo "  ✓ $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  ✗ $1 (got $2)"; }

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then pass "$label"; else fail "$label" "$actual"; fi
}

echo "=== Paper API Smoke Tests ==="
echo "Base: $BASE"
echo ""

# --- Health ---
echo "Health"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/health")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /health returns 200" "200" "$CODE"
echo "$BODY" | grep -q '"booted"' && pass "Response includes boot timestamp" || fail "Response includes boot timestamp" "missing booted field"
echo ""

# --- Auth check (new email) ---
echo "Auth check"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/check" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /auth/check returns 200" "200" "$CODE"
echo "$BODY" | grep -q '"exists":false' && pass "New email not found" || fail "New email not found" "$BODY"
echo ""

# --- Signup (goes to waitlist) ---
echo "Signup (waitlist)"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\",\"reason\":\"I love paper crafts and origami. Testing the system.\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /users (signup) returns 200" "200" "$CODE"
echo "$BODY" | grep -q '"waitlisted":true' && pass "Added to waitlist" || fail "Added to waitlist" "$BODY"
echo ""

# --- Admin: approve from waitlist ---
echo "Admin approval"
# Get the waitlist entry ID
RESP=$(curl -s "$BASE/admin/waitlist?status=pending" \
  -H "Authorization: Bearer $ADMIN")
WL_ID=$(echo "$RESP" | grep -o "\"id\":[0-9]*" | tail -1 | cut -d: -f2)
[ -n "$WL_ID" ] && pass "Found waitlist entry ($WL_ID)" || fail "Found waitlist entry" "empty"

if [ -n "$WL_ID" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/admin/waitlist/$WL_ID/approve" \
    -H "Authorization: Bearer $ADMIN" \
    -H "Content-Type: application/json")
  CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  check "POST /admin/waitlist/:id/approve returns 200" "200" "$CODE"
  USER_ID=$(echo "$BODY" | grep -o '"user_id":[0-9]*' | head -1 | cut -d: -f2)
  [ -n "$USER_ID" ] && pass "User created ($USER_ID)" || fail "User created" "empty"
fi
echo ""

# --- Login with password ---
echo "Login"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /users (login) returns 200" "200" "$CODE"
TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$TOKEN" ] && pass "Token returned" || fail "Token returned" "empty"
echo ""

# --- Wrong password ---
echo "Password enforcement"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"wrongpass\"}")
CODE=$(echo "$RESP" | tail -1)
check "Wrong password returns 401" "401" "$CODE"
echo ""

# --- Session validation ---
echo "Session validation"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/users/me?email=$EMAIL")
CODE=$(echo "$RESP" | tail -1)
check "GET /users/me returns 200" "200" "$CODE"
BODY=$(echo "$RESP" | sed '$d')
TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""

# --- Update profile ---
echo "Profile update"
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"icon\":\"crane\",\"color\":\"#4992FF\",\"username\":\"Smoke_$$\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "PATCH /users/:id returns 200" "200" "$CODE"
echo "$BODY" | grep -q "\"username\":\"Smoke_$$\"" && pass "Username updated" || fail "Username updated" "$BODY"
echo "$BODY" | grep -q '"icon":"crane"' && pass "Icon updated" || fail "Icon updated" "$BODY"
echo ""

# --- Auth required ---
echo "Auth enforcement"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/crews" \
  -H "Content-Type: application/json" \
  -d '{"name":"NoAuth","created_by":1}')
CODE=$(echo "$RESP" | tail -1)
check "POST /crews without token returns 401" "401" "$CODE"
echo ""

# --- Create crew ---
echo "Create crew"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/crews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Smoke Crew\",\"created_by\":$USER_ID}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /crews returns 200" "200" "$CODE"
CREW_UUID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
INVITE=$(echo "$BODY" | grep -o '"invite_code":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$CREW_UUID" ] && pass "UUID crew ID returned ($CREW_UUID)" || fail "UUID crew ID returned" "empty"
[ ${#INVITE} -eq 6 ] && pass "Invite code is 6 chars ($INVITE)" || fail "Invite code is 6 chars" "${#INVITE} chars: $INVITE"
echo ""

# --- Get crew ---
echo "Get crew"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/crews/$CREW_UUID")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /crews/:uuid returns 200" "200" "$CODE"
echo "$BODY" | grep -q '"Smoke Crew"' && pass "Crew name matches" || fail "Crew name matches" "$BODY"
echo ""

# --- User crews ---
echo "User crews"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/crews/user/$USER_ID")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /crews/user/:id returns 200" "200" "$CODE"
echo "$BODY" | grep -q "$CREW_UUID" && pass "Crew UUID in user's crew list" || fail "Crew UUID in user's crew list" "$BODY"
echo ""

# --- Post score ---
echo "Scores"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/scores" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"user_id\":$USER_ID,\"game\":\"toss-paper\",\"score\":420,\"crew_id\":\"$CREW_UUID\"}")
CODE=$(echo "$RESP" | tail -1)
check "POST /scores returns 200" "200" "$CODE"

RESP=$(curl -s -w "\n%{http_code}" "$BASE/scores/toss-paper?crew_id=$CREW_UUID")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /scores/:game returns 200" "200" "$CODE"
echo "$BODY" | grep -q '"420"' || echo "$BODY" | grep -q ':420' && pass "Score 420 in results" || fail "Score 420 in results" "$BODY"
echo ""

# --- Admin stats ---
echo "Admin stats"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/stats" \
  -H "Authorization: Bearer $ADMIN")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /admin/stats returns 200" "200" "$CODE"
echo "$BODY" | grep -q '"active_users"' && pass "Stats include active_users" || fail "Stats include active_users" "$BODY"
echo ""

# --- Invite codes ---
echo "Invite codes"

# User should have 2 invite codes after approval
RESP=$(curl -s -w "\n%{http_code}" "$BASE/invites" \
  -H "Authorization: Bearer $TOKEN")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /invites returns 200" "200" "$CODE"
INVITE_COUNT=$(echo "$BODY" | grep -o '"code"' | wc -l | tr -d ' ')
check "User has 2 invite codes" "2" "$INVITE_COUNT"

# Extract first invite code
INVITE_CODE=$(echo "$BODY" | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$INVITE_CODE" ] && pass "Got invite code ($INVITE_CODE)" || fail "Got invite code" "empty"

# Validate invite code (public endpoint)
RESP=$(curl -s -w "\n%{http_code}" "$BASE/invites/check?code=$INVITE_CODE")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /invites/check returns 200" "200" "$CODE"
echo "$BODY" | grep -q '"valid":true' && pass "Invite code is valid" || fail "Invite code is valid" "$BODY"

# Invalid invite code
RESP=$(curl -s "$BASE/invites/check?code=BADCODE1")
echo "$RESP" | grep -q '"valid":false' && pass "Bad code returns invalid" || fail "Bad code returns invalid" "$RESP"

# Signup with invite code (skips waitlist)
INVITE_EMAIL="invited-$(date +%s)@test.com"
INVITE_USERNAME="invited_$$"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$INVITE_EMAIL\",\"username\":\"$INVITE_USERNAME\",\"password\":\"$PASSWORD\",\"invite_code\":\"$INVITE_CODE\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Signup with invite code returns 200" "200" "$CODE"
echo "$BODY" | grep -q '"token"' && pass "Invited user gets token (skipped waitlist)" || fail "Invited user gets token" "$BODY"
INVITED_USER_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

# Invite code should now be used
RESP=$(curl -s "$BASE/invites/check?code=$INVITE_CODE")
echo "$RESP" | grep -q '"valid":false' && pass "Used invite code shows invalid" || fail "Used invite code shows invalid" "$RESP"

# Invited user should also have 2 invite codes
INVITED_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
RESP=$(curl -s "$BASE/invites" -H "Authorization: Bearer $INVITED_TOKEN")
INVITE_COUNT2=$(echo "$RESP" | grep -o '"code"' | wc -l | tr -d ' ')
check "Invited user also has 2 invite codes" "2" "$INVITE_COUNT2"

# Re-using used invite code should fail
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"reuse-$(date +%s)@test.com\",\"username\":\"reuse_$$\",\"password\":\"$PASSWORD\",\"invite_code\":\"$INVITE_CODE\"}")
CODE=$(echo "$RESP" | tail -1)
check "Re-using invite code returns 400" "400" "$CODE"
echo ""

# --- Weekly highlights ---
echo "Weekly highlights"

# Trigger a snapshot for the current week (so the scores we just posted get captured)
# First we need a second user to play in the same crew (minimum 2 participants)
INVITE2=$(curl -s "$BASE/invites" -H "Authorization: Bearer $TOKEN" | grep -o '"code":"[^"]*"' | tail -1 | cut -d'"' -f4)
SECOND_EMAIL="second-$(date +%s)@test.com"
SECOND_USER="second_$$"
RESP=$(curl -s -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SECOND_EMAIL\",\"username\":\"$SECOND_USER\",\"password\":\"$PASSWORD\",\"invite_code\":\"$INVITE2\"}")
SECOND_ID=$(echo "$RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
SECOND_TOKEN=$(echo "$RESP" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$SECOND_ID" ] && pass "Second user created ($SECOND_ID)" || fail "Second user created" "empty"

# Join the crew
RESP=$(curl -s -X POST "$BASE/crews/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECOND_TOKEN" \
  -d "{\"invite_code\":\"$INVITE\",\"user_id\":$SECOND_ID}")
echo "$RESP" | grep -q '"crew_id"' && pass "Second user joined crew" || fail "Second user joined crew" "$RESP"

# Post a score for the second user
curl -s -X POST "$BASE/scores" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECOND_TOKEN" \
  -d "{\"user_id\":$SECOND_ID,\"game\":\"toss-paper\",\"score\":200,\"crew_id\":\"$CREW_UUID\"}" > /dev/null

# Trigger snapshot for current week
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/admin/highlights/snapshot" \
  -H "Authorization: Bearer $ADMIN" \
  -H "Content-Type: application/json" \
  -d "{\"week_start\":\"$(date -u +%Y-%m-%d -d 'last monday' 2>/dev/null || date -u -v-mon +%Y-%m-%d)\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /admin/highlights/snapshot returns 200" "200" "$CODE"
echo "$BODY" | grep -q '"ok":true' && pass "Snapshot succeeded" || fail "Snapshot succeeded" "$BODY"

# Get highlights
RESP=$(curl -s -w "\n%{http_code}" "$BASE/crews/$CREW_UUID/highlights")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /crews/:uuid/highlights returns 200" "200" "$CODE"
echo "$BODY" | grep -q '"winner"' && pass "Highlights contain winner data" || fail "Highlights contain winner data" "$BODY"

# Get highlights stats
RESP=$(curl -s -w "\n%{http_code}" "$BASE/crews/$CREW_UUID/highlights/stats")
CODE=$(echo "$RESP" | tail -1)
check "GET /crews/:uuid/highlights/stats returns 200" "200" "$CODE"

# Weekly score filter
RESP=$(curl -s -w "\n%{http_code}" "$BASE/scores/toss-paper?crew_id=$CREW_UUID&week=current")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /scores with week=current returns 200" "200" "$CODE"
echo ""

# --- 404 for missing crew ---
echo "Error handling"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/crews/doesnotexist123")
CODE=$(echo "$RESP" | tail -1)
check "GET /crews/:bad_uuid returns 404" "404" "$CODE"

RESP=$(curl -s -w "\n%{http_code}" "$BASE/users/me?email=nobody@nowhere.com")
CODE=$(echo "$RESP" | tail -1)
check "GET /users/me unknown email returns 404" "404" "$CODE"
echo ""

# --- Summary ---
TOTAL=$((PASS + FAIL))
echo "==========================="
if [ $FAIL -eq 0 ]; then
  echo "All $TOTAL tests passed"
  exit 0
else
  echo "$PASS passed, $FAIL failed (of $TOTAL)"
  exit 1
fi
