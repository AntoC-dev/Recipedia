import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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

const runCollect = syslog => {
  const workDir = mkdtempSync(join(tmpdir(), 'collect-ios-'));
  const binDir = join(workDir, 'bin');
  mkdirSync(binDir, { recursive: true });
  writeFileSync(join(binDir, 'xcrun'), '#!/bin/bash\nexit 1\n');
  chmodSync(join(binDir, 'xcrun'), 0o755);

  const syslogFile = join(workDir, SYSLOG_PATH);
  mkdirSync(dirname(syslogFile), { recursive: true });
  writeFileSync(syslogFile, syslog, 'latin1');

  const result = spawnSync('/bin/bash', [join(SCRIPTS_DIR, 'collect-ios-logs.sh'), SUITE, 'UDID'], {
    cwd: workDir,
    env: { ...process.env, HOME: workDir, PATH: `${binDir}:${process.env.PATH}` },
    encoding: 'utf8',
  });

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

test('empties a simulator syslog with no allowlisted process', () => {
  const { status, filtered } = runCollect(`${droppedLines.join('\n')}\n`);

  assert.equal(status, 0);
  assert.equal(filtered, '');
});
