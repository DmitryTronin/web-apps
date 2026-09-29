#!/usr/bin/env bash
# Startup script for the web-apps static word search game.
# Serves the repository root over HTTP on port 8000 (exposed by default).
set -euo pipefail

if [ "${AIR_STARTUP_MODE:-}" = warmup ]; then WARMUP=1; else WARMUP=; fi

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${PORT:-8000}"
LOG=/tmp/web-apps-server.log

cd "$REPO_DIR"

if command -v node >/dev/null 2>&1; then
  echo "[startup] Checking game.js syntax with node $(node --version)"
  node --check game.js
fi

if curl -fsS -o /dev/null "http://localhost:${PORT}/index.html" 2>/dev/null; then
  echo "[startup] Server already answering on port ${PORT}"
else
  echo "[startup] Starting static server on 0.0.0.0:${PORT} (log: ${LOG})"
  nohup python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$REPO_DIR" >"$LOG" 2>&1 &
fi

healthcheck() {
  echo "[healthcheck] Waiting for http://localhost:${PORT}/ to serve the game"
  local n=0
  until body="$(curl -fsS -H 'Host: preview.example.com' "http://localhost:${PORT}/" 2>/dev/null)" \
      && grep -q '<title>Word Search</title>' <<<"$body"; do
    n=$((n + 1))
    if [ $((n % 10)) -eq 0 ]; then echo "[healthcheck] still waiting (${n}s)"; tail -n 5 "$LOG" 2>/dev/null || true; fi
    sleep 1
  done
  for f in game.js styles.css; do
    curl -fsS -o /dev/null "http://localhost:${PORT}/${f}" || { echo "[healthcheck] ${f} not served"; return 1; }
  done
  echo "[healthcheck] OK: index.html, game.js and styles.css are served"
}

if [ -n "${WARMUP:-}" ]; then healthcheck; fi
echo "[startup] Done"
