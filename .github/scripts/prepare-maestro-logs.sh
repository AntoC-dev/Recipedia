#!/bin/bash

set -e

OUTPUT_DIR="${1:-maestro_logs}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Preparing Maestro logs from: $OUTPUT_DIR"

if [ ! -d "$OUTPUT_DIR" ]; then
  echo "Directory $OUTPUT_DIR does not exist"
  exit 0
fi

# Flatten structure - move logs and screenshots from .maestro/tests/*/ to root
(
  cd "$OUTPUT_DIR"

  if [ -d ".maestro/tests" ]; then
    mv .maestro/tests/*/maestro.log . 2>/dev/null || true
    mv .maestro/tests/*/*.png . 2>/dev/null || true
    mv .maestro/tests/*/*.json . 2>/dev/null || true
    mv .maestro/tests/*/*.html . 2>/dev/null || true
    rm -rf .maestro
  fi
)

# Maestro <=2.6 names these `commands-(<flow name>).json`, newer versions `commands.json`.
find "$OUTPUT_DIR" -type f -name 'commands*.json' -delete
bash "$SCRIPT_DIR/redact-maestro-secrets.sh" "$OUTPUT_DIR"

FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l | tr -d ' ')
DIR_SIZE=$(du -sh "$OUTPUT_DIR" | cut -f1)

echo "Prepared $FILE_COUNT files"
echo "   Directory: $OUTPUT_DIR ($DIR_SIZE)"
