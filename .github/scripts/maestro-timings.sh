#!/bin/bash
# TEMP (#599): per-command timings from maestro.log, to A/B setup and wait changes.
# Usage: maestro-timings.sh <maestro.log>... [-o <out dir>]
# Writes commands.tsv (one row per finished command), flows.tsv (per flow attempt)
# and summary.tsv (per label: count, total, avg, max, sorted by total).

set -euo pipefail

OUT_DIR="maestro-timings"
LOGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    -o) OUT_DIR="$2"; shift 2 ;;
    *) LOGS+=("$1"); shift ;;
  esac
done
[ ${#LOGS[@]} -gt 0 ] || { echo "usage: $0 <maestro.log>... [-o dir]" >&2; exit 1; }
mkdir -p "$OUT_DIR"

awk -v cmds="$OUT_DIR/commands.tsv" -v flows="$OUT_DIR/flows.tsv" '
function ms(ts,   p) { split(ts, p, /[:.]/); return ((p[1] * 60 + p[2]) * 60 + p[3]) * 1000 + p[4] }
function elapsed(a, b,   d) { d = b - a; return d < 0 ? d + 86400000 : d }
function closeFlow(t) {
  if (flow != "") printf "%s\t%s\t%d\t%s\n", log_name, flow, elapsed(flowStart, t), flowStatus > flows
}
BEGIN {
  print "log\tflow\tdepth\tlabel\tstatus\tms" > cmds
  print "log\tflow\tms\tstatus" > flows
}
FNR == 1 { if (NR > 1) closeFlow(last); flow = ""; depth = 0; log_name = FILENAME }
/^[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\.[0-9]+ / { last = ms($1) }
/TestSuiteInteractor\.runFlow: +Running flow / {
  closeFlow(last)
  flow = $0; sub(/.*Running flow +/, "", flow)
  flowStart = last; flowStatus = "COMPLETED"; depth = 0
  next
}
/onCommandStart: .* RUNNING$/ {
  label = $0; sub(/.*onCommandStart: /, "", label); sub(/ RUNNING$/, "", label)
  depth++; stackLabel[depth] = label; stackStart[depth] = last
  next
}
/onCommandFinished: .* (COMPLETED|FAILED|SKIPPED|WARNED)$/ {
  label = $0; sub(/.*onCommandFinished: /, "", label)
  status = label; sub(/.* /, "", status); sub(/ [A-Z]+$/, "", label)
  for (i = depth; i > 0 && stackLabel[i] != label; i--) ;
  if (i == 0) next
  if (status == "FAILED") flowStatus = "FAILED"
  printf "%s\t%s\t%d\t%s\t%s\t%d\n", log_name, flow, i, label, status, elapsed(stackStart[i], last) > cmds
  depth = i - 1
}
END { closeFlow(last) }
' "${LOGS[@]}"

{
  printf 'label\tcount\ttotal_s\tavg_s\tmax_s\n'
  awk -F'\t' 'NR > 1 && $5 != "SKIPPED" {
    n[$4]++; t[$4] += $6; if ($6 > m[$4]) m[$4] = $6
  } END {
    for (l in n) printf "%s\t%d\t%.1f\t%.2f\t%.1f\n", l, n[l], t[l] / 1000, t[l] / n[l] / 1000, m[l] / 1000
  }' "$OUT_DIR/commands.tsv" | sort -t$'\t' -k3,3 -g -r
} > "$OUT_DIR/summary.tsv"

echo "Wrote $OUT_DIR/{commands,flows,summary}.tsv"
