import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const SUITE = 'search';
const SYSLOG_PATH = `maestro_logs_${SUITE}/.maestro/tests/session/1 - Flow/logs/device-simulator.log`;

const header = process => `2026-10-20 09:03:30.090898+0000  localhost ${process}[1959]:`;

const keptLines = [
  `${header('SpringBoard')} (FrontBoard) scene created`,
  `${header('Recipedia')} (libsystem) abort() called`,
  `${header('maestro-driver-iosUITests-Runner')} tap at 10,20`,
  `${header('kernel')} memorystatus: killing Recipedia`,
  `${header('testmanagerd')} binary ÿþ payload`,
];

const droppedLines = [
  `${header('backboardd')} touch event`,
  `${header('XSpringBoard')} lookalike process`,
  `${header('SpringBoardFoundation')} prefix lookalike`,
  '2026-10-20 09:03:30.090898+0000  localhost Recipedia: no pid',
];

const collectIn = workDir => {
  const binDir = join(workDir, 'bin');
  mkdirSync(binDir, { recursive: true });
  writeFileSync(join(binDir, 'xcrun'), '#!/bin/bash\nexit 1\n');
  chmodSync(join(binDir, 'xcrun'), 0o755);

  return spawnSync('/bin/bash', [join(SCRIPTS_DIR, 'collect-ios-logs.sh'), SUITE, 'UDID'], {
    cwd: workDir,
    env: { ...process.env, HOME: workDir, PATH: `${binDir}:${process.env.PATH}` },
    encoding: 'utf8',
  });
};

const runCollect = syslog => {
  const workDir = mkdtempSync(join(tmpdir(), 'collect-ios-'));
  const syslogFile = join(workDir, SYSLOG_PATH);
  mkdirSync(dirname(syslogFile), { recursive: true });
  writeFileSync(syslogFile, syslog, 'latin1');

  const result = collectIn(workDir);

  return { status: result.status, filtered: readFileSync(syslogFile, 'latin1') };
};

test('keeps only the allowlisted processes in the simulator syslog', () => {
  const interleaved = keptLines.flatMap((line, index) =>
    droppedLines[index] ? [droppedLines[index], line] : [line]
  );

  const { status, filtered } = runCollect(`${interleaved.join('\n')}\n`);

  assert.equal(status, 0);
  assert.equal(filtered, `${keptLines.join('\n')}\n`);
});

const nowSeconds = Math.floor(Date.now() / 1000);

const writeAged = (path, ageSeconds) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, 'crash\n');
  utimesSync(path, nowSeconds - ageSeconds, nowSeconds - ageSeconds);
};

const collectCrashReports = ({ withWindow }) => {
  const workDir = mkdtempSync(join(tmpdir(), 'collect-ios-crash-'));
  const reportsDir = join(workDir, 'Library', 'Logs', 'DiagnosticReports');
  writeAged(join(reportsDir, 'Recipedia-before.ips'), 400);
  writeAged(join(reportsDir, 'Recipedia-during.ips'), 200);
  writeAged(join(reportsDir, 'Recipedia-after.ips'), 50);
  if (withWindow) {
    writeAged(join(workDir, `.e2e-window-${SUITE}-start`), 300);
    writeAged(join(workDir, `.e2e-window-${SUITE}-end`), 100);
  }

  const result = collectIn(workDir);
  const crashDir = join(workDir, `maestro_logs_${SUITE}`, 'crash-reports');

  return { status: result.status, collected: existsSync(crashDir) ? readdirSync(crashDir).sort() : [] };
};

test('keeps only the crash reports written while the suite ran', () => {
  const { status, collected } = collectCrashReports({ withWindow: true });

  assert.equal(status, 0);
  assert.deepEqual(collected, ['Recipedia-during.ips']);
});

test('collects no crash report for a suite that never started', () => {
  const { status, collected } = collectCrashReports({ withWindow: false });

  assert.equal(status, 0);
  assert.deepEqual(collected, []);
});

test('empties a simulator syslog with no allowlisted process', () => {
  const { status, filtered } = runCollect(`${droppedLines.join('\n')}\n`);

  assert.equal(status, 0);
  assert.equal(filtered, '');
});
