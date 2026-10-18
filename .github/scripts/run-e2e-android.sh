#!/bin/bash

set -e

SUITE="$1"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/e2e-credentials.sh"
maestro_credential_args "$SUITE"

echo "🔄 Waiting for device..."
adb wait-for-device

echo "🛡️  Suppressing system error/ANR dialogs and disabling animations..."
adb shell settings put global hide_error_dialogs 1
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0

adb logcat -c

# Stream the app's log for the whole run: clearState wipes the in-app file log on every launch.
APP_STREAM_FILE="app-stream-${SUITE}.txt"
adb logcat -v threadtime -s ReactNativeJS:V > "$APP_STREAM_FILE" &
STREAM_PID=$!

collect_logs_and_stop_stream() {
  local exit_code=$?
  sleep 2
  kill "$STREAM_PID" 2>/dev/null || true
  wait "$STREAM_PID" 2>/dev/null || true
  bash .github/scripts/collect-android-logs.sh "$SUITE" || true
  exit "$exit_code"
}
trap collect_logs_and_stop_stream EXIT

echo "🚀 Running E2E tests on suite: $SUITE ..."
npm run install:android

maestro test tests/e2e/ \
  --config="tests/e2e/${SUITE}.yaml" \
  --debug-output="maestro_logs_${SUITE}" \
  --format junit -s 1 \
  "${MAESTRO_CREDENTIAL_ARGS[@]}"
