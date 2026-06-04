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
