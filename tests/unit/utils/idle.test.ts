import { cancelIdle, runWhenIdle } from '@utils/idle';
import {
  flushIdleTasks,
  unstable_IdlePriority,
  unstable_cancelCallback,
  unstable_scheduleCallback,
} from '@mocks/deps/scheduler-mock';

jest.mock('scheduler', () => require('@mocks/deps/scheduler-mock'));

describe('runWhenIdle', () => {
  test('schedules the callback at idle priority', () => {
    const callback = jest.fn();
    runWhenIdle(callback);

    expect(unstable_scheduleCallback).toHaveBeenCalledWith(unstable_IdlePriority, callback);
  });

  test('runs the callback only once idle time is granted', () => {
    const callback = jest.fn();
    runWhenIdle(callback);
    expect(callback).not.toHaveBeenCalled();

    flushIdleTasks();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('returns the scheduler handle', () => {
    const handle = runWhenIdle(jest.fn());

    expect(handle).toBe(unstable_scheduleCallback.mock.results[0]!.value);
  });
});

describe('cancelIdle', () => {
  test('cancels the scheduled callback through the scheduler', () => {
    const callback = jest.fn();
    const handle = runWhenIdle(callback);

    cancelIdle(handle);
    flushIdleTasks();

    expect(unstable_cancelCallback).toHaveBeenCalledWith(handle);
    expect(callback).not.toHaveBeenCalled();
  });
});
