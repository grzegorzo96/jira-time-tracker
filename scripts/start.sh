#!/bin/bash
# Start Jira Time Tracker: sync to origin/main (even after history rewrite), then run the server.
# Local uncommitted changes in tracked files are discarded. Ignored paths (data/) are kept.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

echo "[start] $(date '+%Y-%m-%d %H:%M:%S') cwd=$ROOT"
if command -v git >/dev/null 2>&1 && [ -d "$ROOT/.git" ]; then
  if git fetch origin main && git reset --hard origin/main; then
    echo "[start] synced to origin/main ($(git rev-parse --short HEAD))"
  else
    echo "[start] git sync failed — starting with local tree" >&2
  fi
else
  echo "[start] skip git sync (no git / not a clone)" >&2
fi

exec node server.js
