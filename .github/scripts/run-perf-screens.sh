#!/bin/bash

# Profiles each performance screen flow with Flashlight, one at a time.
#
# Must live in its own file (not inline in the workflow's emulator-runner
# `script:` block): reactivecircus/android-emulator-runner splits that block on
# newlines and runs each line via a separate `sh -c`, so multi-line constructs
# (for loops, function definitions, backslash continuations) are impossible
# there. Invoking this script is a single line, so it runs as one shell.
#
# Usage: run-perf-screens.sh <apk-path>

set -u

APK_PATH="$1"
FLASHLIGHT="$HOME/.flashlight/bin/flashlight"
SCREENS_DIR="tests/e2e/cases/performance/screens"

sleep 10
echo "🔄 Waiting for device..."
adb wait-for-device

adb install "$APK_PATH"

mkdir -p perf-results perf-reports maestro_logs_performance

run_screen() {
  local case="$1"
  local name="$2"
  "$FLASHLIGHT" test \
    --bundleId "com.recipedia" \
    --testCommand "maestro test $case --debug-output=maestro_logs_performance/$name" \
    --resultsFilePath "perf-results/$name.json" \
    --duration 300000 \
    --iterationCount 3
}

# 00_seed runs first (clearState seeds the DB); the warm screens reuse that
# seeded DB, so screens must run in filename order. Each screen is profiled with
# 3 iterations (averages out noise). --duration is a per-iteration cap; 5 min
# covers the heaviest flow (parameters re-scales all ~1200 recipes) and
# flashlight stops early when a flow finishes.
for case in "$SCREENS_DIR"/*.yaml; do
  name=$(basename "$case" .yaml)
  echo "▶ $name"
  # One retry absorbs transient flakiness (e.g. an ANR dialog); on a second
  # failure we move on so the remaining screens still run.
  run_screen "$case" "$name" \
    || { echo "::warning::retrying $name"; run_screen "$case" "$name" || echo "::warning::$name failed"; }
  "$FLASHLIGHT" report \
    --resultsFilePath "perf-results/$name.json" \
    --outputFilePath "perf-reports/$name.html" || true
done
