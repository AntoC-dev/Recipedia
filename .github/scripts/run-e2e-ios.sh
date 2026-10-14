#!/bin/bash

set -e

SUITE="$1"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/e2e-credentials.sh"
maestro_credential_args "$SUITE"

echo "🚀 Running E2E tests on iOS simulator for suite: $SUITE ..."
npm run install:ios

# Workaround for mobile-dev-inc/maestro#3538 — remove when fixed: once the XCTest driver
# latches as unreachable, every later flow of the process fails; a fresh process restarts it.
DRIVER_LATCH='Transport unreachable while processing .*, latching'
# The run step times out at 200 min; leave room for a rerun to finish.
RERUN_DEADLINE_SECONDS=9000

run_maestro() {
  local target="$1"
  shift
  maestro test "$target" \
    --config="tests/e2e/${SUITE}.yaml" \
    "$@" \
    --format junit -s 1 \
    "${MAESTRO_CREDENTIAL_ARGS[@]}"
}

rerun_failed_flows() {
  local flow_files flow_file flow_id status=0

  flow_files=$(grep -so '<testcase [^>]*status="ERROR"' report.xml | sed -E 's/.* file="([^"]*)".*/\1/')
  if [ -z "$flow_files" ]; then
    echo "::warning::report.xml lists no failed flow to rerun"
    return 1
  fi

  while IFS= read -r flow_file; do
    if [ "$SECONDS" -gt "$RERUN_DEADLINE_SECONDS" ]; then
      echo "::warning::Skipping the remaining reruns: the step is close to its timeout"
      return 1
    fi
    flow_id=$(basename "$flow_file" .yaml)
    echo "🔁 Rerunning $flow_file in a fresh Maestro process..."
    run_maestro "$flow_file" \
      --debug-output="maestro_logs_${SUITE}/rerun-${flow_id}" --flatten-debug-output \
      --output="report-rerun-${flow_id}.xml" < /dev/null || status=1
  done <<< "$flow_files"

  return $status
}

MAESTRO_EXIT=0
run_maestro tests/e2e/ --debug-output="maestro_logs_${SUITE}" || MAESTRO_EXIT=$?

if [ "$MAESTRO_EXIT" -ne 0 ] && grep -rqsE --include=maestro.log "$DRIVER_LATCH" "maestro_logs_${SUITE}"; then
  echo "::warning::Maestro XCTest driver latched; rerunning failed flows"
  rerun_failed_flows && MAESTRO_EXIT=0
fi

exit "$MAESTRO_EXIT"
