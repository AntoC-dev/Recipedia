#!/bin/bash

set -e

INPUT_DIR="${1:-maestro-logs}"
OUTPUT_DIR="${2:-maestro-logs-all-suites}"

echo "Merging Maestro logs..."
echo "   Input directory: $INPUT_DIR"
echo "   Output directory: $OUTPUT_DIR"

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

SUITE_COUNT=0
for suite_dir in "$INPUT_DIR"/*/; do
  if [ -d "$suite_dir" ]; then
    suite_name=$(basename "$suite_dir")
    echo "   Copying $suite_name..."
    mkdir -p "$TEMP_DIR/$suite_name"
    cp -r "$suite_dir/." "$TEMP_DIR/$suite_name/"
    SUITE_COUNT=$((SUITE_COUNT + 1))
  fi
done

if [ $SUITE_COUNT -eq 0 ]; then
  echo "No suite directories found to merge"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
cp -r "$TEMP_DIR/." "$OUTPUT_DIR/"

FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l | tr -d ' ')
echo "Merged $SUITE_COUNT Maestro log suites"
echo "   Files: $FILE_COUNT"
