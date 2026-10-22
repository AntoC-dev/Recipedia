#!/bin/bash
# Usage: prepare-job-logs.sh <job>
# Prepares each suite's maestro_logs_<suite>. A grouped job ("a+b", see e2e-matrix.mjs) uploads
# one artifact, so its suite logs are moved under maestro_logs_<job>/<suite>.

set -e

JOB="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for suite in ${JOB//+/ }; do
  bash "$SCRIPT_DIR/prepare-maestro-logs.sh" "maestro_logs_${suite}"
  if [ "$suite" != "$JOB" ] && [ -d "maestro_logs_${suite}" ]; then
    mkdir -p "maestro_logs_${JOB}"
    mv "maestro_logs_${suite}" "maestro_logs_${JOB}/$suite"
  fi
done
