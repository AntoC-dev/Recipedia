#!/usr/bin/env bash
# Boots the iPhone 16e on the iOS version CI uses. Resolving through the runtime matters:
# `simctl boot 'iPhone 16e'` picks whichever device simctl lists first, which may be an older iOS.
set -euo pipefail

IOS_VERSION="${IOS_VERSION:-26.2}"
DEVICE_MODEL="${DEVICE_MODEL:-iPhone 16e}"

UDID=$(xcrun simctl list devices available --json | node -e '
  const { devices } = JSON.parse(require("fs").readFileSync(0, "utf8"));
  const runtime = Object.keys(devices).find(k => k.endsWith(`iOS-${process.argv[1].replace(/\./g, "-")}`));
  // Prefix match: devices are often renamed ("iPhone 16e (iOS 26.2)").
  const match = (devices[runtime] || []).find(d => d.name.startsWith(process.argv[2]));
  process.stdout.write(match ? match.udid : "");
' "$IOS_VERSION" "$DEVICE_MODEL")

if [ -z "$UDID" ]; then
  echo "❌ No available '$DEVICE_MODEL' on iOS $IOS_VERSION." >&2
  echo "   Install that runtime in Xcode, or override: IOS_VERSION=18.6 npm run boot:ios-simulator" >&2
  exit 1
fi

echo "🚀 Booting $DEVICE_MODEL (iOS $IOS_VERSION) — $UDID"
xcrun simctl bootstatus "$UDID" -b
