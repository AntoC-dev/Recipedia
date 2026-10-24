import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
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
const noCredentials = { QUITOQUE_USERNAME: '', QUITOQUE_PASSWORD: '' };

const writeFile = (path, contents) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
};

const writeExecutable = (path, body) => {
  writeFile(path, `#!/bin/bash\n${body}\n`);
  chmodSync(path, 0o755);
};

const runJob = ({ platform, job, failingSuites = [], installExit = 0 }) => {
  const workDir = mkdtempSync(join(tmpdir(), 'e2e-job-'));
  const scriptsDir = join(workDir, 'scripts');
  mkdirSync(scriptsDir, { recursive: true });
  copyFileSync(join(SCRIPTS_DIR, 'run-e2e-job.sh'), join(scriptsDir, 'run-e2e-job.sh'));
  for (const stubbedPlatform of ['android', 'ios']) {
    writeExecutable(
      join(scriptsDir, `run-e2e-${stubbedPlatform}.sh`),
      `echo "${stubbedPlatform} $1 \${E2E_RERUN_DEADLINE:-unset}" >> calls.txt
for failing in $FAILING_SUITES; do
  [ "$1" = "$failing" ] && exit 3
done
exit 0`
    );
  }
  writeExecutable(join(workDir, 'bin', 'npm'), `echo "npm $*" >> calls.txt\nexit ${installExit}`);

  const result = spawnSync('/bin/bash', [join(scriptsDir, 'run-e2e-job.sh'), platform, job], {
    cwd: workDir,
    env: {
      ...process.env,
      FAILING_SUITES: failingSuites.join(' '),
      PATH: `${join(workDir, 'bin')}:${process.env.PATH}`,
    },
    encoding: 'utf8',
  });
  const callsFile = join(workDir, 'calls.txt');
  const calls = existsSync(callsFile)
    ? readFileSync(callsFile, 'utf8').split('\n').filter(Boolean)
    : [];

  return { result, calls };
};

test('a single-suite job runs that suite once and keeps its exit code', () => {
  const { result, calls } = runJob({ platform: 'ios', job: 'search', failingSuites: ['search'] });

  assert.equal(result.status, 3);
  assert.deepEqual(
    calls.map(call => call.replace(/ \d+$/, '')),
    ['npm run install:ios', 'ios search']
  );
});

test('a grouped job installs the app once, then runs every suite in order', () => {
  const { result, calls } = runJob({ platform: 'android', job: 'app-init+locale-fr+menu' });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(
    calls.map(call => call.replace(/ \d+$/, '')),
    ['npm run install:android', 'android app-init', 'android locale-fr', 'android menu']
  );
});

test('a failed install fails the job without running any suite', () => {
  const { result, calls } = runJob({ platform: 'ios', job: 'app-init+menu', installExit: 4 });

  assert.equal(result.status, 4);
  assert.deepEqual(calls, ['npm run install:ios']);
});

test('a failing suite does not stop the rest of its job, which still fails', () => {
  const { result, calls } = runJob({
    platform: 'ios',
    job: 'app-init+locale-fr+menu',
    failingSuites: ['app-init'],
  });

  assert.equal(result.status, 3);
  assert.equal(calls.filter(call => call.startsWith('ios ')).length, 3);
});

test('every suite of a job shares one rerun deadline set when the job started', () => {
  const startedAt = Math.floor(Date.now() / 1000);
  const { calls } = runJob({ platform: 'ios', job: 'app-init+menu' });
  const deadlines = calls
    .filter(call => call.startsWith('ios '))
    .map(call => Number(call.split(' ')[2]));

  assert.equal(deadlines.length, 2);
  assert.equal(deadlines[0], deadlines[1]);
  assert.ok(deadlines[0] >= startedAt + 9000 && deadlines[0] <= startedAt + 9002);
});

test('missing arguments are rejected with the usage', () => {
  const { result, calls } = runJob({ platform: 'ios', job: '' });

  assert.equal(result.status, 2);
  assert.match(result.stdout, /Usage: run-e2e-job\.sh/);
  assert.deepEqual(calls, []);
});

test('an unknown platform is rejected before running anything', () => {
  const { result, calls } = runJob({ platform: 'web', job: 'search' });

  assert.equal(result.status, 2);
  assert.deepEqual(calls, []);
});

const prepareJobLogs = (job, layout) => {
  const workDir = mkdtempSync(join(tmpdir(), 'e2e-job-logs-'));
  for (const [path, contents] of Object.entries(layout)) {
    writeFile(join(workDir, path), contents);
  }

  const result = spawnSync('/bin/bash', [join(SCRIPTS_DIR, 'prepare-job-logs.sh'), job], {
    cwd: workDir,
    env: { ...process.env, ...noCredentials },
    encoding: 'utf8',
  });

  return { result, workDir };
};

test('a single-suite job keeps its flat log directory', () => {
  const { result, workDir } = prepareJobLogs('search', {
    'maestro_logs_search/.maestro/tests/session/1 - Flow/maestro.log': 'search log\n',
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(
    readFileSync(join(workDir, 'maestro_logs_search', '1 - Flow', 'maestro.log'), 'utf8'),
    'search log\n'
  );
});

test('a grouped job nests each prepared suite log under the job directory', () => {
  const { result, workDir } = prepareJobLogs('app-init+locale-fr', {
    'maestro_logs_app-init/.maestro/tests/session/1 - Init/maestro.log': 'init log\n',
    'maestro_logs_app-init/recipedia-app-logs.txt': 'app log\n',
    'maestro_logs_locale-fr/.maestro/tests/session/1 - Fr/maestro.log': 'fr log\n',
  });
  const jobDir = join(workDir, 'maestro_logs_app-init+locale-fr');

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(readFileSync(join(jobDir, 'app-init', '1 - Init', 'maestro.log'), 'utf8'), 'init log\n');
  assert.equal(readFileSync(join(jobDir, 'app-init', 'recipedia-app-logs.txt'), 'utf8'), 'app log\n');
  assert.equal(readFileSync(join(jobDir, 'locale-fr', '1 - Fr', 'maestro.log'), 'utf8'), 'fr log\n');
  assert.ok(!existsSync(join(workDir, 'maestro_logs_app-init')));
  assert.ok(!existsSync(join(workDir, 'maestro_logs_locale-fr')));
});

test('a grouped job skips a suite that left no logs', () => {
  const { result, workDir } = prepareJobLogs('app-init+locale-fr', {
    'maestro_logs_locale-fr/maestro.log': 'fr log\n',
  });
  const jobDir = join(workDir, 'maestro_logs_app-init+locale-fr');

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(existsSync(join(jobDir, 'locale-fr', 'maestro.log')));
  assert.ok(!existsSync(join(jobDir, 'app-init')));
});
