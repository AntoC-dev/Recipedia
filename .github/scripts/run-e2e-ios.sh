#!/bin/bash

set -e

SUITE="$1"

echo "🚀 Running E2E tests on iOS simulator for suite: $SUITE ..."
npm run install:ios

maestro test tests/e2e/ \
  --config="tests/e2e/${SUITE}.yaml" \
  --debug-output="maestro_logs_${SUITE}" \
  --format junit -s 1 \
  -e QUITOQUE_USERNAME="${QUITOQUE_USERNAME}" \
  -e QUITOQUE_PASSWORD="${QUITOQUE_PASSWORD}"
