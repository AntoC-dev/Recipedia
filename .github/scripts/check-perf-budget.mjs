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
 *   - a missing result (the flow produced no output) is a **hard failure** — the
 *     flow itself broke
 *   - an FPS drop below `minFps`, or more than `regressionTolerancePct` below a
 *     calibrated `referenceFps`, is a **warning only** — single-run device FPS is
 *     too noisy to hard-gate on; the deterministic hard gate is Reassure
 *
 * Calibration mode (env FLASHLIGHT_CALIBRATE=1) writes the measured FPS back into
 * the budgets file as the new `referenceFps` values. Until a screen is calibrated
 * its FPS is collect-only (reported, never warned on).
 *
 * Usage: node .github/scripts/check-perf-budget.mjs <resultsDir> [budgetsFile]
 * Exit code: 1 only if a flow produced no result; 0 otherwise (incl. FPS warnings).
 */

import { readFileSync, writeFileSync, appendFileSync, readdirSync } from 'node:fs';
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

    // Missing result = the flow itself failed: fatal, always (even pre-calibration).
    if (fps == null) {
      return { screen, fps: null, status: 'fail', message: 'flow failed (no result)' };
    }
    // The flow ran. FPS-value problems are WARNINGS, not failures: single-run
    // emulator FPS is noisy and would false-alarm a hard gate. The deterministic
    // hard gate is Reassure; here FPS is a monitored trend signal.
    if (budget.referenceFps == null) {
      return { screen, fps, status: 'pass', message: 'collect-only (not calibrated)' };
    }
    if (fps < budget.minFps) {
      return { screen, fps, status: 'warn', message: `below floor (min ${budget.minFps} fps)` };
    }
    const floor = budget.referenceFps * (1 - tolerance / 100);
    if (fps < floor) {
      return {
        screen,
        fps,
        status: 'warn',
        message: `regression: ${fps} < ${round(floor)} fps (ref ${budget.referenceFps} -${tolerance}%)`,
      };
    }
    return { screen, fps, status: 'pass', message: 'ok' };
  });
}

/**
 * Renders verdicts as a GitHub-flavoured markdown table for the run summary.
 *
 * @param verdicts Output of {@link evaluateFps}.
 * @returns A markdown string with one row per screen.
 */
const STATUS_ICON = { pass: '✅', warn: '⚠️', fail: '❌' };

export function formatMarkdownSummary(verdicts) {
  const rows = verdicts
    .map(v => `| ${v.screen} | ${v.fps ?? 'n/a'} | ${STATUS_ICON[v.status]} | ${v.message} |`)
    .join('\n');
  return `### Flashlight per-screen FPS\n\n| Screen | Avg FPS | Status | Notes |\n| --- | --- | --- | --- |\n${rows}\n`;
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

  const verdicts = evaluateFps(fpsByScreen, budgets);
  let failed = false;
  let warned = false;
  for (const verdict of verdicts) {
    const line = `${STATUS_ICON[verdict.status]} ${verdict.screen}: fps=${verdict.fps ?? 'n/a'} — ${verdict.message}`;
    if (verdict.status === 'fail') {
      console.error(line);
      failed = true;
    } else if (verdict.status === 'warn') {
      console.log(`::warning::${verdict.screen}: ${verdict.message}`);
      console.log(line);
      warned = true;
    } else {
      console.log(line);
    }
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, formatMarkdownSummary(verdicts));
  }

  // Only a broken flow (no result) fails the build. FPS regressions are warnings:
  // single-run device FPS is too noisy to hard-gate on.
  if (failed) {
    console.error('\nPerformance gate FAILED — a flow produced no result.');
    process.exit(1);
  }
  console.log(
    warned ? '\nFlows ran. FPS warnings above — review trend.' : '\nPerformance gate passed.'
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
