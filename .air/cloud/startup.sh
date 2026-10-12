#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${PORT:-8000}"
LOG_FILE="/tmp/web-apps-http-server.log"

log() {
  printf '[startup] %s\n' "$*"
}

healthcheck() {
  log "Waiting for the web app on port ${PORT}"
  while true; do
    response="$(curl --silent --show-error --fail "http://127.0.0.1:${PORT}/" 2>/dev/null || true)"
    if [[ "$response" == *"<title>Word Search</title>"* ]] &&
      curl --silent --show-error --fail "http://127.0.0.1:${PORT}/styles.css" >/dev/null 2>&1; then
      log "Web app is ready"
      return 0
    fi
    log "Web app is not ready yet; checking again"
    sleep 1
  done
}

log "Starting the static web server from ${ROOT_DIR}"
nohup python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$ROOT_DIR" >"$LOG_FILE" 2>&1 &

if [[ "${AIR_STARTUP_MODE:-}" == "warmup" ]]; then
  healthcheck
else
  log "Task mode: server started in the background"
fi
