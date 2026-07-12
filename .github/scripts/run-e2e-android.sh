#!/bin/bash

set -e

SUITE="$1"

echo "🔄 Waiting for device..."
adb wait-for-device

echo "🛡️  Suppressing system error/ANR dialogs and disabling animations..."
adb shell settings put global hide_error_dialogs 1
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0

adb logcat -c

echo "🚀 Running E2E tests on suite: $SUITE ..."
npm run install:android

set +e
maestro test tests/e2e/ \
  --config="tests/e2e/${SUITE}.yaml" \
  --debug-output="maestro_logs_${SUITE}" \
  --format junit -s 1 \
  -e QUITOQUE_USERNAME="${QUITOQUE_USERNAME}" \
  -e QUITOQUE_PASSWORD="${QUITOQUE_PASSWORD}"
MAESTRO_EXIT=$?
set -e

bash .github/scripts/collect-android-logs.sh "$SUITE"

exit $MAESTRO_EXIT
