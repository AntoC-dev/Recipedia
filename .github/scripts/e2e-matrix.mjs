#!/usr/bin/env node
/**
 * Build the E2E suite matrix for a platform from the single manifest
 * `.github/e2e-suites.json`.
 *
 * Each manifest entry is `{ name, requiresSecrets?, long?, group?, usesPhotos? }`:
 *   - `requiresSecrets`: needs the QUITOQUE_* secrets, so it is dropped when the
 *     run is not internal (fork PRs receive no secrets).
 *   - `long`: slow suite. Job concurrency queues suites on both platforms, so
 *     long suites are scheduled first to avoid a long tail.
 *   - `group`: suites sharing a group run one after another in a single job,
 *     saving the per-job device setup of short suites. The job is named after
 *     its suites joined by `+`.
 *   - `usesPhotos`: imports photos on iOS, so run-e2e-job.sh disables the
 *     Photos "What's New" screen and warms up the simulator Photos library
 *     before the suite (not read here).
 *
 * Usage: node .github/scripts/e2e-matrix.mjs <android|ios> <true|false> [manifestFile]
 * Prints the JSON array of job names consumed by `fromJson` in the workflow.
 */

import { readFileSync } from 'node:fs';

const PLATFORMS = ['android', 'ios'];
const JOB_SEPARATOR = '+';

export const DEFAULT_MANIFEST = '.github/e2e-suites.json';

/**
 * Read and parse the E2E suite manifest.
 *
 * @param manifestFile Path to the manifest JSON, relative to the cwd or absolute.
 * @returns The manifest entries, in declaration order.
 */
export function loadSuites(manifestFile = DEFAULT_MANIFEST) {
  return JSON.parse(readFileSync(manifestFile, 'utf8'));
}

/**
 * Compute the ordered job names to run on a platform.
 *
 * @param suites Manifest entries, in declaration order.
 * @param platform `android` or `ios`; jobs holding a long suite come first, the
 *   rest keep manifest order. A grouped job sits at its first member's position.
 * @param isInternal Whether the run has access to secrets; when false, suites
 *   flagged `requiresSecrets` are dropped (from their group too).
 * @returns Job names in execution order: a suite name, or the `+`-joined names
 *   of a group's remaining suites.
 */
export function buildSuiteMatrix(suites, platform, isInternal) {
  if (!PLATFORMS.includes(platform)) {
    throw new Error(`Unknown platform "${platform}", expected one of: ${PLATFORMS.join(', ')}`);
  }

  const available = suites.filter(suite => isInternal || !suite.requiresSecrets);
  const jobsByKey = new Map();
  for (const suite of available) {
    const key = suite.group ?? suite.name;
    jobsByKey.set(key, [...(jobsByKey.get(key) ?? []), suite]);
  }
  const jobs = [...jobsByKey.values()];

  const isLong = job => job.some(suite => suite.long);
  const ordered = [...jobs.filter(isLong), ...jobs.filter(job => !isLong(job))];

  return ordered.map(job => job.map(suite => suite.name).join(JOB_SEPARATOR));
}

function main() {
  const [platform, internal, manifestFile = DEFAULT_MANIFEST] = process.argv.slice(2);
  if (!platform || !['true', 'false'].includes(internal)) {
    console.error('Usage: e2e-matrix.mjs <android|ios> <true|false> [manifestFile]');
    process.exit(2);
  }

  const suites = loadSuites(manifestFile);
  try {
    console.log(JSON.stringify(buildSuiteMatrix(suites, platform, internal === 'true')));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
