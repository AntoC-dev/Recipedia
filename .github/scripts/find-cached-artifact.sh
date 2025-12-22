#!/bin/bash
#
# Find a cached artifact from previous workflow runs
#
# Usage: find-cached-artifact.sh <artifact-name> <workflow-name> <branch>
#
# Outputs to GITHUB_ENV:
#   CACHED_RUN_ID - The run ID where artifact was found (empty if not found)
#   BUILD_FALLBACK - Set to 'true' if no artifact found
#

set -euo pipefail

ARTIFACT_NAME="${1:?Artifact name required}"
WORKFLOW_NAME="${2:-build-test.yml}"
BRANCH="${3:?Branch name required}"
PLATFORM="${4:-app}"

echo "♻️  Looking for cached ${PLATFORM} from previous runs..."
echo ""
echo "🔍 Searching on branch: ${BRANCH}"
echo ""

echo "📋 Recent workflow runs on this branch:"
gh run list --workflow "${WORKFLOW_NAME}" --branch "${BRANCH}" --limit 10 --json databaseId,status,conclusion | \
  jq -r '.[] | "  Run #\(.databaseId) - Status: \(.status) - Conclusion: \(.conclusion)"'
echo ""

echo "🔍 Checking each run for ${ARTIFACT_NAME} artifact..."
RUN_IDS=$(gh run list \
  --workflow "${WORKFLOW_NAME}" \
  --branch "${BRANCH}" \
  --limit 10 \
  --json databaseId \
  --jq '.[].databaseId')

FOUND=false
for RUN_ID in $RUN_IDS; do
  echo "  📦 Checking run #${RUN_ID}..."

  ARTIFACTS=$(gh api "repos/${GITHUB_REPOSITORY}/actions/runs/${RUN_ID}/artifacts" --jq '.artifacts[] | .name' 2>/dev/null || echo "")

  if [ -n "$ARTIFACTS" ]; then
    echo "    Found artifacts: $(echo $ARTIFACTS | tr '\n' ', ' | sed 's/,$//')"

    if echo "$ARTIFACTS" | grep -q "^${ARTIFACT_NAME}$"; then
      echo "    ✅ This run has ${ARTIFACT_NAME}!"
      echo "CACHED_RUN_ID=${RUN_ID}" >> "$GITHUB_ENV"
      FOUND=true
      break
    fi
  else
    echo "    No artifacts found"
  fi
done

echo ""
if [ "$FOUND" = false ]; then
  echo "⚠️  No ${PLATFORM} artifact found in recent runs → Will build fresh ${PLATFORM}"
  echo "BUILD_FALLBACK=true" >> "$GITHUB_ENV"
fi
