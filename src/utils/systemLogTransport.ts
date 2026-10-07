/**
 * Tag prepended to every line the app writes to the platform system log.
 * CI greps on it to pull the app's own lines out of logcat / the simulator syslog.
 */
export const SYSTEM_LOG_TAG = '[RecipediaApp]';

/**
 * Longest payload written per system-log call. iOS unified logging truncates dynamic
 * strings at 1024 bytes, so longer lines are split instead of silently losing their tail.
 */
export const SYSTEM_LOG_MAX_CHUNK = 800;

/**
 * react-native-logs transport that mirrors each formatted log entry to the platform
 * system log (logcat on Android, the unified log on iOS) through `console.log`.
 *
 * App data is wiped by E2E `clearState` (`pm clear` / `simctl uninstall`), taking the
 * file log with it, while the system log outlives it. Every line, and every
 * {@link SYSTEM_LOG_MAX_CHUNK}-character slice of a long line, is tagged and emitted on its
 * own so a grep on {@link SYSTEM_LOG_TAG} keeps stack traces and JSON payloads whole.
 *
 * @param props - Transport props from react-native-logs
 * @param props.msg - Fully formatted log entry (date, extension, level and message)
 */
export const systemLogTransport = ({ msg }: { msg: string }): void => {
  const chunkPattern = new RegExp(`.{1,${SYSTEM_LOG_MAX_CHUNK}}`, 'g');
  for (const line of msg.replace(/\n$/, '').split('\n')) {
    for (const chunk of line.match(chunkPattern) ?? ['']) {
      // eslint-disable-next-line no-console
      console.log(`${SYSTEM_LOG_TAG} ${chunk}`);
    }
  }
};
