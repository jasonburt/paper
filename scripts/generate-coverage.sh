#!/bin/bash
# Generate a static HTML test coverage report from test-results.json
# Usage: ./scripts/generate-coverage.sh

RESULTS_FILE="scripts/test-results.json"
OUTPUT_FILE="test-coverage.html"

if [ ! -f "$RESULTS_FILE" ]; then
  echo "No results file found. Run tests first: npm run test:journeys"
  exit 1
fi

# Count results
TOTAL=$(python3 -c "import json; print(len(json.load(open('$RESULTS_FILE'))))")
PASSED=$(python3 -c "import json; print(len([r for r in json.load(open('$RESULTS_FILE')) if r['status']=='pass']))")
FAILED=$(python3 -c "import json; print(len([r for r in json.load(open('$RESULTS_FILE')) if r['status']=='fail']))")
SKIPPED=$(python3 -c "import json; print(len([r for r in json.load(open('$RESULTS_FILE')) if r['status']=='skip']))")

# Generate HTML
python3 -c "
import json
from datetime import datetime

results = json.load(open('$RESULTS_FILE'))

journeys = {}
for r in results:
    j = r['journey']
    if j not in journeys:
        journeys[j] = []
    journeys[j].append(r)

journey_labels = {
    'signup': 'Journey 1: New User Signup & Login',
    'profile': 'Journey 2: Profile Management',
    'crew': 'Journey 3: Crew Creation & Management',
    'join': 'Journey 4: Crew Join & Members',
    'scores': 'Journey 5: Scores & Leaderboard',
    'obstacles': 'Journey 6: Obstacles',
    'admin': 'Journey 7: Admin Backup',
    'waitlist': 'Journey 8: Waitlist (Invite-Only)',
    'admin-waitlist': 'Journey 9: Admin Waitlist Review',
    'invite-codes': 'Journey 10: Invite Codes',
}

journey_descriptions = {
    'signup': 'New user signs up with email, logs in again, validates session, handles edge cases.',
    'profile': 'User updates icon, color, username. Auth enforcement on profile changes.',
    'crew': 'Create a crew, get invite code, retrieve crew details, handle errors.',
    'join': 'Second user joins crew via invite code, crew membership, leaving crew.',
    'scores': 'Post scores to leaderboard, filter by crew, auth enforcement.',
    'obstacles': 'Place obstacles in crew games, retrieve them, validate inputs.',
    'admin': 'Admin backup endpoints — download, list, auth enforcement.',
    'waitlist': 'Access request submission, waitlist position, status checking, access blocking.',
    'admin-waitlist': 'Admin review of pending requests, approve/reject, AI recommendations.',
    'invite-codes': 'Invite code generation, redemption, single-use enforcement, expiry.',
}

journey_specs = {
    'signup': 'paper_crew_spec.md',
    'profile': 'paper_crew_spec.md',
    'crew': 'paper_crew_spec.md',
    'join': 'paper_crew_spec.md',
    'scores': 'paper_crew_spec.md',
    'obstacles': 'placeable_objects_spec.md',
    'admin': 'READMEDB.md',
    'waitlist': 'invite_only_spec.md',
    'admin-waitlist': 'invite_only_spec.md',
    'invite-codes': 'invite_only_spec.md',
}

total = len(results)
passed = len([r for r in results if r['status'] == 'pass'])
failed = len([r for r in results if r['status'] == 'fail'])
skipped = len([r for r in results if r['status'] == 'skip'])
implemented = passed + failed
pct_implemented = round(implemented / total * 100) if total else 0
pct_pass = round(passed / implemented * 100) if implemented else 0

status_icon = {'pass': '✓', 'fail': '✗', 'skip': '○'}
status_color = {'pass': '#22c55e', 'fail': '#FF4F36', 'skip': '#B0A898'}
status_bg = {'pass': '#f0fdf4', 'fail': '#fef2f2', 'skip': '#f9f9f9'}

now = datetime.now().strftime('%B %d, %Y at %I:%M %p')

