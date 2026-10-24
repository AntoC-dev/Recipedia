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

# Once per job: every flow's clearState resets the app, and install:android deletes the APK.
npm run "install:${PLATFORM}" || exit $?

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
