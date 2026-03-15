#!/usr/bin/env bash
set -euo pipefail

# Install/update deps if node_modules is empty or stale
if [[ ! -f "node_modules/.package-lock.json" ]] || \
   [[ "package-lock.json" -nt "node_modules/.package-lock.json" ]]; then
    echo "==> Installing npm dependencies..."
    npm ci
fi

exec "$@"
