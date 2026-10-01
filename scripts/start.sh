#!/bin/bash
# Start Jira Time Tracker: pull latest main, then run the server.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

echo "[start] $(date '+%Y-%m-%d %H:%M:%S') cwd=$ROOT"
if command -v git >/dev/null 2>&1 && [ -d "$ROOT/.git" ]; then
  if git pull --ff-only origin main; then
    echo "[start] git pull ok"
  else
    echo "[start] git pull failed — starting with local tree" >&2
  fi
else
  echo "[start] skip git pull (no git / not a clone)" >&2
fi

exec node server.js
