#!/bin/bash

set +e
set -x

SUITE="$1"
UDID="$2"
LOG_DIR="maestro_logs_${SUITE}"

mkdir -p "$LOG_DIR"

echo "📋 Collecting app log file from Documents directory..."
echo "📋 UDID: $UDID"
echo "📋 Bundle ID: com.recipedia"

# Use perl to implement a portable timeout for macOS
echo "📋 Attempting to get app container for com.recipedia (with 30s timeout)..."
APP_CONTAINER=$(perl -e 'alarm shift; exec @ARGV' 30 xcrun simctl get_app_container "$UDID" com.recipedia data 2>/dev/null || echo "")
echo "📋 APP_CONTAINER: $APP_CONTAINER"

if [ -n "$APP_CONTAINER" ]; then
  LOG_FILE="$APP_CONTAINER/Documents/recipedia-logs.txt"
  echo "📋 Checking for log file at: $LOG_FILE"
  if [ -f "$LOG_FILE" ]; then
    cp "$LOG_FILE" "$LOG_DIR/recipedia-app-logs.txt"
    echo "📋 App log file collected ($(wc -l < "$LOG_DIR/recipedia-app-logs.txt") lines)"
  else
    echo "⚠️ App log file not found at $LOG_FILE"
    ls -la "$APP_CONTAINER/Documents" || echo "❌ Cannot list Documents directory"
  fi
else
  echo "⚠️ Could not find app container"
fi
