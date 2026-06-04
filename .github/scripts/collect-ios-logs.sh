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
  LOG_FILES=$(ls -t "$APP_CONTAINER/Documents/recipedia-logs-"*.txt 2>/dev/null)
  echo "📋 Checking for log files in: $APP_CONTAINER/Documents"
  if [ -n "$LOG_FILES" ]; then
    echo "$LOG_FILES" | xargs cat > "$LOG_DIR/recipedia-app-logs.txt"
    echo "📋 App log files collected ($(wc -l < "$LOG_DIR/recipedia-app-logs.txt") lines)"
  else
    echo "⚠️ App log files not found"
    ls -la "$APP_CONTAINER/Documents" || echo "❌ Cannot list Documents directory"
  fi
else
  echo "⚠️ Could not find app container"
fi
