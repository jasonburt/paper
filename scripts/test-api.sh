#!/bin/bash
# Paper API smoke tests
# Runs a full user lifecycle: signup, login, profile update, crew CRUD, scores
# Usage: ./scripts/test-api.sh [base_url]

BASE="${1:-http://localhost:3011}/api"
PASS=0
FAIL=0
TOKEN=""
USER_ID=""
CREW_UUID=""
EMAIL="smoke-$(date +%s)@test.com"

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

# --- Signup ---
echo "Signup"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"username\":\"smoketest_$$\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /users (signup) returns 200" "200" "$CODE"
TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
USER_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
[ -n "$TOKEN" ] && pass "Token returned" || fail "Token returned" "empty"
[ -n "$USER_ID" ] && pass "User ID returned ($USER_ID)" || fail "User ID returned" "empty"
echo ""

# --- Login (same email) ---
echo "Login"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"username\":\"smoketest_$$\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /users (login existing) returns 200" "200" "$CODE"
# Update token from login
TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""

# --- Session validation ---
echo "Session validation"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/users/me?email=$EMAIL")
CODE=$(echo "$RESP" | tail -1)
check "GET /users/me returns 200" "200" "$CODE"
# Update token from session validation
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
