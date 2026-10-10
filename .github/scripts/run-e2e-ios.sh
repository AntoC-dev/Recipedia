#!/bin/bash

set -e

SUITE="$1"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/e2e-credentials.sh"
maestro_credential_args "$SUITE"

echo "🚀 Running E2E tests on iOS simulator for suite: $SUITE ..."
npm run install:ios

APP_SYSLOG_FILE="app-syslog-${SUITE}.txt"
xcrun simctl spawn booted log stream --level info --style compact \
  --predicate 'eventMessage CONTAINS "[RecipediaApp]"' > "$APP_SYSLOG_FILE" 2>&1 &
SYSLOG_PID=$!
trap 'kill "$SYSLOG_PID" 2>/dev/null || true' EXIT

maestro test tests/e2e/ \
  --config="tests/e2e/${SUITE}.yaml" \
  --debug-output="maestro_logs_${SUITE}" \
  --format junit -s 1 \
  "${MAESTRO_CREDENTIAL_ARGS[@]}"
