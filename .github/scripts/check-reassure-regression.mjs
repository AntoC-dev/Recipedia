#!/usr/bin/env node
/**
 * Hard-gate the build on significant Reassure render regressions.
 *
 * Reassure writes `.reassure/output.json` after comparing the PR head against the
 * base-branch baseline. Entries it deems statistically significant land in the
 * `significant` array with `relativeDurationDiff` and `relativeRenderCountDiff`
 * (fractions, e.g. 0.12 = +12%). This script fails (exit 1) when any significant
 * entry regressed beyond the configured thresholds, so a perf regression cannot be
 * merged into main.
 *
 * Render-count regressions are treated as hard failures at any positive count,
 * because an extra render is a deterministic code regression (React Compiler is
 * meant to keep these flat) rather than measurement noise. Duration regressions
 * use a percentage threshold to absorb CI timing jitter.
 *
 * Usage: node .github/scripts/check-reassure-regression.mjs [outputJson]
 */

import { readFileSync, existsSync } from 'node:fs';

const DURATION_THRESHOLD_PCT = 15;

/**
 * Partition significant Reassure entries into blocking regressions.
 *
 * @param significant The `significant` array from Reassure output.
 * @param durationThresholdPct Duration regression threshold, in percent.
 * @returns `{ durationRegressions, countRegressions }` arrays of offending entries.
 */
export function findRegressions(significant, durationThresholdPct = DURATION_THRESHOLD_PCT) {
  const durationRegressions = significant.filter(
    e => (e.relativeDurationDiff ?? 0) * 100 > durationThresholdPct
  );
  const countRegressions = significant.filter(e => (e.relativeRenderCountDiff ?? 0) > 0);
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
      console.error(`   ${e.name}: renders ${pct(e.relativeRenderCountDiff)}`);
    }
  }
  if (durationRegressions.length > 0) {
    console.error(
      `❌ ${durationRegressions.length} duration regression(s) over ${DURATION_THRESHOLD_PCT}%:`
    );
    for (const e of durationRegressions) {
      console.error(`   ${e.name}: ${pct(e.relativeDurationDiff)}`);
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
