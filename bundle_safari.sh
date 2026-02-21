#!/usr/bin/env bash
# Bundle the extension for Safari.
# Usage: ./bundle_safari.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BUILD="$ROOT/build"
mkdir -p "$BUILD"

if ! command -v xcrun &>/dev/null; then
  echo "⊘ Safari: skipped (Xcode not installed)"
  exit 1
fi

SAFARI_DIR="$BUILD/NoPrime-Safari"
rm -rf "$SAFARI_DIR"

xcrun safari-web-extension-converter "$ROOT/extension" \
  --project-location "$BUILD" \
  --app-name "NoPrime-Safari" \
  --bundle-identifier "com.peasantprime.extension" \
  --no-open \
  --force

# Build the macOS app (ad-hoc signed so no Developer account is needed)
xcodebuild \
  -project "$SAFARI_DIR/NoPrime-Safari.xcodeproj" \
  -scheme "NoPrime-Safari (macOS)" \
  -configuration Release \
  -derivedDataPath "$BUILD/safari-derived" \
  CODE_SIGN_IDENTITY="-"

# Package the .app into a zip
APP=$(find "$BUILD/safari-derived" -name 'NoPrime-Safari.app' -type d | head -1)
if [[ -n "$APP" ]]; then
  VERSION=$(grep '"version"' "$ROOT/extension/manifest.json" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
  OUT="$BUILD/no-prime-safari-v${VERSION}.zip"
  rm -f "$OUT"
  ditto -c -k --keepParent "$APP" "$OUT"
  echo "✓ Safari:      $OUT ($(du -h "$OUT" | cut -f1))"
else
  echo "✗ Safari: build succeeded but .app not found"
  exit 1
fi