rows = ''
for jkey in ['signup','profile','crew','join','scores','obstacles','admin','waitlist','admin-waitlist','invite-codes']:
    if jkey not in journeys:
        continue
    tests = journeys[jkey]
    j_pass = len([t for t in tests if t['status'] == 'pass'])
    j_fail = len([t for t in tests if t['status'] == 'fail'])
    j_skip = len([t for t in tests if t['status'] == 'skip'])
    j_total = len(tests)
    j_impl = j_pass + j_fail

    if j_fail > 0:
        j_badge_color = '#FF4F36'
        j_badge_text = f'{j_fail} failing'
    elif j_skip == j_total:
        j_badge_color = '#B0A898'
        j_badge_text = 'not implemented'
    elif j_skip > 0:
        j_badge_color = '#FF8F01'
        j_badge_text = f'{j_pass} pass, {j_skip} pending'
    else:
        j_badge_color = '#22c55e'
        j_badge_text = f'{j_pass}/{j_total} pass'

    test_rows = ''
    for t in tests:
        detail_html = f'<span style=\"color: #6B6B6B; font-size: 12px; margin-left: 8px;\">{t[\"detail\"]}</span>' if t['detail'] else ''
        test_rows += f'''
        <tr style=\"background: {status_bg[t['status']]};\">
          <td style=\"padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-family: monospace; font-size: 12px; color: #6B6B6B; width: 50px;\">{t['id']}</td>
          <td style=\"padding: 8px 12px; border-bottom: 1px solid #f0f0f0;\">
            <span style=\"color: {status_color[t['status']]}; font-weight: 600; margin-right: 8px;\">{status_icon[t['status']]}</span>
            {t['name']}{detail_html}
          </td>
          <td style=\"padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 12px; color: #6B6B6B;\">
            <a href=\"specs/{t['spec']}\" style=\"color: #4992FF; text-decoration: none;\">{t['spec']}</a>
          </td>
        </tr>'''

    spec_file = journey_specs.get(jkey, '')
    rows += f'''
    <div style=\"margin-bottom: 32px;\">
      <div style=\"display: flex; align-items: center; gap: 12px; margin-bottom: 4px;\">
        <h3 style=\"font-family: Georgia, serif; font-size: 20px; color: #1A1A1A; margin: 0;\">{journey_labels.get(jkey, jkey)}</h3>
        <span style=\"background: {j_badge_color}; color: white; font-size: 11px; padding: 2px 10px; border-radius: 10px;\">{j_badge_text}</span>
      </div>
      <p style=\"color: #6B6B6B; font-size: 14px; margin: 4px 0 12px 0;\">{journey_descriptions.get(jkey, '')} <a href=\"specs/{spec_file}\" style=\"color: #4992FF; text-decoration: none; font-size: 12px;\">→ {spec_file}</a></p>
      <table style=\"width: 100%; border-collapse: collapse; font-size: 14px;\">
        <thead>
          <tr style=\"border-bottom: 2px solid #e5e5e5;\">
            <th style=\"padding: 6px 12px; text-align: left; font-size: 11px; color: #B0A898; text-transform: uppercase; letter-spacing: 0.1em;\">ID</th>
            <th style=\"padding: 6px 12px; text-align: left; font-size: 11px; color: #B0A898; text-transform: uppercase; letter-spacing: 0.1em;\">Test</th>
            <th style=\"padding: 6px 12px; text-align: left; font-size: 11px; color: #B0A898; text-transform: uppercase; letter-spacing: 0.1em;\">Spec</th>
          </tr>
        </thead>
        <tbody>
          {test_rows}
        </tbody>
      </table>
    </div>'''

# Build phase coverage
phase_data = [
    ('Phase 1: Waitlist MVP', 'invite_only_spec.md', ['8.1','8.2','8.3','8.4','8.5','8.6','8.7','8.8','8.9','9.1','9.2','9.3','9.8']),
    ('Phase 2: AI-Assisted Review', 'invite_only_spec.md', ['9.4','9.5','9.6','9.7']),
    ('Phase 3: Invite Codes', 'invite_only_spec.md', ['10.1','10.2','10.3','10.4','10.5','10.6','10.7']),
    ('Phase 4: Email Notifications', 'invite_only_spec.md', []),
    ('Phase 5: Polish', 'invite_only_spec.md', []),
]

all_ids = {r['id']: r['status'] for r in results}
phase_rows = ''
for phase_name, phase_spec, test_ids in phase_data:
    if test_ids:
        p_pass = len([tid for tid in test_ids if all_ids.get(tid) == 'pass'])
        p_total = len(test_ids)
        p_impl = len([tid for tid in test_ids if all_ids.get(tid) in ('pass','fail')])
        if p_impl == 0:
            p_status = 'Not started'
            p_color = '#B0A898'
        elif p_pass == p_total:
            p_status = 'Complete'
            p_color = '#22c55e'
        else:
            p_status = f'{p_impl}/{p_total} implemented'
            p_color = '#FF8F01'
    else:
        p_status = 'No tests yet'
        p_color = '#D0D0D0'

    phase_rows += f'''
    <tr>
      <td style=\"padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-family: Georgia, serif;\">{phase_name}</td>
      <td style=\"padding: 10px 12px; border-bottom: 1px solid #f0f0f0;\">
        <span style=\"color: {p_color}; font-weight: 600;\">{p_status}</span>
      </td>
      <td style=\"padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 12px;\">
        <a href=\"specs/{phase_spec}\" style=\"color: #4992FF; text-decoration: none;\">{phase_spec}</a>
      </td>
    </tr>'''

