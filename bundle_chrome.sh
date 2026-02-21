#!/usr/bin/env bash
# Bundle the extension for Chrome / Edge.
# Usage: ./bundle_chrome.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
VERSION=$(grep '"version"' "$ROOT/extension/manifest.json" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
BUILD="$ROOT/build"
mkdir -p "$BUILD"

OUT="$BUILD/no-prime-chrome-v${VERSION}.zip"
rm -f "$OUT"
(cd "$ROOT/extension" && zip -r "$OUT" . -x '.*' '__MACOSX/*')
echo "✓ Chrome/Edge: $OUT ($(du -h "$OUT" | cut -f1))"
