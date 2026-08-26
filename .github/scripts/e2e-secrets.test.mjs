import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const USERNAME = 'ci-bot@example.com';
const PASSWORD = 'p4ssw0rd-secret';
const TRICKY = 'p@ss"wo\\rd&<123>';

const credentials = { QUITOQUE_USERNAME: USERNAME, QUITOQUE_PASSWORD: PASSWORD };
const noCredentials = { QUITOQUE_USERNAME: '', QUITOQUE_PASSWORD: '' };

const urlEncoded = 'ci-bot%40example.com';
const jsonEscaped = TRICKY.replace(/(["\\])/g, '\\$1');
const xmlEscaped = TRICKY.replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const writeExecutable = (path, body) => {
  writeFileSync(path, `#!/bin/bash\n${body}\n`);
  chmodSync(path, 0o755);
};

const makeTree = (layout, root) => {
  const dir = root ?? mkdtempSync(join(tmpdir(), 'maestro-logs-'));
  for (const [path, contents] of Object.entries(layout)) {
    const target = join(dir, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }
  return dir;
};

const runScript = (script, args, env = credentials, cwd = undefined) =>
  spawnSync('/bin/bash', [join(SCRIPTS_DIR, script), ...args], {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });

const withStubbedTools = (workDir, maestroBody) => {
  const binDir = join(workDir, 'bin');
  mkdirSync(binDir, { recursive: true });
  writeExecutable(join(binDir, 'maestro'), maestroBody);
  writeExecutable(join(binDir, 'npm'), 'exit 0');
  writeExecutable(join(binDir, 'adb'), 'exit 0');
  mkdirSync(join(workDir, '.github', 'scripts'), { recursive: true });
  writeExecutable(
    join(workDir, '.github', 'scripts', 'collect-android-logs.sh'),
    `touch "${join(workDir, 'collected')}"`,
  );
  return binDir;
};

const maestroArgv = (script, suite, env = credentials) => {
  const workDir = mkdtempSync(join(tmpdir(), 'e2e-runner-'));
  const argsFile = join(workDir, 'argv.txt');
  const binDir = withStubbedTools(workDir, `printf '%s\\n' "$@" > "${argsFile}"`);

  spawnSync('/bin/bash', [join(SCRIPTS_DIR, script), suite], {
    cwd: workDir,
    env: { ...process.env, ...env, PATH: `${binDir}:${process.env.PATH}` },
  });

  return readFileSync(argsFile, 'utf8').split('\n').filter(Boolean);
};

const sourcedSnippet = (snippet, env = credentials) =>
  spawnSync(
    '/bin/bash',
    ['-c', `source "${join(SCRIPTS_DIR, 'e2e-credentials.sh')}"\n${snippet}`],
    { env: { ...process.env, ...env }, encoding: 'utf8' },
  );

const commandsDump = (password = PASSWORD) =>
  `{"defineVariablesCommand":{"env":{"QUITOQUE_USERNAME":"${USERNAME}","QUITOQUE_PASSWORD":"${password}"}}}`;

for (const script of ['run-e2e-ios.sh', 'run-e2e-android.sh']) {
  test(`${script} passes both credentials to the web suite`, () => {
    const argv = maestroArgv(script, 'web');

    assert.ok(argv.includes(`QUITOQUE_USERNAME=${USERNAME}`));
    assert.ok(argv.includes(`QUITOQUE_PASSWORD=${PASSWORD}`));
    assert.equal(argv.filter((argument) => argument === '-e').length, 2);
  });

  test(`${script} withholds credentials from suites that never read them`, () => {
    for (const suite of ['app-init', 'bulk-import', 'ocr']) {
      const argv = maestroArgv(script, suite);

      assert.ok(!argv.includes('-e'), `${suite} received -e`);
      assert.ok(
        !argv.some((argument) => argument.includes('QUITOQUE')),
        `${suite} received a credential`,
      );
    }
  });

  test(`${script} does not treat web-edge-cases as the web suite`, () => {
    const argv = maestroArgv(script, 'web-edge-cases');

    assert.ok(!argv.some((argument) => argument.includes('QUITOQUE')));
    assert.ok(argv.includes('--config=tests/e2e/web-edge-cases.yaml'));
  });

  test(`${script} leaves the maestro argv otherwise untouched`, () => {
    assert.deepEqual(maestroArgv(script, 'search'), [
      'test',
      'tests/e2e/',
      '--config=tests/e2e/search.yaml',
      '--debug-output=maestro_logs_search',
      '--format',
      'junit',
      '-s',
      '1',
    ]);
  });
}

test('run-e2e-android.sh returns the maestro exit code after collecting logs', () => {
  const workDir = mkdtempSync(join(tmpdir(), 'e2e-exit-'));
  const binDir = withStubbedTools(workDir, 'exit 7');

  const result = spawnSync('/bin/bash', [join(SCRIPTS_DIR, 'run-e2e-android.sh'), 'search'], {
    cwd: workDir,
    env: { ...process.env, ...credentials, PATH: `${binDir}:${process.env.PATH}` },
    encoding: 'utf8',
  });

  assert.equal(result.status, 7);
  assert.ok(existsSync(join(workDir, 'collected')));
});

test('the credential gate honours a multi-suite allow list', () => {
  const granted = sourcedSnippet(
    'E2E_CREDENTIAL_SUITES="web ocr"\nmaestro_credential_args ocr\nprintf "%s\\n" "${MAESTRO_CREDENTIAL_ARGS[@]}"',
  );
  const withheld = sourcedSnippet(
    'E2E_CREDENTIAL_SUITES="web ocr"\nmaestro_credential_args search\necho "count=${#MAESTRO_CREDENTIAL_ARGS[@]}"',
  );

  assert.ok(granted.stdout.includes(`QUITOQUE_PASSWORD=${PASSWORD}`));
  assert.match(withheld.stdout, /count=0/);
});

test('variants collapse to one pattern when every escaping is identical', () => {
  assert.equal(sourcedSnippet('e2e_secret_variants "abcdef123456"').stdout, 'abcdef123456\n');
});

test('variants emit each distinct escaping exactly once', () => {
  const lines = sourcedSnippet(`e2e_secret_variants '${TRICKY}'`).stdout.split('\n').filter(Boolean);

  assert.ok(lines.length > 1);
  assert.equal(new Set(lines).size, lines.length);
});

test('a credential too short to match safely warns instead of passing silently', () => {
  const dir = makeTree({ 'maestro.log': 'the word abc appears here\n' });

  const result = runScript('check-artifact-secrets.sh', [dir], {
    QUITOQUE_USERNAME: 'abc',
    QUITOQUE_PASSWORD: '',
  });

  assert.equal(result.status, 0);
  assert.match(result.stderr, /::warning::/);
});

test('a credential holding a newline does not become a match-everything pattern', () => {
  const dir = makeTree({ 'maestro.log': 'totally unrelated\n' });

  const result = runScript('check-artifact-secrets.sh', [dir], {
    QUITOQUE_USERNAME: `${USERNAME}\n`,
    QUITOQUE_PASSWORD: '',
  });

  assert.equal(result.status, 0, result.stdout);
});

test('redaction clears credentials from every file in the tree', () => {
  const dir = makeTree({
    'maestro.log': `inputText ${USERNAME}\ninputText ${PASSWORD}\n`,
    'web/flow/commands.json': commandsDump(),
    'recipedia-app-logs.txt': 'clean line\n',
  });

  const result = runScript('redact-maestro-secrets.sh', [dir]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    readFileSync(join(dir, 'maestro.log'), 'utf8'),
    'inputText ***REDACTED***\ninputText ***REDACTED***\n',
  );
  assert.ok(!readFileSync(join(dir, 'web/flow/commands.json'), 'utf8').includes(PASSWORD));
  assert.equal(readFileSync(join(dir, 'recipedia-app-logs.txt'), 'utf8'), 'clean line\n');
});

test('redaction clears the percent-encoded form a logged URL would hold', () => {
  const dir = makeTree({ 'maestro.log': `openLink https://site/login?user=${urlEncoded}\n` });

  runScript('redact-maestro-secrets.sh', [dir]);

  assert.ok(!readFileSync(join(dir, 'maestro.log'), 'utf8').includes(urlEncoded));
});

test('redaction clears the JSON- and XML-escaped forms', () => {
  const dir = makeTree({
    'commands.json': `{"pw":"${jsonEscaped}"}\n`,
    'report.xml': `<failure message="${xmlEscaped}"/>\n`,
  });

  runScript('redact-maestro-secrets.sh', [dir], {
    QUITOQUE_USERNAME: USERNAME,
    QUITOQUE_PASSWORD: TRICKY,
  });

  assert.ok(!readFileSync(join(dir, 'commands.json'), 'utf8').includes(jsonEscaped));
  assert.ok(!readFileSync(join(dir, 'report.xml'), 'utf8').includes(xmlEscaped));
});

test('redaction handles regex and shell metacharacters in a password', () => {
  const nasty = 'p4$$.*+w0|rd\\(x)[y]^z/&#{q}';
  const dir = makeTree({ 'maestro.log': `inputText ${nasty}\nkeep me\n` });

  const result = runScript('redact-maestro-secrets.sh', [dir], {
    QUITOQUE_USERNAME: USERNAME,
    QUITOQUE_PASSWORD: nasty,
  });

  assert.equal(result.status, 0, result.stderr);
  const log = readFileSync(join(dir, 'maestro.log'), 'utf8');
  assert.ok(!log.includes(nasty));
  assert.match(log, /keep me/);
});

test('redaction scrubs a binary file without destroying its other bytes', () => {
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from(`meta:${PASSWORD}`, 'latin1'),
    Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]),
  ]);
  const dir = makeTree({ 'screenshot.png': png });

  runScript('redact-maestro-secrets.sh', [dir]);

  const after = readFileSync(join(dir, 'screenshot.png'), 'latin1');
  assert.ok(!after.includes(PASSWORD));
  assert.ok(after.startsWith('\x89PNG'));
  assert.ok(after.endsWith('\x00\x01\x02\xff\xfe'));
});

