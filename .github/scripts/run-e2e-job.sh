#!/bin/bash
# Usage: run-e2e-job.sh <android|ios> <job>
# A job is one suite or several joined by "+" (see e2e-matrix.mjs), run one after another on
# the same device. Every suite runs even after a failure; the job fails if any suite failed.

set -u

PLATFORM="${1:-}"
JOB="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "$JOB" ]; then
  echo "Usage: run-e2e-job.sh <android|ios> <job>"
  exit 2
fi

if [ "$PLATFORM" != android ] && [ "$PLATFORM" != ios ]; then
  echo "❌ Unknown platform \"$PLATFORM\", expected android or ios"
  exit 2
fi

# The run step times out at 200 min; leave room for a rerun to finish (run-e2e-ios.sh).
export E2E_RERUN_DEADLINE=$(( $(date +%s) + 9000 ))

# The first `simctl addmedia` on a fresh simulator can outlast Maestro's hardcoded 5 min addMedia
# timeout, which retry cannot catch. Absorb it here, overlapped with the install. Each photo case
# deletes the warm-up photo in its own cleanup.
WARM_UP_PHOTO=tests/assets/pouletSatay/title.jpg
WARM_UP_TIMEOUT=${E2E_PHOTOS_WARM_UP_TIMEOUT:-900}
WARM_UP_PID=""
if [ "$PLATFORM" = ios ] && jq -e --arg job "$JOB" \
  'any(.[]; .usesPhotos and ([.name] | inside($job | split("+"))))' \
  .github/e2e-suites.json > /dev/null; then
  echo "📸 Warming up the simulator Photos library..."
  WARM_UP_START=$(date +%s)
  perl -e 'alarm shift; exec @ARGV' "$WARM_UP_TIMEOUT" xcrun simctl addmedia booted "$WARM_UP_PHOTO" &
  WARM_UP_PID=$!
  trap 'kill "$WARM_UP_PID" 2>/dev/null' EXIT
fi

# Once per job: every flow's clearState resets the app, and install:android deletes the APK.
npm run "install:${PLATFORM}" || exit $?

if [ -n "$WARM_UP_PID" ]; then
  WARM_UP_EXIT=0
  wait "$WARM_UP_PID" || WARM_UP_EXIT=$?
  [ "$WARM_UP_EXIT" -eq 142 ] && echo "::warning::Photos library warm-up stopped after ${WARM_UP_TIMEOUT}s"
  [ "$WARM_UP_EXIT" -ne 0 ] && [ "$WARM_UP_EXIT" -ne 142 ] && echo "::warning::Photos library warm-up failed"
  echo "📸 Photos library warm-up took $(( $(date +%s) - WARM_UP_START ))s"
fi

JOB_EXIT=0
for SUITE in ${JOB//+/ }; do
  SUITE_EXIT=0
  bash "$SCRIPT_DIR/run-e2e-${PLATFORM}.sh" "$SUITE" || SUITE_EXIT=$?
  if [ "$SUITE_EXIT" -ne 0 ]; then
    echo "::error::Suite $SUITE failed (exit $SUITE_EXIT)"
    JOB_EXIT=$SUITE_EXIT
  fi
done

exit "$JOB_EXIT"
