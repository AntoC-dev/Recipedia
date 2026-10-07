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

# E2E clearState (simctl uninstall) wipes the file log above on every launch. The app mirrors
# its log to the unified log (tag below) in non-production builds, and run-e2e-ios.sh streams
# the tagged lines to app-syslog-<suite>.txt for the whole run. Maestro's own device-simulator.log
# is captured at the default level and misses these info-level lines.
echo "📋 Splitting streamed app log lines, one file per app process..."
APP_LOG_DIR="$LOG_DIR/app-logs"
mkdir -p "$APP_LOG_DIR"
awk -v dir="$APP_LOG_DIR" '{
    pid = match($0, /Recipedia\[[0-9]+/) ? substr($0, RSTART + 10, RLENGTH - 10) : "unknown"
    if (!(pid in index_of)) index_of[pid] = ++launches
    print > sprintf("%s/launch-%02d-pid%s.txt", dir, index_of[pid], pid)
  }' "app-syslog-${SUITE}.txt" 2>/dev/null
if [ -z "$(ls -A "$APP_LOG_DIR" 2>/dev/null)" ]; then
  rmdir "$APP_LOG_DIR"
  echo "⚠️ No tagged app lines found in the streamed unified log"
else
  echo "📋 Per-launch app logs: $(ls "$APP_LOG_DIR" | wc -l | tr -d ' ') file(s)"
fi

# Lossy: anything outside this list is dropped. Unfiltered these overflow the merge job disk.
KEEP_PROCESSES='Recipedia|SpringBoard|runningboardd|assertiond|testmanagerd|maestro-driver-iosUITests-Runner|CoreSimulator|mediaserverd|kernel|ReportCrash|osanalyticshelper|symptomsd'
echo "📋 Filtering simulator syslogs down to the processes E2E triage reads..."
find "$LOG_DIR" -name device-simulator.log -type f | while IFS= read -r sim_log; do
  LC_ALL=C grep -aE " ($KEEP_PROCESSES)\[[0-9]+\]: " "$sim_log" > "$sim_log.filtered"
  mv "$sim_log.filtered" "$sim_log"
  echo "📋 Filtered $sim_log ($(du -h "$sim_log" | cut -f1))"
done

# Only source of an abort backtrace: stderr is not captured by `log stream`.
CRASH_DIR="$LOG_DIR/crash-reports"
mkdir -p "$CRASH_DIR"
echo "📋 Collecting crash reports..."
for src in "$HOME/Library/Logs/DiagnosticReports" \
           "$HOME/Library/Developer/CoreSimulator/Devices/$UDID/data/Library/Logs/DiagnosticReports"; do
  [ -d "$src" ] || continue
  echo "📋 Scanning $src"
  find "$src" -maxdepth 1 -name 'Recipedia-*.ips' -mtime -1 -exec cp {} "$CRASH_DIR/" \;
done

for ips in "$CRASH_DIR"/*.ips; do
  [ -f "$ips" ] || continue
  echo "::warning::Crash report captured: $(basename "$ips")"
  echo "--- $(basename "$ips") ---"
  head -c 2000 "$ips"
  echo
done

if rmdir "$CRASH_DIR" 2>/dev/null; then
  echo "📋 No crash reports found (app did not crash during this run)"
fi

# rmdir fails exactly when reports were kept; that must not fail the step.
exit 0
