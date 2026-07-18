#!/usr/bin/env node
/**
 * Convert Flashlight results into github-action-benchmark input.
 *
 * `flashlight test --resultsFilePath` writes one `TestCaseResult` JSON per screen,
 * each holding raw `iterations[].measures[]` (every measure has `fps`, `cpu`,
 * `ram`, `time`). This script reduces each screen to its mean UI frame rate and
 * emits a `fps.json` in github-action-benchmark's `customBiggerIsBetter` format.
 * The benchmark action then stores the history, renders the trend charts, and
 * comments on the commit when a screen regresses.
 *
 * FPS is the only metric emitted: Flashlight's `time` is the sampling window
 * (`--duration`), not flow duration, so it cannot serve as a startup-time metric
 * (see issue #445).
 *
 * Usage: node .github/scripts/flashlight-benchmark.mjs <resultsDir> <outDir>
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
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
 * Converts a per-screen metric map into github-action-benchmark's custom format.
 *
 * The benchmark action consumes an array of `{ name, unit, value }`; each screen
 * with a numeric value becomes one entry. Screens with a `null` metric (a failed
 * or absent flow) are omitted so a gap does not read as a zero.
 *
 * @param byScreen Map of screen key to a numeric metric (or null).
 * @param unit Unit label recorded on each entry (e.g. `'fps'`).
 * @returns Array of benchmark entries, one per screen with a value.
 */
export function toBenchmark(byScreen, unit) {
  const entries = [];
  for (const [screen, value] of byScreen) {
    if (typeof value === 'number') entries.push({ name: screen, unit, value });
  }
  return entries;
}

function loadFps(resultsDir) {
  const byScreen = new Map();
  for (const file of readdirSync(resultsDir)) {
    if (!file.endsWith('.json')) continue;
    const screen = basename(file, '.json');
    try {
      byScreen.set(screen, averageFps(JSON.parse(readFileSync(join(resultsDir, file), 'utf8'))));
    } catch {
      byScreen.set(screen, null);
    }
  }
  return byScreen;
}

function main() {
  const [resultsDir, outDir] = process.argv.slice(2);
  if (!resultsDir || !outDir) {
    console.error('Usage: flashlight-benchmark.mjs <resultsDir> <outDir>');
    process.exit(2);
  }
  mkdirSync(outDir, { recursive: true });
  const fps = toBenchmark(loadFps(resultsDir), 'fps');
  writeFileSync(join(outDir, 'fps.json'), JSON.stringify(fps, null, 2) + '\n');
  console.log(`Emitted ${fps.length} fps entries to ${outDir}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
