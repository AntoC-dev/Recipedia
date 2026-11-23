import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const PHOTO = 'tests/assets/pouletSatay/title.jpg';
const MIGRATION_STARTED =
  'assetsd[1]: [com.apple.photos.backend:Migration] tag:1:bg Start of post migration actions (type: Background)';
const MIGRATION_COMPLETED =
  'assetsd[1]: [com.apple.photos.backend:Migration] tag:1:bg Completed post migration actions (type: Background) 2.00s';

const writeExecutable = (path, body) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `#!/bin/bash\n${body}\n`);
  chmodSync(path, 0o755);
};

const warmUp = ({
  logStream = 'exec sleep 30',
  addmedia = 'exit 0',
  launch = 'exit 0',
  terminate = 'exit 0',
  env = {},
  timeout,
} = {}) => {
  const workDir = mkdtempSync(join(tmpdir(), 'warm-up-photos-'));
  writeExecutable(
    join(workDir, 'bin', 'xcrun'),
    `echo "xcrun $*" >> calls.txt
case "$*" in
  *"log stream"*) ${logStream} ;;
  *addmedia*) ${addmedia} ;;
  *launch*) ${launch} ;;
  *terminate*) ${terminate} ;;
esac`
  );

  const script = join(SCRIPTS_DIR, 'warm-up-ios-photos.sh');
  const command = timeout
    ? [
        '/usr/bin/perl',
        ['-e', 'alarm shift; exec @ARGV', String(timeout), '/bin/bash', script, PHOTO],
      ]
    : ['/bin/bash', [script, PHOTO]];
  const startedAt = Date.now();
  const result = spawnSync(command[0], command[1], {
    cwd: workDir,
    env: {
      ...process.env,
      PATH: `${join(workDir, 'bin')}:${process.env.PATH}`,
      E2E_PHOTOS_OPEN_SECONDS: '0',
      E2E_PHOTOS_MIGRATION_START_GRACE: '2',
      ...env,
    },
    encoding: 'utf8',
  });
  const callsFile = join(workDir, 'calls.txt');
  const calls = existsSync(callsFile)
    ? readFileSync(callsFile, 'utf8').split('\n').filter(Boolean)
    : [];

  return { result, calls, elapsedMs: Date.now() - startedAt };
};

const indexOfCall = (calls, fragment) => calls.findIndex(call => call.includes(fragment));

test('imports the photo, then opens and closes the Photos app', () => {
  const { result, calls } = warmUp();

  assert.equal(result.status, 0, result.stdout + result.stderr);
  const addmediaIndex = indexOfCall(calls, `simctl addmedia booted ${PHOTO}`);
  const launchIndex = indexOfCall(calls, 'simctl launch booted com.apple.mobileslideshow');
  const terminateIndex = indexOfCall(calls, 'simctl terminate booted com.apple.mobileslideshow');
  assert.ok(addmediaIndex !== -1, calls.join('\n'));
  assert.ok(addmediaIndex < launchIndex, calls.join('\n'));
  assert.ok(launchIndex < terminateIndex, calls.join('\n'));
});

test('watches the assetsd post migration log from before the Photos app opens', () => {
  const { calls } = warmUp();
  const streamIndex = indexOfCall(calls, 'simctl spawn booted log stream');

  assert.ok(streamIndex !== -1, calls.join('\n'));
  assert.match(calls[streamIndex], /process == "assetsd"/);
  assert.ok(streamIndex < indexOfCall(calls, 'simctl launch booted'), calls.join('\n'));
});

test('waits for the Photos library migration to complete before returning', () => {
  const { result, elapsedMs } = warmUp({
    logStream: `echo "${MIGRATION_STARTED}"; sleep 3; echo "${MIGRATION_COMPLETED}"; exec sleep 30`,
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Photos library migration completed/);
  assert.ok(elapsedMs >= 3000, `returned after ${elapsedMs}ms`);
});

test('keeps waiting past the start grace once the migration has started', () => {
  const { result } = warmUp({
    logStream: `echo "${MIGRATION_STARTED}"; sleep 4; echo "${MIGRATION_COMPLETED}"; exec sleep 30`,
    env: { E2E_PHOTOS_MIGRATION_START_GRACE: '1' },
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Photos library migration completed/);
});

test('waits for a migration that starts after a short one already completed', () => {
  const { result, elapsedMs } = warmUp({
    logStream: `echo "${MIGRATION_STARTED}"; echo "${MIGRATION_COMPLETED}"; sleep 1; echo "${MIGRATION_STARTED}"; sleep 3; echo "${MIGRATION_COMPLETED}"; exec sleep 30`,
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Photos library migration completed/);
  assert.ok(elapsedMs >= 4000, `returned after ${elapsedMs}ms`);
});

test('waits out the start grace even when a migration already completed', () => {
  const { result, elapsedMs } = warmUp({
    logStream: `echo "${MIGRATION_STARTED}"; echo "${MIGRATION_COMPLETED}"; exec sleep 30`,
    env: { E2E_PHOTOS_MIGRATION_START_GRACE: '3' },
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(elapsedMs >= 3000, `returned after ${elapsedMs}ms`);
});

test('returns once the start grace passes without any migration', () => {
  const { result, elapsedMs } = warmUp();

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /::warning::No Photos library migration started/);
  assert.ok(elapsedMs < 10000, `returned after ${elapsedMs}ms`);
});

test('a failed photo import fails the warm-up without opening the Photos app', () => {
  const { result, calls } = warmUp({ addmedia: 'exit 5' });

  assert.equal(result.status, 5);
  assert.equal(indexOfCall(calls, 'simctl launch booted'), -1);
});

test('a failed Photos launch fails the warm-up', () => {
  const { result } = warmUp({ launch: 'exit 6' });

  assert.equal(result.status, 6);
});

test('a hung photo import is stopped by the alarm with the timeout exit code', () => {
  const { result, elapsedMs } = warmUp({ addmedia: 'exec sleep 30', timeout: 1 });

  assert.equal(result.status, 142);
  assert.ok(elapsedMs < 10000, `returned after ${elapsedMs}ms`);
});

test('a migration that never completes is stopped by the alarm with the timeout exit code', () => {
  const { result, elapsedMs } = warmUp({
    logStream: `echo "${MIGRATION_STARTED}"; exec sleep 30`,
    timeout: 3,
  });

  assert.equal(result.status, 142);
  assert.ok(elapsedMs < 10000, `returned after ${elapsedMs}ms`);
});
