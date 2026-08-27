#!/bin/bash

set -e

INPUT_DIR="${1:-maestro-logs}"
OUTPUT_DIR="${2:-maestro-logs-all-suites}"

echo "Merging Maestro logs..."
echo "   Input directory: $INPUT_DIR"
echo "   Output directory: $OUTPUT_DIR"

SUITE_COUNT=0
for suite_dir in "$INPUT_DIR"/*/; do
  if [ -d "$suite_dir" ]; then
    suite_name=$(basename "$suite_dir")
    clean_name="${suite_name%.zip}"
    echo "   Moving $clean_name..."
    # Move, not copy: copying the iOS log set exhausts the runner disk.
    mkdir -p "$OUTPUT_DIR"
    mv "$suite_dir" "$OUTPUT_DIR/$clean_name"
    SUITE_COUNT=$((SUITE_COUNT + 1))
  fi
done

if [ $SUITE_COUNT -eq 0 ]; then
  if [ -d "$OUTPUT_DIR" ] && [ -n "$(ls -A "$OUTPUT_DIR" 2>/dev/null)" ]; then
    echo "Nothing left to move; $OUTPUT_DIR was already packaged by an earlier run"
    exit 0
  fi
  echo "No suite directories found to merge (nothing to package)"
  exit 0
fi

FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l | tr -d ' ')
echo "Merged $SUITE_COUNT Maestro log suites"
echo "   Files: $FILE_COUNT"