test('redaction accepts a plain file target beside a directory', () => {
  const dir = makeTree({ 'logs/maestro.log': `${USERNAME}\n`, 'report.xml': `${PASSWORD}\n` });

  const result = runScript('redact-maestro-secrets.sh', [join(dir, 'logs'), join(dir, 'report.xml')]);

  assert.equal(result.status, 0, result.stderr);
  assert.ok(!readFileSync(join(dir, 'logs/maestro.log'), 'utf8').includes(USERNAME));
  assert.ok(!readFileSync(join(dir, 'report.xml'), 'utf8').includes(PASSWORD));
});

test('redaction is idempotent', () => {
  const dir = makeTree({ 'maestro.log': `${USERNAME}\n` });

  runScript('redact-maestro-secrets.sh', [dir]);
  const once = readFileSync(join(dir, 'maestro.log'), 'utf8');
  runScript('redact-maestro-secrets.sh', [dir]);

  assert.equal(readFileSync(join(dir, 'maestro.log'), 'utf8'), once);
});

test('redaction reports no work when the credentials appear nowhere', () => {
  const dir = makeTree({ 'maestro.log': 'nothing sensitive\n' });

  const result = runScript('redact-maestro-secrets.sh', [dir]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /0 file\(s\)/);
});

test('redaction leaves the tree alone when no credentials are configured', () => {
  const dir = makeTree({ 'maestro.log': `${PASSWORD}\n` });

  const result = runScript('redact-maestro-secrets.sh', [dir], noCredentials);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(dir, 'maestro.log'), 'utf8'), `${PASSWORD}\n`);
});

