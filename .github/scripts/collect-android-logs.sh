#!/bin/bash

set +e

SUITE="$1"
LOG_DIR="maestro_logs_${SUITE}"

mkdir -p "$LOG_DIR"

echo "📋 Collecting app log files..."
adb root || true
sleep 1
DEVICE_LOGS=$(adb shell "ls -t /data/data/com.recipedia/files/recipedia-logs-*.txt 2>/dev/null" | tr -d '\r')
if [ -n "$DEVICE_LOGS" ]; then
  for LOG in $DEVICE_LOGS; do
    timeout 30 adb shell "cat '$LOG'" >> "$LOG_DIR/recipedia-app-logs.txt" 2>/dev/null || true
  done
fi

if [ -s "$LOG_DIR/recipedia-app-logs.txt" ]; then
  echo "📋 App log files collected"
else
  echo "⚠️ App log files not found or empty"
fi

# E2E clearState (pm clear) wipes the file log above on every launch. The app mirrors its
# log to logcat in non-production builds, and run-e2e-android.sh streams the tagged lines to
# $APP_LOGCAT_FILE for the whole run, so the logcat ring buffer cannot evict early launches.
echo "📋 Splitting streamed app log lines, one file per app process..."
APP_LOG_DIR="$LOG_DIR/app-logs"
mkdir -p "$APP_LOG_DIR"
awk -v dir="$APP_LOG_DIR" '{
    pid = $3
    if (!(pid in index_of)) index_of[pid] = ++launches
    print > sprintf("%s/launch-%02d-pid%s.txt", dir, index_of[pid], pid)
  }' "${APP_LOGCAT_FILE:-/dev/null}"
if [ -z "$(ls -A "$APP_LOG_DIR" 2>/dev/null)" ]; then
  rmdir "$APP_LOG_DIR"
  echo "⚠️ No tagged app lines found in the streamed logcat"
else
  echo "📋 Per-launch app logs: $(ls "$APP_LOG_DIR" | wc -l | tr -d ' ') file(s)"
fi
