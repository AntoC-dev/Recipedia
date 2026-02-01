#!/bin/bash

set +e

SUITE="$1"
LOG_DIR="maestro_logs_${SUITE}"

mkdir -p "$LOG_DIR"

echo "📋 Collecting Android logcat..."
timeout 30 adb logcat -d > "$LOG_DIR/android-app-logs.txt" 2>&1 || true
echo "📋 Android logs collected ($(wc -l < "$LOG_DIR/android-app-logs.txt" 2>/dev/null || echo 0) lines)"

echo "📋 Collecting app log file..."
adb root || true
sleep 1
timeout 30 adb pull /data/data/com.recipedia/files/recipedia-logs.txt "$LOG_DIR/recipedia-app-logs.txt" 2>/dev/null || true

if [ -s "$LOG_DIR/recipedia-app-logs.txt" ]; then
  echo "📋 App log file collected"
else
  echo "⚠️ App log file not found or empty"
fi
