type ScheduledTask = { cb: () => void; cancelled: boolean };

export const unstable_IdlePriority = 5;

export const unstable_scheduleCallback = jest.fn(
  (_priority: number, cb: () => void): ScheduledTask => ({ cb, cancelled: false })
);

export const unstable_cancelCallback = jest.fn((task: ScheduledTask) => {
  task.cancelled = true;
});

export const flushIdleTasks = (): void => {
  for (const { value } of unstable_scheduleCallback.mock.results) {
    if (!value.cancelled) {
      value.cb();
    }
  }
};
