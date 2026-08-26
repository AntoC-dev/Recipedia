#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/e2e-credentials.sh"

TARGET_DIRS=("$@")
if [ ${#TARGET_DIRS[@]} -eq 0 ]; then
  TARGET_DIRS=(maestro_logs)
fi

LEAKED=0

for target_dir in "${TARGET_DIRS[@]}"; do
  if [ ! -e "$target_dir" ]; then
    echo "$target_dir does not exist — nothing to scan"
    continue
  fi

  for name in $E2E_SECRET_ENV_VARS; do
    GREP_PATTERNS=()
    while IFS= read -r variant; do
      # An empty pattern makes grep -F match every file.
      [ -n "$variant" ] || continue
      GREP_PATTERNS+=(-e "$variant")
    done < <(e2e_secret_variants "${!name}")

    if [ ${#GREP_PATTERNS[@]} -eq 0 ]; then
      continue
    fi

    MATCHES=$(LC_ALL=C grep -rlF "${GREP_PATTERNS[@]}" -- "$target_dir" 2>/dev/null || true)

    if [ -n "$MATCHES" ]; then
      LEAKED=1
      echo "::error::$name leaks into $target_dir"
      echo "$MATCHES" | while IFS= read -r file; do
        echo "   $file"
      done
    fi
  done
done

if [ "$LEAKED" -ne 0 ]; then
  echo "Refusing to upload the artifact — run redact-maestro-secrets.sh first"
  exit 1
fi

echo "✅ No E2E credentials found in ${TARGET_DIRS[*]}"
