import { act, renderHook } from '@testing-library/react-native';
import { useWarmSearchIndex } from '@hooks/useWarmSearchIndex';

const idleGlobal = globalThis as unknown as {
  requestIdleCallback?: unknown;
  cancelIdleCallback?: unknown;
};

describe('useWarmSearchIndex', () => {
  const originalRequest = idleGlobal.requestIdleCallback;
  const originalCancel = idleGlobal.cancelIdleCallback;

  beforeEach(() => {
    jest.useFakeTimers();
    idleGlobal.requestIdleCallback = undefined;
    idleGlobal.cancelIdleCallback = undefined;
  });

  afterEach(() => {
    jest.useRealTimers();
    idleGlobal.requestIdleCallback = originalRequest;
    idleGlobal.cancelIdleCallback = originalCancel;
  });

  test('builds the index during idle time for a non-empty corpus', () => {
    const build = jest.fn();
    const corpus = [{ name: 'Italian' }];

    renderHook(() => useWarmSearchIndex(build, corpus));
    expect(build).not.toHaveBeenCalled();

    act(() => {
      jest.runAllTimers();
    });

    expect(build).toHaveBeenCalledWith(corpus);
  });

  test('never schedules a build for an empty corpus', () => {
    const build = jest.fn();

    renderHook(() => useWarmSearchIndex(build, []));

    act(() => {
      jest.runAllTimers();
    });

    expect(build).not.toHaveBeenCalled();
  });

  test('cancels a pending warm when the corpus changes before it runs', () => {
    const build = jest.fn();
    const first = [{ name: 'Italian' }];
    const second = [{ name: 'Mexican' }];

    const { rerender } = renderHook(
      ({ corpus }: { corpus: { name: string }[] }) => useWarmSearchIndex(build, corpus),
      { initialProps: { corpus: first } }
    );

    rerender({ corpus: second });

    act(() => {
      jest.runAllTimers();
    });

    expect(build).toHaveBeenCalledTimes(1);
    expect(build).toHaveBeenCalledWith(second);
  });

  test('cancels the pending warm on unmount', () => {
    const build = jest.fn();

    const { unmount } = renderHook(() => useWarmSearchIndex(build, [{ name: 'Italian' }]));
    unmount();

    act(() => {
      jest.runAllTimers();
    });

    expect(build).not.toHaveBeenCalled();
  });
});
