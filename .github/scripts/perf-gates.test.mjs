import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { averageFps, evaluateFps, formatMarkdownSummary } from './check-perf-budget.mjs';
import {
  findRegressions,
  lowerBoundRelativeDurationDiff,
} from './check-reassure-regression.mjs';
import { measureBundleBytes } from './check-bundle-size.mjs';

test('averageFps pools fps across iterations and measures', () => {
  const testCase = {
    status: 'SUCCESS',
    iterations: [{ measures: [{ fps: 60 }, { fps: 50 }] }, { measures: [{ fps: 40 }] }],
  };
  assert.equal(averageFps(testCase), 50);
});

test('averageFps ignores measures without an fps sample', () => {
  const testCase = { status: 'SUCCESS', iterations: [{ measures: [{ fps: 60 }, { cpu: {} }] }] };
  assert.equal(averageFps(testCase), 60);
});

test('averageFps returns null for a failed run', () => {
  assert.equal(averageFps({ status: 'FAILURE', iterations: [{ measures: [{ fps: 60 }] }] }), null);
});

test('averageFps returns null when no fps samples exist', () => {
  assert.equal(averageFps({ status: 'SUCCESS', iterations: [{ measures: [{ cpu: {} }] }] }), null);
});

test('evaluateFps is collect-only before calibration', () => {
  const budgets = {
    regressionTolerancePct: 15,
    screens: { home: { minFps: 40, referenceFps: null } },
  };
  const verdicts = evaluateFps(new Map([['home', 10]]), budgets);
  assert.equal(verdicts[0].status, 'pass');
});

test('evaluateFps fails a missing result even before calibration', () => {
  const budgets = {
    regressionTolerancePct: 15,
    screens: { home: { minFps: 40, referenceFps: null } },
  };
  const verdicts = evaluateFps(new Map([['home', null]]), budgets);
  assert.equal(verdicts[0].status, 'fail');
});

test('evaluateFps warns (not fails) below floor when calibrated', () => {
  const budgets = {
    regressionTolerancePct: 15,
    screens: { home: { minFps: 40, referenceFps: 58 } },
  };
  const verdicts = evaluateFps(new Map([['home', 30]]), budgets);
  assert.equal(verdicts[0].status, 'warn');
});

test('evaluateFps warns (not fails) on regression beyond tolerance', () => {
  const budgets = {
    regressionTolerancePct: 15,
    screens: { home: { minFps: 20, referenceFps: 58 } },
  };
  const verdicts = evaluateFps(new Map([['home', 45]]), budgets);
  assert.equal(verdicts[0].status, 'warn');
});

test('evaluateFps passes within tolerance', () => {
  const budgets = {
    regressionTolerancePct: 15,
    screens: { home: { minFps: 20, referenceFps: 58 } },
  };
  const verdicts = evaluateFps(new Map([['home', 52]]), budgets);
  assert.equal(verdicts[0].status, 'pass');
});

test('formatMarkdownSummary renders a row per screen with status icons', () => {
  const md = formatMarkdownSummary([
    { screen: 'home', fps: 58, status: 'pass', message: 'ok' },
    { screen: 'search', fps: 30, status: 'warn', message: 'below floor (min 40 fps)' },
    { screen: 'menu', fps: 'n/a', status: 'fail', message: 'flow failed (no result)' },
  ]);
  assert.match(md, /\| home \| 58 \| ✅ \| ok \|/);
  assert.match(md, /\| search \| 30 \| ⚠️ \| below floor \(min 40 fps\) \|/);
  assert.match(md, /\| menu \| n\/a \| ❌ \| flow failed \(no result\) \|/);
});

const tightRegression = {
  name: 'tight',
  relativeDurationDiff: 0.2,
  baseline: { meanDuration: 100, stdevDuration: 2, runs: 10 },
  current: { meanDuration: 120, stdevDuration: 2, runs: 10 },
};

const noisyBlip = {
  name: 'noisy',
  relativeDurationDiff: 0.171,
  baseline: { meanDuration: 61.9, stdevDuration: 11, runs: 10 },
  current: { meanDuration: 72.5, stdevDuration: 11, runs: 10 },
};

test('findRegressions flags duration over threshold via point-estimate fallback', () => {
  const { durationRegressions } = findRegressions([{ name: 'a', relativeDurationDiff: 0.2 }], 15);
  assert.equal(durationRegressions.length, 1);
});

test('findRegressions ignores duration under threshold via point-estimate fallback', () => {
  const { durationRegressions } = findRegressions([{ name: 'a', relativeDurationDiff: 0.1 }], 15);
  assert.equal(durationRegressions.length, 0);
});

test('findRegressions fails a tightly-measured regression above the CI lower bound', () => {
  const { durationRegressions } = findRegressions([tightRegression], 15);
  assert.equal(durationRegressions.length, 1);
});

test('findRegressions passes a noisy blip whose point estimate exceeds the threshold', () => {
  const { durationRegressions } = findRegressions([noisyBlip], 15);
  assert.equal(durationRegressions.length, 0);
});

test('findRegressions flags any positive render-count growth', () => {
  const { countRegressions } = findRegressions([{ name: 'a', relativeCountDiff: 0.01 }], 15);
  assert.equal(countRegressions.length, 1);
});

test('findRegressions passes a clean entry', () => {
  const { durationRegressions, countRegressions } = findRegressions(
    [{ name: 'a', relativeDurationDiff: 0.05, relativeCountDiff: 0 }],
    15
  );
  assert.equal(durationRegressions.length + countRegressions.length, 0);
});

test('lowerBoundRelativeDurationDiff discounts noise below the point estimate', () => {
  const lower = lowerBoundRelativeDurationDiff(noisyBlip);
  assert.ok(lower < noisyBlip.relativeDurationDiff);
  assert.ok(lower * 100 < 15);
});

test('lowerBoundRelativeDurationDiff falls back to the point estimate without per-run stats', () => {
  assert.equal(lowerBoundRelativeDurationDiff({ relativeDurationDiff: 0.2 }), 0.2);
});

test('lowerBoundRelativeDurationDiff falls back when current lacks a mean duration', () => {
  const entry = {
    relativeDurationDiff: 0.2,
    baseline: { meanDuration: 100, stdevDuration: 2, runs: 10 },
    current: { stdevDuration: 2, runs: 10 },
  };
  assert.equal(lowerBoundRelativeDurationDiff(entry), 0.2);
});

test('lowerBoundRelativeDurationDiff equals the point estimate at zero variance', () => {
  const entry = {
    relativeDurationDiff: 0.2,
    baseline: { meanDuration: 100, stdevDuration: 0, runs: 10 },
    current: { meanDuration: 120, stdevDuration: 0, runs: 10 },
  };
  assert.equal(lowerBoundRelativeDurationDiff(entry), 0.2);
});

test('measureBundleBytes sums js and hbc files recursively', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-'));
  mkdirSync(join(dir, 'nested'));
  writeFileSync(join(dir, 'a.js'), 'x'.repeat(100));
  writeFileSync(join(dir, 'nested', 'b.hbc'), 'y'.repeat(50));
  writeFileSync(join(dir, 'c.txt'), 'z'.repeat(1000));
  assert.equal(measureBundleBytes(dir), 150);
});
