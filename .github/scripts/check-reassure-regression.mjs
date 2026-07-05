#!/usr/bin/env node
/**
 * Hard-gate the build on significant Reassure render regressions.
 *
 * Reassure writes `.reassure/output.json` after comparing the PR head against the
 * base-branch baseline. Entries it deems statistically significant land in the
 * `significant` array, each carrying `relativeDurationDiff`/`relativeCountDiff`
 * (fractions, e.g. 0.12 = +12%) plus the per-run `current`/`baseline` stats
 * (`meanDuration`, `stdevDuration`, `runs`). This script fails (exit 1) when any
 * significant entry regressed beyond the configured thresholds, so a perf
 * regression cannot be merged into main.
 *
 * Render-count regressions are treated as hard failures at any positive count,
 * because an extra render is a deterministic code regression (React Compiler is
 * meant to keep these flat) rather than measurement noise.
 *
 * Duration regressions gate on the lower bound of the 95% confidence interval of
 * the mean difference, not the raw point estimate. A shared CI runner produces
 * noisy per-run durations, so a scenario's mean can drift several percent between
 * runs purely from jitter. By requiring even the optimistic end of the interval to
 * exceed the threshold, a scenario only fails when it is convincingly slower than
 * its own measurement noise — false alarms shrink automatically for high-variance
 * scenarios while genuine, tightly-measured regressions still fail. When per-run
 * stats are missing the check falls back to the raw point estimate.
 *
 * Usage: node .github/scripts/check-reassure-regression.mjs [outputJson]
 */

import { readFileSync, existsSync } from 'node:fs';

// Intentionally looser than reassure.config.js `regressionThreshold` (10%): that
// threshold decides which entries reassure marks `significant`; this one is the
// blocking gate applied on top, giving significant-but-small regressions headroom
// before they fail the build.
const DURATION_THRESHOLD_PCT = 15;
const Z_95 = 1.96;

/**
 * Lower bound of the 95% confidence interval of an entry's relative duration diff.
 *
 * Uses the standard error of the difference of two independent means
 * (`sqrt(sd_base²/n_base + sd_curr²/n_curr)`) to discount measurement noise, then
 * expresses the conservative (smallest plausible) regression as a fraction of the
 * baseline mean. Falls back to the raw `relativeDurationDiff` point estimate when
 * per-run stats are unavailable.
 *
 * @param entry A Reassure compare entry with optional `current`/`baseline` stats.
 * @param z Standard-normal multiplier for the interval (defaults to 95%).
 * @returns Lower-bound relative duration diff as a fraction (e.g. 0.12 = +12%).
 */
export function lowerBoundRelativeDurationDiff(entry, z = Z_95) {
  const base = entry.baseline;
  const curr = entry.current;
  if (
    !base?.meanDuration ||
    !curr?.meanDuration ||
    !base.runs ||
    !curr.runs ||
    base.stdevDuration == null ||
    curr.stdevDuration == null
  ) {
    return entry.relativeDurationDiff ?? 0;
  }
  const diff = curr.meanDuration - base.meanDuration;
  const standardError = Math.sqrt(
    base.stdevDuration ** 2 / base.runs + curr.stdevDuration ** 2 / curr.runs
  );
  return (diff - z * standardError) / base.meanDuration;
}

/**
 * Partition significant Reassure entries into blocking regressions.
 *
 * @param significant The `significant` array from Reassure output.
 * @param durationThresholdPct Duration regression threshold, in percent.
 * @returns `{ durationRegressions, countRegressions }` arrays of offending entries.
 */
export function findRegressions(significant, durationThresholdPct = DURATION_THRESHOLD_PCT) {
  const durationRegressions = significant.filter(
    e => lowerBoundRelativeDurationDiff(e) * 100 > durationThresholdPct
  );
  const countRegressions = significant.filter(e => (e.relativeCountDiff ?? 0) > 0);
  return { durationRegressions, countRegressions };
}

function pct(rel) {
  return `${rel >= 0 ? '+' : ''}${(rel * 100).toFixed(1)}%`;
}

function main() {
  const input = process.argv[2] ?? '.reassure/output.json';
  if (!existsSync(input)) {
    console.log(`No Reassure output at ${input} — nothing to gate.`);
    return;
  }

  const { significant = [] } = JSON.parse(readFileSync(input, 'utf8'));
  const { durationRegressions, countRegressions } = findRegressions(significant);

  if (countRegressions.length > 0) {
    console.error(`❌ ${countRegressions.length} render-count regression(s):`);
    for (const e of countRegressions) {
      console.error(`   ${e.name}: renders ${pct(e.relativeCountDiff)}`);
    }
  }
  if (durationRegressions.length > 0) {
    console.error(
      `❌ ${durationRegressions.length} duration regression(s) over ${DURATION_THRESHOLD_PCT}%:`
    );
    for (const e of durationRegressions) {
      console.error(
        `   ${e.name}: ${pct(lowerBoundRelativeDurationDiff(e))} (95% CI lower bound; point ${pct(e.relativeDurationDiff)})`
      );
    }
  }

  if (countRegressions.length > 0 || durationRegressions.length > 0) {
    console.error('\nReassure regression gate FAILED — see the PR comment for details.');
    process.exit(1);
  }
  console.log('✅ Reassure regression gate passed.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