test('redaction tolerates a target that was never produced', () => {
  const result = runScript('redact-maestro-secrets.sh', [join(tmpdir(), 'absent-e2e-logs')]);

  assert.equal(result.status, 0, result.stderr);
});

test('the guard fails on a literal credential and names the file', () => {
  const dir = makeTree({ 'web/commands.json': commandsDump() });

  const result = runScript('check-artifact-secrets.sh', [dir]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /commands\.json/);
});

test('the guard fails on every escaped form', () => {
  const encoded = makeTree({ 'maestro.log': `user=${urlEncoded}` });
  const json = makeTree({ 'commands.json': `{"pw":"${jsonEscaped}"}` });
  const xml = makeTree({ 'report.xml': `<failure message="${xmlEscaped}"/>` });
  const trickyCredentials = { QUITOQUE_USERNAME: USERNAME, QUITOQUE_PASSWORD: TRICKY };

  assert.equal(runScript('check-artifact-secrets.sh', [encoded]).status, 1);
  assert.equal(runScript('check-artifact-secrets.sh', [json], trickyCredentials).status, 1);
  assert.equal(runScript('check-artifact-secrets.sh', [xml], trickyCredentials).status, 1);
});

test('the guard reports every leaking credential, not just the first', () => {
  const dir = makeTree({ 'maestro.log': `${USERNAME} and ${PASSWORD}\n` });

  const result = runScript('check-artifact-secrets.sh', [dir]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /QUITOQUE_USERNAME leaks/);
  assert.match(result.stdout, /QUITOQUE_PASSWORD leaks/);
});

