type IdleHandle = { cb: () => void; cancelled: boolean };

export const runWhenIdle = jest.fn((cb: () => void): IdleHandle => ({ cb, cancelled: false }));

export const cancelIdle = jest.fn((handle: IdleHandle) => {
  handle.cancelled = true;
});

export const flushIdle = (): void => {
  for (const { value } of runWhenIdle.mock.results) {
    if (!value.cancelled) {
      value.cb();
    }
  }
};
