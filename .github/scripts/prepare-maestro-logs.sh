#!/bin/bash

set -e

OUTPUT_DIR="${1:-maestro_logs}"

echo "Preparing Maestro logs from: $OUTPUT_DIR"

if [ ! -d "$OUTPUT_DIR" ]; then
  echo "Directory $OUTPUT_DIR does not exist"
  exit 0
fi

cd "$OUTPUT_DIR"

# Flatten structure - move logs and screenshots from .maestro/tests/*/ to root
if [ -d ".maestro/tests" ]; then
  mv .maestro/tests/*/maestro.log . 2>/dev/null || true
  mv .maestro/tests/*/*.png . 2>/dev/null || true
  mv .maestro/tests/*/*.json . 2>/dev/null || true
  mv .maestro/tests/*/*.html . 2>/dev/null || true
  rm -rf .maestro
fi

cd ..

# Create zip archive
zip -r "${OUTPUT_DIR}.zip" "$OUTPUT_DIR/"

FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l | tr -d ' ')
ZIP_SIZE=$(du -h "${OUTPUT_DIR}.zip" | cut -f1)

echo "Prepared $FILE_COUNT files"
echo "   Archive: ${OUTPUT_DIR}.zip ($ZIP_SIZE)"
