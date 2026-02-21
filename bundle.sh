#!/usr/bin/env bash
# Bundle the extension for Chrome, Firefox, and Safari.
# Usage: ./bundle.sh [chrome|firefox|safari|all]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

TARGET="${1:-all}"
case "$TARGET" in
  chrome)  "$ROOT/bundle_chrome.sh" ;;
  firefox) "$ROOT/bundle_firefox.sh" ;;
  safari)  "$ROOT/bundle_safari.sh" ;;
  all)
    "$ROOT/bundle_chrome.sh"
    "$ROOT/bundle_firefox.sh"
    "$ROOT/bundle_safari.sh"
    ;;
  *)
    echo "Usage: $0 [chrome|firefox|safari|all]"
    exit 1
    ;;
esac