html = f'''<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <title>Paper — Test Coverage</title>
</head>
<body style=\"margin: 0; padding: 0; background: #FFFFFF; color: #1A1A1A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\">
  <div style=\"max-width: 900px; margin: 0 auto; padding: 40px 24px;\">

    <div style=\"text-align: center; margin-bottom: 40px;\">
      <h1 style=\"font-family: Georgia, serif; font-size: 36px; letter-spacing: 0.1em; margin-bottom: 4px;\">PAPER</h1>
      <p style=\"color: #6B6B6B; font-size: 16px; margin-bottom: 24px;\">Test Coverage Report</p>
      <p style=\"color: #B0A898; font-size: 13px;\">{now}</p>
    </div>

    <hr style=\"border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;\">

    <!-- Summary Cards -->
    <div style=\"display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 40px;\">
      <div style=\"background: #f0fdf4; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08);\">
        <div style=\"font-size: 32px; font-weight: 700; color: #22c55e;\">{passed}</div>
        <div style=\"font-size: 13px; color: #6B6B6B; margin-top: 4px;\">Passed</div>
      </div>
      <div style=\"background: {'#fef2f2' if failed else '#f9f9f9'}; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08);\">
        <div style=\"font-size: 32px; font-weight: 700; color: {'#FF4F36' if failed else '#D0D0D0'};\">{failed}</div>
        <div style=\"font-size: 13px; color: #6B6B6B; margin-top: 4px;\">Failed</div>
      </div>
      <div style=\"background: #f9f9f9; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08);\">
        <div style=\"font-size: 32px; font-weight: 700; color: #B0A898;\">{skipped}</div>
        <div style=\"font-size: 13px; color: #6B6B6B; margin-top: 4px;\">Not Implemented</div>
      </div>
      <div style=\"background: #f9f9f9; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08);\">
        <div style=\"font-size: 32px; font-weight: 700; color: #1A1A1A;\">{pct_implemented}%</div>
        <div style=\"font-size: 13px; color: #6B6B6B; margin-top: 4px;\">Implemented</div>
      </div>
    </div>

    <!-- Coverage Bar -->
    <div style=\"margin-bottom: 40px;\">
      <div style=\"display: flex; height: 12px; border-radius: 6px; overflow: hidden; background: #f0f0f0;\">
        <div style=\"width: {round(passed/total*100)}%; background: #22c55e;\"></div>
        <div style=\"width: {round(failed/total*100)}%; background: #FF4F36;\"></div>
        <div style=\"width: {round(skipped/total*100)}%; background: #e5e5e5;\"></div>
      </div>
      <div style=\"display: flex; justify-content: space-between; margin-top: 6px; font-size: 12px; color: #B0A898;\">
        <span>■ Passed ({passed})</span>
        <span>■ Failed ({failed})</span>
        <span>■ Not Implemented ({skipped})</span>
      </div>
    </div>

    <hr style=\"border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;\">

    <!-- Implementation Phases -->
    <h2 style=\"font-family: Georgia, serif; font-size: 24px; color: #1A1A1A; margin-bottom: 16px;\">Implementation Phases</h2>
    <p style=\"color: #6B6B6B; font-size: 14px; margin-bottom: 20px;\">Rollout phases from <a href=\"specs/invite_only_spec.md\" style=\"color: #4992FF; text-decoration: none;\">invite_only_spec.md</a></p>
    <table style=\"width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 40px;\">
      <thead>
        <tr style=\"border-bottom: 2px solid #e5e5e5;\">
          <th style=\"padding: 8px 12px; text-align: left; font-size: 11px; color: #B0A898; text-transform: uppercase; letter-spacing: 0.1em;\">Phase</th>
          <th style=\"padding: 8px 12px; text-align: left; font-size: 11px; color: #B0A898; text-transform: uppercase; letter-spacing: 0.1em;\">Status</th>
          <th style=\"padding: 8px 12px; text-align: left; font-size: 11px; color: #B0A898; text-transform: uppercase; letter-spacing: 0.1em;\">Spec</th>
        </tr>
      </thead>
      <tbody>
        {phase_rows}
      </tbody>
    </table>

    <hr style=\"border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;\">

    <!-- User Journeys -->
    <h2 style=\"font-family: Georgia, serif; font-size: 24px; color: #1A1A1A; margin-bottom: 24px;\">User Journeys</h2>

    {rows}

    <hr style=\"border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;\">

    <p style=\"text-align: center; color: #B0A898; font-size: 12px;\">
      Generated by test-user-journeys.sh — {total} tests across {len(journeys)} user journeys
    </p>
  </div>
</body>
</html>'''

with open('$OUTPUT_FILE', 'w') as f:
    f.write(html)
print(f'Coverage report written to $OUTPUT_FILE')
"
