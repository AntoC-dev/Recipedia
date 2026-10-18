import {
  SYSTEM_LOG_MAX_CHUNK,
  SYSTEM_LOG_TAG,
  systemLogTransport,
} from '@utils/systemLogTransport';

describe('systemLogTransport', () => {
  let consoleLog: jest.SpyInstance;

  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLog.mockRestore();
  });

  test('prefixes a single-line entry with the tag', () => {
    systemLogTransport({ msg: '6:29:33 PM | App | INFO : Welcome skipped' });

    expect(consoleLog).toHaveBeenCalledTimes(1);
    expect(consoleLog).toHaveBeenCalledWith(
      `${SYSTEM_LOG_TAG} 6:29:33 PM | App | INFO : Welcome skipped`
    );
  });

  test('emits each line of a multi-line entry as its own tagged call', () => {
    systemLogTransport({ msg: 'first\nsecond\nthird' });

    expect(consoleLog.mock.calls).toEqual([
      [`${SYSTEM_LOG_TAG} first`],
      [`${SYSTEM_LOG_TAG} second`],
      [`${SYSTEM_LOG_TAG} third`],
    ]);
  });

  test('does not emit a tagged empty line for a trailing newline', () => {
    systemLogTransport({ msg: 'entry\n' });

    expect(consoleLog.mock.calls).toEqual([[`${SYSTEM_LOG_TAG} entry`]]);
  });

  test('keeps blank lines inside an entry tagged', () => {
    systemLogTransport({ msg: 'a\n\nb' });

    expect(consoleLog.mock.calls).toEqual([
      [`${SYSTEM_LOG_TAG} a`],
      [`${SYSTEM_LOG_TAG} `],
      [`${SYSTEM_LOG_TAG} b`],
    ]);
  });

  test('splits a line longer than the chunk size without losing characters', () => {
    const line = 'x'.repeat(SYSTEM_LOG_MAX_CHUNK * 2 + 5);

    systemLogTransport({ msg: line });

    expect(consoleLog.mock.calls).toEqual([
      [`${SYSTEM_LOG_TAG} ${'x'.repeat(SYSTEM_LOG_MAX_CHUNK)}`],
      [`${SYSTEM_LOG_TAG} ${'x'.repeat(SYSTEM_LOG_MAX_CHUNK)}`],
      [`${SYSTEM_LOG_TAG} xxxxx`],
    ]);
  });

  test('keeps a line of exactly the chunk size in one call', () => {
    systemLogTransport({ msg: 'y'.repeat(SYSTEM_LOG_MAX_CHUNK) });

    expect(consoleLog).toHaveBeenCalledTimes(1);
  });
});
