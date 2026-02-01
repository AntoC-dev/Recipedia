#!/bin/bash

set +e

SUITE="$1"
UDID="$2"
LOG_DIR="maestro_logs_${SUITE}"

mkdir -p "$LOG_DIR"

echo "📋 Collecting iOS system logs..."
xcrun simctl spawn "$UDID" log show \
  --predicate 'subsystem CONTAINS "com.recipedia" OR process CONTAINS "Recipedia"' \
  --style compact \
  --last 1h > "$LOG_DIR/ios-app-logs.txt" 2>&1 || true
echo "📋 iOS logs collected ($(wc -l < "$LOG_DIR/ios-app-logs.txt" 2>/dev/null || echo 0) lines)"

echo "📋 Collecting app log file from Documents directory..."
APP_CONTAINER=$(xcrun simctl get_app_container "$UDID" com.recipedia data 2>/dev/null || echo "")
if [ -n "$APP_CONTAINER" ]; then
  LOG_FILE="$APP_CONTAINER/Documents/recipedia-logs.txt"
  if [ -f "$LOG_FILE" ]; then
    cp "$LOG_FILE" "$LOG_DIR/recipedia-app-logs.txt"
    echo "📋 App log file collected ($(wc -l < "$LOG_DIR/recipedia-app-logs.txt") lines)"
  else
    echo "⚠️ App log file not found at $LOG_FILE"
  fi
else
  echo "⚠️ Could not find app container"
fi
