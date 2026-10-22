import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSuiteMatrix, loadSuites } from './e2e-matrix.mjs';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPTS_DIR, '..', '..');
const MANIFEST = join(REPO_ROOT, '.github', 'e2e-suites.json');

const suites = [
  { name: 'alpha' },
  { name: 'secret', requiresSecrets: true },
  { name: 'slow-one', long: true },
  { name: 'beta' },
  { name: 'slow-secret', long: true, requiresSecrets: true },
];

for (const platform of ['android', 'ios']) {
  test(`${platform} schedules long suites first and keeps the rest in manifest order`, () => {
    assert.deepEqual(buildSuiteMatrix(suites, platform, true), [
      'slow-one',
      'slow-secret',
      'alpha',
      'secret',
      'beta',
    ]);
  });
}

test('non-internal runs drop suites requiring secrets on every platform', () => {
  assert.deepEqual(buildSuiteMatrix(suites, 'android', false), ['slow-one', 'alpha', 'beta']);
  assert.deepEqual(buildSuiteMatrix(suites, 'ios', false), ['slow-one', 'alpha', 'beta']);
});

test('an unknown platform is rejected', () => {
  assert.throws(() => buildSuiteMatrix(suites, 'web', true), /Unknown platform "web"/);
});

test('loadSuites reads the manifest entries', () => {
  const loaded = loadSuites(MANIFEST);

  assert.deepEqual(loaded, JSON.parse(readFileSync(MANIFEST, 'utf8')));
  assert.ok(loaded.length > 0);
});

test('an empty manifest yields an empty matrix', () => {
  assert.deepEqual(buildSuiteMatrix([], 'ios', true), []);
});

const runCli = (...args) =>
  spawnSync('node', [join(SCRIPTS_DIR, 'e2e-matrix.mjs'), ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });

test('the CLI prints a JSON array readable by fromJson', () => {
  const result = runCli('ios', 'true');

  assert.equal(result.status, 0);
  assert.deepEqual(
    JSON.parse(result.stdout),
    buildSuiteMatrix(JSON.parse(readFileSync(MANIFEST, 'utf8')), 'ios', true)
  );
});

test('the CLI rejects missing or malformed arguments', () => {
  assert.equal(runCli().status, 2);
  assert.equal(runCli('android', 'maybe').status, 2);
  assert.equal(runCli('desktop', 'true').status, 2);
});

test('the real manifest declares each suite once and every suite has a config', () => {
  const names = JSON.parse(readFileSync(MANIFEST, 'utf8')).map(suite => suite.name);

  assert.equal(new Set(names).size, names.length);
  for (const name of names) {
    assert.ok(existsSync(join(REPO_ROOT, 'tests', 'e2e', `${name}.yaml`)), `${name}.yaml missing`);
  }
});

test('every credential-reading suite is withheld from non-internal runs', () => {
  const script = readFileSync(join(SCRIPTS_DIR, 'e2e-credentials.sh'), 'utf8');
  const credentialSuites = script.match(/E2E_CREDENTIAL_SUITES="([^"]*)"/)[1].split(' ');
  const forkSuites = buildSuiteMatrix(JSON.parse(readFileSync(MANIFEST, 'utf8')), 'android', false);

  for (const suite of credentialSuites) {
    assert.ok(!forkSuites.includes(suite), `${suite} reads credentials but runs on forks`);
  }
});