test('the guard never prints the credential it found', () => {
  const dir = makeTree({ 'web/commands.json': commandsDump() });

  const result = runScript('check-artifact-secrets.sh', [dir]);

  const output = `${result.stdout}${result.stderr}`;
  assert.ok(!output.includes(USERNAME));
  assert.ok(!output.includes(PASSWORD));
});

test('the guard passes once the tree has been redacted', () => {
  const dir = makeTree({
    'maestro.log': `${USERNAME} ${PASSWORD} ${urlEncoded}\n`,
    'web/commands.json': commandsDump(),
  });

  runScript('redact-maestro-secrets.sh', [dir]);

  assert.equal(runScript('check-artifact-secrets.sh', [dir]).status, 0);
});

test('the guard scans several targets and pinpoints the leaking one', () => {
  const clean = makeTree({ 'maestro.log': 'clean\n' });
  const leaking = makeTree({ 'maestro.log': `pw ${PASSWORD}\n` });

  const result = runScript('check-artifact-secrets.sh', [clean, leaking]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /QUITOQUE_PASSWORD leaks/);
});

test('the guard skips a missing target and still scans the others', () => {
  const leaking = makeTree({ 'maestro.log': `user ${USERNAME}\n` });

  const result = runScript('check-artifact-secrets.sh', [join(tmpdir(), 'absent-guard'), leaking]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /does not exist/);
});

test('the guard passes when no credentials are configured', () => {
  const dir = makeTree({ 'maestro.log': `${PASSWORD}\n` });

  assert.equal(runScript('check-artifact-secrets.sh', [dir], noCredentials).status, 0);
});

test('preparation drops the commands dump under either Maestro naming', () => {
  const dir = makeTree({
    '.maestro/tests/sess/commands.json': commandsDump(),
    '.maestro/tests/sess/commands-(3 - Web Quitoque Auth Flow).json': commandsDump(),
    '.maestro/tests/sess/maestro.log': `inputText ${PASSWORD}\n`,
    '.maestro/tests/sess/screenshot.png': '\x89PNG\x00frame\x00',
    '.maestro/tests/sess/hierarchy.json': '{"node":"Recipedia"}',
  });

  const result = runScript('prepare-maestro-logs.sh', [dir]);

  assert.equal(result.status, 0, result.stderr);
  assert.ok(!existsSync(join(dir, 'commands.json')));
  assert.ok(!existsSync(join(dir, 'commands-(3 - Web Quitoque Auth Flow).json')));
  assert.ok(!readFileSync(join(dir, 'maestro.log'), 'utf8').includes(PASSWORD));
  assert.ok(existsSync(join(dir, 'screenshot.png')));
  assert.equal(readFileSync(join(dir, 'hierarchy.json'), 'utf8'), '{"node":"Recipedia"}');
});

test('preparation survives a nested relative output directory', () => {
  const workDir = mkdtempSync(join(tmpdir(), 'nested-logs-'));
  makeTree(
    {
      'artifacts/suite/.maestro/tests/sess/commands.json': commandsDump(),
      'artifacts/suite/.maestro/tests/sess/maestro.log': `pw ${PASSWORD}\n`,
    },
    workDir,
  );

  const result = runScript('prepare-maestro-logs.sh', ['artifacts/suite'], credentials, workDir);

  assert.equal(result.status, 0, result.stderr);
  const log = join(workDir, 'artifacts/suite/maestro.log');
  assert.ok(existsSync(log), result.stdout);
  assert.ok(!readFileSync(log, 'utf8').includes(PASSWORD));
});

test('preparation leaves nothing for the guard to find', () => {
  const dir = makeTree({
    '.maestro/tests/sess/commands.json': commandsDump(),
    '.maestro/tests/sess/maestro.log': `login ${USERNAME} pw ${PASSWORD} url ${urlEncoded}\n`,
  });

  runScript('prepare-maestro-logs.sh', [dir]);

  assert.equal(runScript('check-artifact-secrets.sh', [dir]).status, 0);
});

test('preparation tolerates a missing directory', () => {
  const result = runScript('prepare-maestro-logs.sh', [join(tmpdir(), 'absent-prepare')]);

  assert.equal(result.status, 0, result.stderr);
});
