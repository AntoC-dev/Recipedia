#!/usr/bin/env node
/**
 * Gate (and optionally calibrate) per-screen Flashlight FPS against committed
 * budgets.
 *
 * `flashlight test --resultsFilePath` writes a single `TestCaseResult` JSON per
 * screen containing raw `iterations[].measures[]` (each measure has `fps`, `cpu`,
 * `ram`, `time`). It does NOT write a performance "score" — that is computed only
 * at report time — so this gates on the metric that is actually present: the mean
 * UI frame rate, computed exactly like Flashlight's `getAverageFPSUsage`
 * (the average of every measure's `fps`).
 *
 * Each `<screen>.json` in the results directory is compared to
 * `tests/e2e/performance-budgets.json`:
 *   - hard fail if avg FPS < screen.minFps (absolute floor)
 *   - regression fail if a `referenceFps` exists and FPS dropped more than
 *     `regressionTolerancePct` below it
 *
 * Calibration mode (env FLASHLIGHT_CALIBRATE=1) writes the measured FPS back into
 * the budgets file as the new `referenceFps` values and does not fail the build.
 * Until a screen is calibrated it is collect-only, so unvalidated floors never
 * produce false CI failures.
 *
 * Usage: node .github/scripts/check-perf-budget.mjs <resultsDir> [budgetsFile]
 * Exit code: 0 on pass/calibrate, 1 on any regression or floor breach.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

function round(value) {
  return Math.round(value * 10) / 10;
}

/**
 * Computes the mean UI frame rate of a Flashlight `TestCaseResult`.
 *
 * Pools every measure across every iteration and averages the defined `fps`
 * values, matching Flashlight's own `getAverageFPSUsage`. A failed run, or one
 * with no FPS samples, yields `null`.
 *
 * @param testCase Parsed Flashlight `TestCaseResult` JSON.
 * @returns Mean FPS rounded to one decimal, or `null` when unavailable.
 */
export function averageFps(testCase) {
  if (!testCase || testCase.status === 'FAILURE') return null;
  const values = [];
  for (const iteration of testCase.iterations ?? []) {
    for (const measure of iteration.measures ?? []) {
      if (typeof measure.fps === 'number') values.push(measure.fps);
    }
  }
  if (values.length === 0) return null;
  return round(values.reduce((sum, fps) => sum + fps, 0) / values.length);
}

/**
 * Compare measured FPS against budgets and produce a verdict per screen.
 *
 * @param fpsByScreen Map of screen key to measured average FPS (or null).
 * @param budgets Parsed budgets file.
 * @returns Array of `{ screen, fps, status, message }` results.
 */
export function evaluateFps(fpsByScreen, budgets) {
  const tolerance = budgets.regressionTolerancePct ?? 15;
  return Object.entries(budgets.screens).map(([screen, budget]) => {
    const fps = fpsByScreen.get(screen);

    // Pre-calibration: never gate, just collect, so guessed floors can't false-fail.
    if (budget.referenceFps == null) {
      return { screen, fps, status: 'pass', message: 'collect-only (not calibrated)' };
    }
    if (fps == null) {
      return { screen, fps: null, status: 'fail', message: 'no fps (missing or failed run)' };
    }
    if (fps < budget.minFps) {
      return { screen, fps, status: 'fail', message: `below floor (min ${budget.minFps} fps)` };
    }
    const floor = budget.referenceFps * (1 - tolerance / 100);
    if (fps < floor) {
      return {
        screen,
        fps,
        status: 'fail',
        message: `regression: ${fps} < ${round(floor)} fps (ref ${budget.referenceFps} -${tolerance}%)`,
      };
    }
    return { screen, fps, status: 'pass', message: 'ok' };
  });
}

function loadFps(resultsDir) {
  const fpsByScreen = new Map();
  for (const file of readdirSync(resultsDir)) {
    if (!file.endsWith('.json')) continue;
    const screen = basename(file, '.json');
    try {
      fpsByScreen.set(screen, averageFps(JSON.parse(readFileSync(join(resultsDir, file), 'utf8'))));
    } catch {
      fpsByScreen.set(screen, null);
    }
  }
  return fpsByScreen;
}

function main() {
  const [resultsDir, budgetsFile = 'tests/e2e/performance-budgets.json'] = process.argv.slice(2);
  if (!resultsDir) {
    console.error('Usage: check-perf-budget.mjs <resultsDir> [budgetsFile]');
    process.exit(2);
  }

  const budgets = JSON.parse(readFileSync(budgetsFile, 'utf8'));
  const fpsByScreen = loadFps(resultsDir);

  if (process.env.FLASHLIGHT_CALIBRATE === '1') {
    for (const screen of Object.keys(budgets.screens)) {
      const fps = fpsByScreen.get(screen);
      if (typeof fps === 'number') budgets.screens[screen].referenceFps = fps;
    }
    writeFileSync(budgetsFile, JSON.stringify(budgets, null, 2) + '\n');
    console.log('Calibrated reference FPS:');
    for (const [screen, b] of Object.entries(budgets.screens)) {
      console.log(`  ${screen}: ${b.referenceFps}`);
    }
    return;
  }

  let failed = false;
  for (const verdict of evaluateFps(fpsByScreen, budgets)) {
    const icon = verdict.status === 'pass' ? '✅' : '❌';
    console.log(`${icon} ${verdict.screen}: fps=${verdict.fps ?? 'n/a'} — ${verdict.message}`);
    if (verdict.status === 'fail') failed = true;
  }
  if (failed) {
    console.error('\nPerformance gate FAILED.');
    process.exit(1);
  }
  console.log('\nPerformance gate passed.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
