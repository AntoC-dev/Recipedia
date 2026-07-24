import { act, renderHook } from '@testing-library/react-native';
import { useWarmSearchIndex } from '@hooks/useWarmSearchIndex';
import { cancelIdle, flushIdle, runWhenIdle } from '@mocks/utils/idle-mock';

jest.mock('@utils/idle', () => require('@mocks/utils/idle-mock'));

describe('useWarmSearchIndex', () => {
  test('schedules an idle build for a non-empty corpus', () => {
    const build = jest.fn();
    const corpus = [{ name: 'Italian' }];

    renderHook(() => useWarmSearchIndex(build, corpus));
    expect(build).not.toHaveBeenCalled();

    act(() => flushIdle());

    expect(build).toHaveBeenCalledWith(corpus);
  });

  test('never schedules a build for an empty corpus', () => {
    const build = jest.fn();

    renderHook(() => useWarmSearchIndex(build, []));
    act(() => flushIdle());

    expect(runWhenIdle).not.toHaveBeenCalled();
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
    act(() => flushIdle());

    expect(cancelIdle).toHaveBeenCalledTimes(1);
    expect(build).toHaveBeenCalledTimes(1);
    expect(build).toHaveBeenCalledWith(second);
  });

  test('cancels the pending warm on unmount', () => {
    const build = jest.fn();

    const { unmount } = renderHook(() => useWarmSearchIndex(build, [{ name: 'Italian' }]));
    unmount();
    act(() => flushIdle());

    expect(cancelIdle).toHaveBeenCalled();
    expect(build).not.toHaveBeenCalled();
  });

  test('reschedules the warm with the new builder when the build function changes', () => {
    const firstBuild = jest.fn();
    const secondBuild = jest.fn();
    const corpus = [{ name: 'Italian' }];

    const { rerender } = renderHook(
      ({ build }: { build: (corpus: { name: string }[]) => void }) =>
        useWarmSearchIndex(build, corpus),
      { initialProps: { build: firstBuild } }
    );

    rerender({ build: secondBuild });
    act(() => flushIdle());

    expect(cancelIdle).toHaveBeenCalledTimes(1);
    expect(firstBuild).not.toHaveBeenCalled();
    expect(secondBuild).toHaveBeenCalledWith(corpus);
  });

  test('cancels the pending warm and schedules nothing when the corpus becomes empty', () => {
    const build = jest.fn();

    const { rerender } = renderHook(
      ({ corpus }: { corpus: { name: string }[] }) => useWarmSearchIndex(build, corpus),
      { initialProps: { corpus: [{ name: 'Italian' }] as { name: string }[] } }
    );

    rerender({ corpus: [] });
    act(() => flushIdle());

    expect(runWhenIdle).toHaveBeenCalledTimes(1);
    expect(cancelIdle).toHaveBeenCalledTimes(1);
    expect(build).not.toHaveBeenCalled();
  });

  test('does not reschedule while the corpus reference is unchanged across re-renders', () => {
    const build = jest.fn();
    const corpus = [{ name: 'Italian' }];

    const { rerender } = renderHook(() => useWarmSearchIndex(build, corpus));
    rerender({});
    act(() => flushIdle());

    expect(runWhenIdle).toHaveBeenCalledTimes(1);
    expect(cancelIdle).not.toHaveBeenCalled();
    expect(build).toHaveBeenCalledTimes(1);
  });
});
