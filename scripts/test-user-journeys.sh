#!/bin/bash
# Paper — User Journey Tests
# Tests signup, login, waitlist, invite codes, crew, and admin flows
# Outputs JSON results for the coverage report generator
#
# Usage: ./scripts/test-user-journeys.sh [base_url]

BASE="${1:-http://localhost:3011}/api"
RESULTS_FILE="scripts/test-results.json"
PASS=0
FAIL=0
SKIP=0
TIMESTAMP=$(date +%s)
EMAIL_A="journey-a-${TIMESTAMP}@test.com"
EMAIL_B="journey-b-${TIMESTAMP}@test.com"
EMAIL_NEW="journey-new-${TIMESTAMP}@test.com"
TOKEN_A=""
TOKEN_B=""
USER_ID_A=""
USER_ID_B=""
CREW_UUID=""
INVITE_CODE=""
ADMIN_TOKEN="${PAPER_ADMIN_TOKEN:-}"

# JSON results array
RESULTS="["

record() {
  local journey="$1" test_id="$2" name="$3" status="$4" detail="$5" spec="$6"
  [ ${#RESULTS} -gt 1 ] && RESULTS="$RESULTS,"
  RESULTS="$RESULTS{\"journey\":\"$journey\",\"id\":\"$test_id\",\"name\":\"$name\",\"status\":\"$status\",\"detail\":\"$detail\",\"spec\":\"$spec\"}"
  if [ "$status" = "pass" ]; then
    PASS=$((PASS + 1))
    echo "  ✓ $name"
  elif [ "$status" = "fail" ]; then
    FAIL=$((FAIL + 1))
    echo "  ✗ $name — $detail"
  else
    SKIP=$((SKIP + 1))
    echo "  ○ $name — $detail"
  fi
}

check() {
  local journey="$1" test_id="$2" name="$3" expected="$4" actual="$5" spec="$6"
  if [ "$actual" = "$expected" ]; then
    record "$journey" "$test_id" "$name" "pass" "" "$spec"
  else
    record "$journey" "$test_id" "$name" "fail" "expected $expected, got $actual" "$spec"
  fi
}

contains() {
  local journey="$1" test_id="$2" name="$3" haystack="$4" needle="$5" spec="$6"
  if echo "$haystack" | grep -q "$needle"; then
    record "$journey" "$test_id" "$name" "pass" "" "$spec"
  else
    record "$journey" "$test_id" "$name" "fail" "missing '$needle'" "$spec"
  fi
}

echo "═══════════════════════════════════════"
echo "  Paper — User Journey Tests"
echo "  Base: $BASE"
echo "═══════════════════════════════════════"
echo ""

# ==========================================
# JOURNEY 1: New User Signup & Login
# ==========================================
echo "Journey 1: New User Signup & Login"
echo "──────────────────────────────────"

# 1.1 Health check
RESP=$(curl -s -w "\n%{http_code}" "$BASE/health")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "signup" "1.1" "Health check returns 200" "200" "$CODE" "CLAUDE.md"
contains "signup" "1.2" "Health response has booted timestamp" "$BODY" '"booted"' "CLAUDE.md"

# 1.3 Signup new user A
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_A\",\"username\":\"player_a_$TIMESTAMP\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "signup" "1.3" "Signup returns 200" "200" "$CODE" "paper_crew_spec.md"
TOKEN_A=$(echo "$BODY" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
USER_ID_A=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
[ -n "$TOKEN_A" ] && record "signup" "1.4" "Token returned on signup" "pass" "" "paper_crew_spec.md" || record "signup" "1.4" "Token returned on signup" "fail" "empty token" "paper_crew_spec.md"
[ -n "$USER_ID_A" ] && record "signup" "1.5" "User ID returned on signup" "pass" "" "paper_crew_spec.md" || record "signup" "1.5" "User ID returned on signup" "fail" "empty ID" "paper_crew_spec.md"

# 1.6 Login with same email
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_A\",\"username\":\"player_a_$TIMESTAMP\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "signup" "1.6" "Login existing user returns 200" "200" "$CODE" "paper_crew_spec.md"
OLD_TOKEN="$TOKEN_A"
TOKEN_A=$(echo "$BODY" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
[ "$TOKEN_A" != "$OLD_TOKEN" ] && record "signup" "1.7" "Token refreshed on login" "pass" "" "paper_crew_spec.md" || record "signup" "1.7" "Token refreshed on login" "fail" "same token" "paper_crew_spec.md"

# 1.8 Session validation
RESP=$(curl -s -w "\n%{http_code}" "$BASE/users/me?email=$EMAIL_A")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "signup" "1.8" "Session validation returns 200" "200" "$CODE" "paper_crew_spec.md"
contains "signup" "1.9" "Session returns user email" "$BODY" "$EMAIL_A" "paper_crew_spec.md"
# Session validation refreshes the token — capture it
TOKEN_A=$(echo "$BODY" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

# 1.10 Signup missing fields
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d '{"email":""}')
CODE=$(echo "$RESP" | tail -1)
check "signup" "1.10" "Signup without username returns 400" "400" "$CODE" "paper_crew_spec.md"

# 1.11 Duplicate username
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"other-$EMAIL_A\",\"username\":\"player_a_$TIMESTAMP\"}")
CODE=$(echo "$RESP" | tail -1)
check "signup" "1.11" "Duplicate username returns 409" "409" "$CODE" "paper_crew_spec.md"

# 1.12 Unknown email returns 404
RESP=$(curl -s -w "\n%{http_code}" "$BASE/users/me?email=nonexistent-$TIMESTAMP@test.com")
CODE=$(echo "$RESP" | tail -1)
check "signup" "1.12" "Unknown email returns 404" "404" "$CODE" "paper_crew_spec.md"
echo ""

# ==========================================
# JOURNEY 2: Profile Management
# ==========================================
echo "Journey 2: Profile Management"
echo "──────────────────────────────"

# 2.1 Update icon
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/users/$USER_ID_A" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"icon":"crane"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "profile" "2.1" "Update icon returns 200" "200" "$CODE" "paper_crew_spec.md"
contains "profile" "2.2" "Icon updated to crane" "$BODY" '"icon":"crane"' "paper_crew_spec.md"

# 2.3 Update color
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/users/$USER_ID_A" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"color":"#4992FF"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "profile" "2.3" "Update color returns 200" "200" "$CODE" "paper_crew_spec.md"
contains "profile" "2.4" "Color updated" "$BODY" '"color":"#4992FF"' "paper_crew_spec.md"

# 2.5 Update username
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/users/$USER_ID_A" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"username\":\"renamed_$TIMESTAMP\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "profile" "2.5" "Update username returns 200" "200" "$CODE" "paper_crew_spec.md"
contains "profile" "2.6" "Username updated" "$BODY" "renamed_$TIMESTAMP" "paper_crew_spec.md"

# 2.7 Cannot update another user's profile
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/users/99999" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"icon":"star"}')
CODE=$(echo "$RESP" | tail -1)
check "profile" "2.7" "Cannot update other user returns 403" "403" "$CODE" "paper_crew_spec.md"

# 2.8 Update without auth
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/users/$USER_ID_A" \
  -H "Content-Type: application/json" \
  -d '{"icon":"star"}')
CODE=$(echo "$RESP" | tail -1)
check "profile" "2.8" "Update without auth returns 401" "401" "$CODE" "paper_crew_spec.md"
echo ""

# ==========================================
# JOURNEY 3: Crew Creation & Management
# ==========================================
echo "Journey 3: Crew Creation & Management"
echo "──────────────────────────────────────"

# 3.1 Create crew
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/crews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"name\":\"Test Crew\",\"created_by\":$USER_ID_A}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "crew" "3.1" "Create crew returns 200" "200" "$CODE" "paper_crew_spec.md"
CREW_UUID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
INVITE_CODE=$(echo "$BODY" | grep -o '"invite_code":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$CREW_UUID" ] && record "crew" "3.2" "Crew UUID returned" "pass" "" "paper_crew_spec.md" || record "crew" "3.2" "Crew UUID returned" "fail" "empty" "paper_crew_spec.md"
[ ${#INVITE_CODE} -eq 6 ] && record "crew" "3.3" "Invite code is 6 characters" "pass" "" "paper_crew_spec.md" || record "crew" "3.3" "Invite code is 6 characters" "fail" "${#INVITE_CODE} chars" "paper_crew_spec.md"

# 3.4 Create crew without auth
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/crews" \
  -H "Content-Type: application/json" \
  -d '{"name":"No Auth Crew","created_by":1}')
CODE=$(echo "$RESP" | tail -1)
check "crew" "3.4" "Create crew without auth returns 401" "401" "$CODE" "paper_crew_spec.md"

# 3.5 Create crew without name
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/crews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"name\":\"\",\"created_by\":$USER_ID_A}")
CODE=$(echo "$RESP" | tail -1)
check "crew" "3.5" "Create crew without name returns 400" "400" "$CODE" "paper_crew_spec.md"

# 3.6 Get crew by UUID
RESP=$(curl -s -w "\n%{http_code}" "$BASE/crews/$CREW_UUID")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "crew" "3.6" "Get crew by UUID returns 200" "200" "$CODE" "paper_crew_spec.md"
contains "crew" "3.7" "Crew name matches" "$BODY" '"Test Crew"' "paper_crew_spec.md"
contains "crew" "3.8" "Creator is a member" "$BODY" "renamed_$TIMESTAMP" "paper_crew_spec.md"

# 3.9 Get non-existent crew
RESP=$(curl -s -w "\n%{http_code}" "$BASE/crews/000000000000")
CODE=$(echo "$RESP" | tail -1)
check "crew" "3.9" "Non-existent crew returns 404" "404" "$CODE" "paper_crew_spec.md"

# 3.10 List user's crews
RESP=$(curl -s -w "\n%{http_code}" "$BASE/crews/user/$USER_ID_A")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "crew" "3.10" "List user crews returns 200" "200" "$CODE" "paper_crew_spec.md"
contains "crew" "3.11" "Created crew in user's list" "$BODY" "$CREW_UUID" "paper_crew_spec.md"
echo ""

# ==========================================
# JOURNEY 4: Crew Join & Members
# ==========================================
echo "Journey 4: Crew Join & Members"
echo "──────────────────────────────"

# Create user B (signup gives us the freshest token)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_B\",\"username\":\"player_b_$TIMESTAMP\"}")
BODY=$(echo "$RESP" | sed '$d')
TOKEN_B=$(echo "$BODY" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
USER_ID_B=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

# Re-login user A to get fresh token (session validation may have rotated it)
RESP=$(curl -s -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_A\",\"username\":\"renamed_$TIMESTAMP\"}")
TOKEN_A=$(echo "$RESP" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

# 4.1 Join crew with invite code
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/crews/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d "{\"invite_code\":\"$INVITE_CODE\",\"user_id\":$USER_ID_B}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "join" "4.1" "Join crew returns 200" "200" "$CODE" "paper_crew_spec.md"
contains "join" "4.2" "Member count is 2" "$BODY" '"member_count":2' "paper_crew_spec.md"

# 4.3 Cannot join twice
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/crews/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d "{\"invite_code\":\"$INVITE_CODE\",\"user_id\":$USER_ID_B}")
CODE=$(echo "$RESP" | tail -1)
check "join" "4.3" "Double join returns 400" "400" "$CODE" "paper_crew_spec.md"

# 4.4 Invalid invite code
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/crews/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d "{\"invite_code\":\"XXXXXX\",\"user_id\":$USER_ID_B}")
CODE=$(echo "$RESP" | tail -1)
check "join" "4.4" "Bad invite code returns 404" "404" "$CODE" "paper_crew_spec.md"

# 4.5 Crew members list
RESP=$(curl -s -w "\n%{http_code}" "$BASE/crews/$CREW_UUID/members")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "join" "4.5" "List members returns 200" "200" "$CODE" "paper_crew_spec.md"
contains "join" "4.6" "Both members in list" "$BODY" "player_b_$TIMESTAMP" "paper_crew_spec.md"

# 4.7 Leave crew
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/crews/$CREW_UUID/members/$USER_ID_B" \
  -H "Authorization: Bearer $TOKEN_B")
CODE=$(echo "$RESP" | tail -1)
check "join" "4.7" "Leave crew returns 200" "200" "$CODE" "paper_crew_spec.md"

# 4.8 Verify member removed
RESP=$(curl -s -w "\n%{http_code}" "$BASE/crews/$CREW_UUID/members")
BODY=$(echo "$RESP" | sed '$d')
if echo "$BODY" | grep -q "player_b_$TIMESTAMP"; then
  record "join" "4.8" "Member removed from crew" "fail" "still in list" "paper_crew_spec.md"
else
  record "join" "4.8" "Member removed from crew" "pass" "" "paper_crew_spec.md"
fi
echo ""

# ==========================================
# JOURNEY 5: Scores & Leaderboard
# ==========================================
echo "Journey 5: Scores & Leaderboard"
echo "────────────────────────────────"

# 5.1 Post score
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/scores" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"user_id\":$USER_ID_A,\"game\":\"toss-paper\",\"score\":350,\"crew_id\":\"$CREW_UUID\"}")
CODE=$(echo "$RESP" | tail -1)
check "scores" "5.1" "Post score returns 200" "200" "$CODE" "paper_crew_spec.md"

# 5.2 Post score without auth
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/scores" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$USER_ID_A,\"game\":\"toss-paper\",\"score\":999}")
CODE=$(echo "$RESP" | tail -1)
check "scores" "5.2" "Post score without auth returns 401" "401" "$CODE" "paper_crew_spec.md"

# 5.3 Get leaderboard
RESP=$(curl -s -w "\n%{http_code}" "$BASE/scores/toss-paper")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "scores" "5.3" "Get leaderboard returns 200" "200" "$CODE" "paper_crew_spec.md"
contains "scores" "5.4" "Score in leaderboard" "$BODY" "350" "paper_crew_spec.md"

# 5.5 Get crew-filtered leaderboard
RESP=$(curl -s -w "\n%{http_code}" "$BASE/scores/toss-paper?crew_id=$CREW_UUID")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "scores" "5.5" "Crew leaderboard returns 200" "200" "$CODE" "paper_crew_spec.md"
contains "scores" "5.6" "Score in crew leaderboard" "$BODY" "350" "paper_crew_spec.md"

# 5.7 Leaderboard for non-existent game
RESP=$(curl -s -w "\n%{http_code}" "$BASE/scores/nonexistent-game")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "scores" "5.7" "Empty leaderboard returns 200" "200" "$CODE" "paper_crew_spec.md"
check "scores" "5.8" "Empty leaderboard is empty array" "[]" "$BODY" "paper_crew_spec.md"
echo ""

# ==========================================
# JOURNEY 6: Obstacles
# ==========================================
echo "Journey 6: Obstacles"
echo "────────────────────"

# 6.1 Place obstacle
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/obstacles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"crew_id\":\"$CREW_UUID\",\"game\":\"toss-paper\",\"user_id\":$USER_ID_A,\"type\":\"wall\",\"x\":200,\"y\":100}")
CODE=$(echo "$RESP" | tail -1)
check "obstacles" "6.1" "Place obstacle returns 200" "200" "$CODE" "placeable_objects_spec.md"

# 6.2 Get obstacles
RESP=$(curl -s -w "\n%{http_code}" "$BASE/obstacles/toss-paper?crew_id=$CREW_UUID")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "obstacles" "6.2" "Get obstacles returns 200" "200" "$CODE" "placeable_objects_spec.md"
contains "obstacles" "6.3" "Obstacle type in response" "$BODY" '"wall"' "placeable_objects_spec.md"

# 6.4 Obstacles without crew_id
RESP=$(curl -s -w "\n%{http_code}" "$BASE/obstacles/toss-paper")
CODE=$(echo "$RESP" | tail -1)
check "obstacles" "6.4" "Obstacles without crew_id returns 400" "400" "$CODE" "placeable_objects_spec.md"
echo ""

# ==========================================
# JOURNEY 7: Admin Backup
# ==========================================
echo "Journey 7: Admin Backup"
echo "───────────────────────"

# Check if admin backup endpoints exist (they require BACKUP_BUCKET env on server)
ADMIN_CHECK=$(curl -s -w "%{http_code}" -o /dev/null "$BASE/admin/backup/list" -H "Authorization: Bearer ${ADMIN_TOKEN:-none}" 2>/dev/null)

if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_CHECK" != "404" ]; then
  # 7.1 Download backup
  RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/backup/download" \
    -H "Authorization: Bearer $ADMIN_TOKEN" -o /dev/null)
  CODE=$(echo "$RESP" | tail -1)
  check "admin" "7.1" "Download backup returns 200" "200" "$CODE" "READMEDB.md"

  # 7.2 List backups
  RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/backup/list" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  CODE=$(echo "$RESP" | tail -1)
  check "admin" "7.2" "List backups returns 200" "200" "$CODE" "READMEDB.md"

  # 7.3 Backup without token
  RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/backup/list")
  CODE=$(echo "$RESP" | tail -1)
  check "admin" "7.3" "Backup without token returns 401" "401" "$CODE" "READMEDB.md"

  # 7.4 Backup with wrong token
  RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/backup/list" \
    -H "Authorization: Bearer wrongtoken")
  CODE=$(echo "$RESP" | tail -1)
  check "admin" "7.4" "Backup with bad token returns 401" "401" "$CODE" "READMEDB.md"
else
  local_msg="server missing backup endpoints (local dev)"
  [ -z "$ADMIN_TOKEN" ] && local_msg="PAPER_ADMIN_TOKEN not set"
  record "admin" "7.1" "Download backup" "skip" "$local_msg" "READMEDB.md"
  record "admin" "7.2" "List backups" "skip" "$local_msg" "READMEDB.md"
  record "admin" "7.3" "Backup without token returns 401" "skip" "$local_msg" "READMEDB.md"
  record "admin" "7.4" "Backup with bad token returns 401" "skip" "$local_msg" "READMEDB.md"
fi
echo ""

# ==========================================
# JOURNEY 8: Waitlist (Invite-Only) — Not Yet Implemented
# ==========================================
echo "Journey 8: Waitlist (Not Yet Implemented)"
echo "──────────────────────────────────────────"

record "waitlist" "8.1" "Submit access request" "skip" "not implemented" "invite_only_spec.md"
record "waitlist" "8.2" "Request requires reason (20-500 chars)" "skip" "not implemented" "invite_only_spec.md"
record "waitlist" "8.3" "Request returns waitlist position" "skip" "not implemented" "invite_only_spec.md"
record "waitlist" "8.4" "Check waitlist status by email" "skip" "not implemented" "invite_only_spec.md"
record "waitlist" "8.5" "Duplicate email request rejected" "skip" "not implemented" "invite_only_spec.md"
record "waitlist" "8.6" "Rate limit: 1 request per email per 7 days" "skip" "not implemented" "invite_only_spec.md"
record "waitlist" "8.7" "Waitlisted user cannot access crews" "skip" "not implemented" "invite_only_spec.md"
record "waitlist" "8.8" "Waitlisted user cannot play games" "skip" "not implemented" "invite_only_spec.md"
record "waitlist" "8.9" "Approved user can log in normally" "skip" "not implemented" "invite_only_spec.md"
echo ""

# ==========================================
# JOURNEY 9: Admin Waitlist Review — Not Yet Implemented
# ==========================================
echo "Journey 9: Admin Waitlist Review (Not Yet Implemented)"
echo "──────────────────────────────────────────────────────"

record "admin-waitlist" "9.1" "List pending requests (admin)" "skip" "not implemented" "invite_only_spec.md"
record "admin-waitlist" "9.2" "Approve request creates user account" "skip" "not implemented" "invite_only_spec.md"
record "admin-waitlist" "9.3" "Reject request removes from queue" "skip" "not implemented" "invite_only_spec.md"
record "admin-waitlist" "9.4" "Star a request" "skip" "not implemented" "invite_only_spec.md"
record "admin-waitlist" "9.5" "AI review writes recommendations" "skip" "not implemented" "invite_only_spec.md"
record "admin-waitlist" "9.6" "AI recommendation stored per request" "skip" "not implemented" "invite_only_spec.md"
record "admin-waitlist" "9.7" "Admin stats endpoint" "skip" "not implemented" "invite_only_spec.md"
record "admin-waitlist" "9.8" "Waitlist admin requires ADMIN_TOKEN" "skip" "not implemented" "invite_only_spec.md"
echo ""

# ==========================================
# JOURNEY 10: Invite Codes — Not Yet Implemented
# ==========================================
echo "Journey 10: Invite Codes (Not Yet Implemented)"
echo "───────────────────────────────────────────────"

record "invite-codes" "10.1" "Generate invite codes for approved user" "skip" "not implemented" "invite_only_spec.md"
record "invite-codes" "10.2" "2 codes per player per season" "skip" "not implemented" "invite_only_spec.md"
record "invite-codes" "10.3" "Signup with invite code skips waitlist" "skip" "not implemented" "invite_only_spec.md"
record "invite-codes" "10.4" "Invite code is single-use" "skip" "not implemented" "invite_only_spec.md"
record "invite-codes" "10.5" "Expired invite code rejected" "skip" "not implemented" "invite_only_spec.md"
record "invite-codes" "10.6" "Invited-by tracked on user profile" "skip" "not implemented" "invite_only_spec.md"
record "invite-codes" "10.7" "List user's invite codes" "skip" "not implemented" "invite_only_spec.md"
echo ""

# ==========================================
# Write results JSON
# ==========================================
RESULTS="$RESULTS]"
echo "$RESULTS" > "$RESULTS_FILE"

# Summary
TOTAL=$((PASS + FAIL + SKIP))
echo "═══════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed, $SKIP skipped (of $TOTAL)"
echo "  Results saved to $RESULTS_FILE"
echo "═══════════════════════════════════════"

[ $FAIL -eq 0 ] && exit 0 || exit 1
