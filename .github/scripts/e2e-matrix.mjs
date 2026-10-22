#!/usr/bin/env node
/**
 * Build the E2E suite matrix for a platform from the single manifest
 * `.github/e2e-suites.json`.
 *
 * Each manifest entry is `{ name, requiresSecrets?, long? }`:
 *   - `requiresSecrets`: needs the QUITOQUE_* secrets, so it is dropped when the
 *     run is not internal (fork PRs receive no secrets).
 *   - `long`: slow suite. Job concurrency queues suites on both platforms, so
 *     long suites are scheduled first to avoid a long tail.
 *
 * Usage: node .github/scripts/e2e-matrix.mjs <android|ios> <true|false> [manifestFile]
 * Prints the JSON array of suite names consumed by `fromJson` in the workflow.
 */

import { readFileSync } from 'node:fs';

const PLATFORMS = ['android', 'ios'];

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
 * Compute the ordered suite names to run on a platform.
 *
 * @param suites Manifest entries, in declaration order.
 * @param platform `android` or `ios`; long suites come first, the rest keep manifest order.
 * @param isInternal Whether the run has access to secrets; when false, suites
 *   flagged `requiresSecrets` are dropped.
 * @returns Suite names in execution order.
 */
export function buildSuiteMatrix(suites, platform, isInternal) {
  if (!PLATFORMS.includes(platform)) {
    throw new Error(`Unknown platform "${platform}", expected one of: ${PLATFORMS.join(', ')}`);
  }

  const available = suites.filter(suite => isInternal || !suite.requiresSecrets);
  const ordered = [
    ...available.filter(suite => suite.long),
    ...available.filter(suite => !suite.long),
  ];

  return ordered.map(suite => suite.name);
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
