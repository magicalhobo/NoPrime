#!/usr/bin/env bash
# Bundle the extension for Chrome, Firefox, and Safari.
# Usage: ./bundle.sh [chrome|firefox|safari|all]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
VERSION=$(grep '"version"' "$ROOT/extension/manifest.json" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
BUILD="$ROOT/build"
mkdir -p "$BUILD"

# ── Chrome / Edge ────────────────────────────────────────────────────────
build_chrome() {
  local OUT="$BUILD/no-prime-chrome-v${VERSION}.zip"
  rm -f "$OUT"
  (cd "$ROOT/extension" && zip -r "$OUT" . -x '.*' '__MACOSX/*')
  echo "✓ Chrome/Edge: $OUT ($(du -h "$OUT" | cut -f1))"
}

# ── Firefox ──────────────────────────────────────────────────────────────
build_firefox() {
  local OUT="$BUILD/no-prime-firefox-v${VERSION}.zip"
  local TMP="$BUILD/_firefox_tmp"
  rm -rf "$TMP" "$OUT"
  cp -R "$ROOT/extension" "$TMP"

  # Patch manifest for Firefox compatibility
  node -e "
    const fs = require('fs');
    const p = process.argv[1] + '/manifest.json';
    const m = JSON.parse(fs.readFileSync(p, 'utf8'));

    // Firefox MV3 uses background.scripts (event page), not service_worker
    if (m.background && m.background.service_worker) {
      m.background = { scripts: [m.background.service_worker] };
    }

    m.browser_specific_settings = {
      gecko: {
        id: 'noprime@magicalhobo.com',
        strict_min_version: '109.0',
        data_collection_permissions: {
          required: ['none']
        }
      }
    };

    fs.writeFileSync(p, JSON.stringify(m, null, 2) + '\n');
  " "$TMP"

  (cd "$TMP" && zip -r "$OUT" . -x '.*' '__MACOSX/*')
  rm -rf "$TMP"
  echo "✓ Firefox:     $OUT ($(du -h "$OUT" | cut -f1))"
}

# ── Safari ───────────────────────────────────────────────────────────────
build_safari() {
  if ! command -v xcrun &>/dev/null; then
    echo "⊘ Safari: skipped (Xcode not installed)"
    return
  fi

  local SAFARI_DIR="$BUILD/NoPrime-Safari"
  rm -rf "$SAFARI_DIR"

  xcrun safari-web-extension-converter "$ROOT/extension" \
    --project-location "$BUILD" \
    --app-name "NoPrime-Safari" \
    --bundle-identifier "org.noprime.extension" \
    --no-open \
    --force

  echo "✓ Safari:      $SAFARI_DIR/ (open in Xcode to build)"
}

# ── Main ─────────────────────────────────────────────────────────────────
TARGET="${1:-all}"
case "$TARGET" in
  chrome)  build_chrome ;;
  firefox) build_firefox ;;
  safari)  build_safari ;;
  all)
    build_chrome
    build_firefox
    build_safari
    ;;
  *)
    echo "Usage: $0 [chrome|firefox|safari|all]"
    exit 1
    ;;
esac
