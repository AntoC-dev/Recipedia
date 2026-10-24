#!/usr/bin/env bash
# Boots the simulator CI uses, read from the E2E workflow so local runs never drift from CI.
# Resolving through the runtime matters: `simctl boot '<model>'` picks whichever device simctl
# lists first, which may be an older iOS.
set -euo pipefail

E2E_WORKFLOW="$(dirname "$0")/../.github/workflows/e2e-maestro.yml"

read_workflow_value() {
  sed -n "s/^[[:space:]]*$1:[[:space:]]*['\"]\{0,1\}\([^'\"]*\)['\"]\{0,1\}[[:space:]]*$/\1/p" "$E2E_WORKFLOW" | head -1
}

IOS_VERSION="${IOS_VERSION:-$(read_workflow_value os_version)}"
DEVICE_MODEL="${DEVICE_MODEL:-$(read_workflow_value model)}"

UDID=$(xcrun simctl list devices available --json | node -e '
  const { devices } = JSON.parse(require("fs").readFileSync(0, "utf8"));
  const runtime = Object.keys(devices).find(k => k.endsWith(`iOS-${process.argv[1].replace(/\./g, "-")}`));
  // Prefix match: devices are often renamed ("iPhone 17e (iOS 26.4)").
  const match = (devices[runtime] || []).find(d => d.name.startsWith(process.argv[2]));
  process.stdout.write(match ? match.udid : "");
' "$IOS_VERSION" "$DEVICE_MODEL")

if [ -z "$UDID" ]; then
  echo "❌ No available '$DEVICE_MODEL' on iOS $IOS_VERSION." >&2
  echo "   Install that runtime in Xcode, or override: IOS_VERSION=26.5 npm run boot:ios-simulator" >&2
  exit 1
fi

echo "🚀 Booting $DEVICE_MODEL (iOS $IOS_VERSION) — $UDID"
xcrun simctl bootstatus "$UDID" -b
