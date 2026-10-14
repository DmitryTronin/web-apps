#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8000}"
WARMUP=""
if [ "${AIR_STARTUP_MODE:-}" = "warmup" ]; then
  WARMUP=1
fi

log() {
  printf '[startup] %s\n' "$*"
}

healthcheck() {
  log "waiting for the static app on port ${PORT}"
  while ! curl --fail --silent --show-error "http://127.0.0.1:${PORT}/" | grep -q "Word Search"; do
    sleep 2
  done
  log "static app is serving the Word Search page"
}

log "starting static web server on port ${PORT}"
python3 -m http.server "${PORT}" --bind 0.0.0.0 >/tmp/web-apps-http.log 2>&1 &

if [ -n "${WARMUP}" ]; then
  healthcheck
fi
