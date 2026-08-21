#!/bin/bash

set -e

OUTPUT_DIR="${1:-maestro_logs}"

echo "Preparing Maestro logs from: $OUTPUT_DIR"

if [ ! -d "$OUTPUT_DIR" ]; then
  echo "Directory $OUTPUT_DIR does not exist"
  exit 0
fi

cd "$OUTPUT_DIR"

# Hoist the session's contents to the artifact root. Move whole entries, not
# matching extensions: since 2.7.0 each flow's screenshots and hierarchies live in
# its own subdirectory, which extension globs skipped and the rm below then deleted.
if [ -d ".maestro/tests" ]; then
  find .maestro/tests -mindepth 2 -maxdepth 2 -exec mv {} . \; || true
  rm -rf .maestro
fi

cd ..

FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l | tr -d ' ')
DIR_SIZE=$(du -sh "$OUTPUT_DIR" | cut -f1)

echo "Prepared $FILE_COUNT files"
echo "   Directory: $OUTPUT_DIR ($DIR_SIZE)"
