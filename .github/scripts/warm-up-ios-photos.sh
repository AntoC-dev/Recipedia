#!/bin/bash
# Usage: warm-up-ios-photos.sh <photo>
#
# Absorbs the slow first Photos work of a fresh simulator before the suites run, since
# Maestro's addMedia has a hardcoded 5 min timeout that retry cannot catch:
# - the first `simctl addmedia` is slow;
# - once the Photos app has opened its library, assetsd runs a background "post migration
#   actions" pass (473s seen in CI) that blocks every addmedia until it completes.
# Run it under an alarm (run-e2e-job.sh): SIGALRM exits 142 and stops the pending command.

PHOTO=$1
PHOTOS_APP=com.apple.mobileslideshow
OPEN_SECONDS=${E2E_PHOTOS_OPEN_SECONDS:-90}
MIGRATION_START_GRACE=${E2E_PHOTOS_MIGRATION_START_GRACE:-120}
MIGRATION_LOG=$(mktemp)
trap 'kill $STREAM_PID $CHILD_PID 2>/dev/null; rm -f "$MIGRATION_LOG"' EXIT
trap 'exit 142' ALRM
trap 'exit 143' TERM

# A foreground command would delay the alarm trap until it returns; `wait` does not.
run() {
  "$@" &
  CHILD_PID=$!
  wait "$CHILD_PID"
}

xcrun simctl spawn booted log stream --style compact \
  --predicate 'process == "assetsd" AND eventMessage CONTAINS "post migration actions"' \
  > "$MIGRATION_LOG" 2>/dev/null &
STREAM_PID=$!

run xcrun simctl addmedia booted "$PHOTO" || exit $?
run xcrun simctl launch booted "$PHOTOS_APP" > /dev/null || exit $?
run sleep "$OPEN_SECONDS"
run xcrun simctl terminate booted "$PHOTOS_APP"

# assetsd runs several passes, some short: wait out the grace, then until none is running.
SECONDS=0
while :; do
  STARTED=$(grep -c "Start of post migration actions" "$MIGRATION_LOG")
  COMPLETED=$(grep -c "Completed post migration actions" "$MIGRATION_LOG")
  [ "$SECONDS" -ge "$MIGRATION_START_GRACE" ] && [ "$COMPLETED" -ge "$STARTED" ] && break
  run sleep 1
done

if [ "$STARTED" -eq 0 ]; then
  echo "::warning::No Photos library migration started; its log lines may have changed"
else
  echo "📸 Photos library migration completed"
fi
