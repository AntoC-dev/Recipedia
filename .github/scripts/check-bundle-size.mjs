#!/usr/bin/env node
/**
 * Track and gate the production JS bundle size.
 *
 * A growing JS bundle directly hurts app start time and download size, yet it is
 * invisible in normal review. This script measures the total bytes of the
 * Hermes/Metro bundle(s) produced by `expo export` and compares them to a
 * committed budget (`tests/perf/bundle-size-budget.json`):
 *   - hard fail if total bytes exceed `maxBytes`
 *   - warn (non-fatal) if they grew more than `warnGrowthPct` over `referenceBytes`
 *
 * Calibration mode (env BUNDLE_CALIBRATE=1) writes the measured total back into
 * the budget as the new `referenceBytes` instead of gating.
 *
 * Usage: node .github/scripts/check-bundle-size.mjs <distDir> [budgetFile]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Sum the byte size of every JS bundle under a directory tree.
 *
 * Expo writes hashed bundles under `_expo/static/js/**`; this walks the whole
 * `distDir` and totals any `.js`/`.hbc` file so it is resilient to layout shifts
 * across Expo/Metro versions.
 *
 * @param distDir Root of the `expo export` output.
 * @returns Total bundle size in bytes.
 */
export function measureBundleBytes(distDir) {
  let total = 0;
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(js|hbc)$/.test(entry.name)) {
        total += statSync(full).size;
      }
    }
  };
  walk(distDir);
  return total;
}

function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function main() {
  const [distDir, budgetFile = 'tests/perf/bundle-size-budget.json'] = process.argv.slice(2);
  if (!distDir) {
    console.error('Usage: check-bundle-size.mjs <distDir> [budgetFile]');
    process.exit(2);
  }

  const total = measureBundleBytes(distDir);
  const budget = JSON.parse(readFileSync(budgetFile, 'utf8'));

  if (process.env.BUNDLE_CALIBRATE === '1') {
    budget.referenceBytes = total;
    writeFileSync(budgetFile, JSON.stringify(budget, null, 2) + '\n');
    console.log(`Calibrated referenceBytes = ${total} (${mb(total)})`);
    return;
  }

  console.log(`Bundle size: ${mb(total)} (${total} bytes)`);
  console.log(`Budget max:  ${mb(budget.maxBytes)}`);

  if (typeof budget.referenceBytes === 'number' && budget.referenceBytes > 0) {
    const growth = ((total - budget.referenceBytes) / budget.referenceBytes) * 100;
    console.log(
      `Reference:   ${mb(budget.referenceBytes)} (${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%)`
    );
    if (growth > (budget.warnGrowthPct ?? 5)) {
      console.log(`::warning::Bundle grew ${growth.toFixed(1)}% over reference.`);
    }
  }

  if (total > budget.maxBytes) {
    console.error(`\n❌ Bundle size ${mb(total)} exceeds budget ${mb(budget.maxBytes)}.`);
    process.exit(1);
  }
  console.log('\n✅ Bundle size within budget.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
