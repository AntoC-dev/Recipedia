#!/bin/bash
# Usage: split-app-log-by-launch.sh <stream-file> <out-dir> <android|ios>
# Splits the streamed system log into one file per app launch (out-dir/launch-NN-pid<pid>.txt).
# E2E clearState kills the app between launches, so a pid change marks a new launch.

set -euo pipefail

INPUT="$1"
OUT_DIR="$2"
PLATFORM="$3"

if [ ! -s "$INPUT" ]; then
  echo "⚠️ No streamed app log at $INPUT"
  exit 0
fi

mkdir -p "$OUT_DIR"

LC_ALL=C awk -v dir="$OUT_DIR" -v platform="$PLATFORM" '
  !index($0, "[RecipediaApp]") { next }
  platform == "android" { pid = $3 }
  platform == "ios" {
    if (!match($0, /Recipedia\[[0-9]+/)) next
    pid = substr($0, RSTART + 10, RLENGTH - 10)
  }
  pid != current {
    if (out != "") close(out)
    current = pid
    out = sprintf("%s/launch-%02d-pid%s.txt", dir, ++launches, pid)
  }
  { print >> out }
' "$INPUT"

if [ -z "$(ls -A "$OUT_DIR")" ]; then
  rmdir "$OUT_DIR"
  echo "⚠️ No tagged app lines found in $INPUT"
else
  echo "📋 Per-launch app logs: $(ls "$OUT_DIR" | wc -l | tr -d ' ') file(s), $(du -sh "$OUT_DIR" | cut -f1)"
fi
