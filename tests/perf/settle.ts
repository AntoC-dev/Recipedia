import { act } from '@testing-library/react-native';

const QUIET_PASSES_REQUIRED = 1;
const MAX_PASSES = 50;

const nextMacrotask = () => new Promise<void>(resolve => setImmediate(resolve));

export function installPerfTimers() {
  jest.useFakeTimers({
    doNotFake: [
      'Date',
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
    ],
  });
}

export function uninstallPerfTimers() {
  jest.clearAllTimers();
  jest.useRealTimers();
}

export async function settle() {
  let quietPasses = 0;
  for (let pass = 0; pass < MAX_PASSES && quietPasses < QUIET_PASSES_REQUIRED; pass += 1) {
    const hadPendingTimers = jest.getTimerCount() > 0;
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
      await nextMacrotask();
    });
    quietPasses = hadPendingTimers || jest.getTimerCount() > 0 ? 0 : quietPasses + 1;
  }
  if (quietPasses < QUIET_PASSES_REQUIRED) {
    console.warn(
      `settle: timers still pending after ${MAX_PASSES} passes; a perpetual timer inflates render counts`
    );
  }
}
