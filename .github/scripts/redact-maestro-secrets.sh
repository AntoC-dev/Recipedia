#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/e2e-credentials.sh"

TARGETS=("$@")
if [ ${#TARGETS[@]} -eq 0 ]; then
  TARGETS=(maestro_logs)
fi
PLACEHOLDER="***REDACTED***"

EXISTING=()
for target in "${TARGETS[@]}"; do
  if [ -e "$target" ]; then
    EXISTING+=("$target")
  fi
done

if [ ${#EXISTING[@]} -eq 0 ]; then
  exit 0
fi

VARIANTS=()
GREP_PATTERNS=()
for name in $E2E_SECRET_ENV_VARS; do
  while IFS= read -r variant; do
    # An empty pattern makes grep -F match every file.
    [ -n "$variant" ] || continue
    VARIANTS+=("$variant")
    GREP_PATTERNS+=(-e "$variant")
  done < <(e2e_secret_variants "${!name}")
done

if [ ${#VARIANTS[@]} -eq 0 ]; then
  echo "🔒 No E2E credentials configured — nothing to redact in ${EXISTING[*]}"
  exit 0
fi

FILES=()
while IFS= read -r file; do
  FILES+=("$file")
done < <(LC_ALL=C grep -rlF "${GREP_PATTERNS[@]}" -- "${EXISTING[@]}" 2>/dev/null || true)

if [ ${#FILES[@]} -gt 0 ]; then
  SECRET_VALUES="$(printf '%s\n' "${VARIANTS[@]}")" SECRET_PLACEHOLDER="$PLACEHOLDER" \
    perl -pi -e '
      BEGIN { @secrets = split /\n/, $ENV{SECRET_VALUES} }
      for my $secret (@secrets) { s/\Q$secret\E/$ENV{SECRET_PLACEHOLDER}/g }
    ' "${FILES[@]}"
fi

echo "🔒 Redacted E2E credentials from ${#FILES[@]} file(s) in ${EXISTING[*]}"
