#!/usr/bin/env bash
# The judge. A feature is "passing" only when this script exits 0.
# Usage: tools/verify.sh            (from the repo root)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
step() { printf '\n\033[1m▶ %s\033[0m\n' "$1"; }

step "1/5 App unit tests (F1 engine, F2 merge/fallback, F7 history, F10 limit)"
npm test --prefix app --silent

step "2/5 Worker tests (F2 Claude proxy)"
npm test --prefix worker --silent

step "3/5 Typecheck + production build"
(cd app && VITE_API_URL=https://api.mock.test npm run build --silent >/dev/null && echo "build OK")

step "4/5 Static checks (F9 tracking plan, F11 manifest, secrets, copy)"
python3 tools/check_static.py

step "5/5 E2E in headless Chrome (F3–F10), screenshots → docs/screenshots"
(cd app && npx vite preview --port 4173 --strictPort >/tmp/scamcheck-preview.log 2>&1 &)
for i in $(seq 1 30); do curl -sf http://localhost:4173 >/dev/null && break; sleep 0.5; done
set +e
python3 app/tests/e2e/e2e.py http://localhost:4173 docs/screenshots
E2E=$?
set -e
pkill -f "vite preview --port 4173" || true
[ $E2E -eq 0 ] || { echo "E2E FAILED"; exit 1; }

printf '\n\033[32m✔ VERIFY PASSED\033[0m\n'
