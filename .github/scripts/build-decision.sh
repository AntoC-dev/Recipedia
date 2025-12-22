#!/bin/bash
#
# Display build decision analysis
#
# Usage: build-decision.sh <build-profile> <build-required> <branch> <ref> <platform>
#

set -euo pipefail

BUILD_PROFILE="${1:?Build profile required}"
BUILD_REQUIRED="${2:?Build required flag required}"
BRANCH="${3:?Branch required}"
REF="${4:?Ref required}"
PLATFORM="${5:-app}"

echo "🔍 Build Decision Analysis (${BUILD_PROFILE})"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Build-triggering files changed: ${BUILD_REQUIRED}"
echo "Branch: ${BRANCH}"

if [ "$REF" = "refs/heads/main" ]; then
  echo "📦 Decision: BUILD (main branch always builds)"
elif [[ "$REF" == refs/tags/* ]]; then
  echo "📦 Decision: BUILD (tag always builds)"
elif [ "$BUILD_REQUIRED" = "true" ]; then
  echo "📦 Decision: BUILD (source code changed)"
else
  echo "♻️  Decision: CACHE (only tests/docs changed, will attempt ${PLATFORM} download)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
