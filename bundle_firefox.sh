#!/usr/bin/env bash
# Bundle the extension for Firefox.
# Usage: ./bundle_firefox.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
VERSION=$(grep '"version"' "$ROOT/extension/manifest.json" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
BUILD="$ROOT/build"
mkdir -p "$BUILD"

OUT="$BUILD/no-prime-firefox-v${VERSION}.zip"
TMP="$BUILD/_firefox_tmp"
rm -rf "$TMP" "$OUT"
cp -R "$ROOT/extension" "$TMP"

# Patch manifest: Firefox MV3 uses background.scripts, not service_worker
node -e "
  const fs = require('fs');
  const p = process.argv[1] + '/manifest.json';
  const m = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (m.background && m.background.service_worker) {
    m.background = { scripts: [m.background.service_worker] };
  }
  fs.writeFileSync(p, JSON.stringify(m, null, 2) + '\n');
" "$TMP"

(cd "$TMP" && zip -r "$OUT" . -x '.*' '__MACOSX/*')
rm -rf "$TMP"
echo "✓ Firefox:     $OUT ($(du -h "$OUT" | cut -f1))"
