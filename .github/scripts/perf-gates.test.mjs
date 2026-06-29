import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { averageFps, evaluateFps, formatMarkdownSummary } from './check-perf-budget.mjs';
import { findRegressions } from './check-reassure-regression.mjs';
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

test('findRegressions flags duration over threshold', () => {
  const { durationRegressions } = findRegressions([{ name: 'a', relativeDurationDiff: 0.2 }], 15);
  assert.equal(durationRegressions.length, 1);
});

test('findRegressions ignores duration under threshold', () => {
  const { durationRegressions } = findRegressions([{ name: 'a', relativeDurationDiff: 0.1 }], 15);
  assert.equal(durationRegressions.length, 0);
});

test('findRegressions flags any positive render-count growth', () => {
  const { countRegressions } = findRegressions([{ name: 'a', relativeRenderCountDiff: 0.01 }], 15);
  assert.equal(countRegressions.length, 1);
});

test('findRegressions passes a clean entry', () => {
  const { durationRegressions, countRegressions } = findRegressions(
    [{ name: 'a', relativeDurationDiff: 0.05, relativeRenderCountDiff: 0 }],
    15
  );
  assert.equal(durationRegressions.length + countRegressions.length, 0);
});

test('measureBundleBytes sums js and hbc files recursively', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-'));
  mkdirSync(join(dir, 'nested'));
  writeFileSync(join(dir, 'a.js'), 'x'.repeat(100));
  writeFileSync(join(dir, 'nested', 'b.hbc'), 'y'.repeat(50));
  writeFileSync(join(dir, 'c.txt'), 'z'.repeat(1000));
  assert.equal(measureBundleBytes(dir), 150);
});
