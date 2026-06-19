#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
mkdir -p "$ROOT/storage"
node "$ROOT/scripts/audit.mjs" >> "$ROOT/storage/audit.log" 2>&1
