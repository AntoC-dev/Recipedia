#!/bin/bash

set -e

OUTPUT_DIR="${1:-maestro_logs}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Preparing Maestro logs from: $OUTPUT_DIR"

if [ ! -d "$OUTPUT_DIR" ]; then
  echo "Directory $OUTPUT_DIR does not exist"
  exit 0
fi

# Flatten structure - move whole entries: since 2.7.0 each flow's screenshots and
# hierarchies live in a subdirectory that extension globs skipped and the rm deleted.
(
  cd "$OUTPUT_DIR"

  # List the entries before moving any: renaming out of a directory find is still
  # reading can silently skip the ones it has not returned yet.
  if [ -d ".maestro/tests" ]; then
    ENTRY_LIST=$(mktemp)
    find .maestro/tests -mindepth 2 -maxdepth 2 -print0 > "$ENTRY_LIST"
    while IFS= read -r -d '' entry; do
      mv "$entry" . || true
    done < "$ENTRY_LIST"
    rm -f "$ENTRY_LIST"
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
