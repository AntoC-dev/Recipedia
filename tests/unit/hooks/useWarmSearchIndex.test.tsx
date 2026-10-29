import { act, renderHook } from '@testing-library/react-native';
import { useWarmSearchIndex } from '@hooks/useWarmSearchIndex';
import { cancelIdle, flushIdle, runWhenIdle } from '@mocks/utils/idle-mock';

jest.mock('@utils/idle', () => require('@mocks/utils/idle-mock'));

describe('useWarmSearchIndex', () => {
  test('schedules an idle build for a non-empty corpus', async () => {
    const build = jest.fn();
    const corpus = [{ name: 'Italian' }];

    await renderHook(() => useWarmSearchIndex(build, corpus));
    expect(build).not.toHaveBeenCalled();

    await act(() => flushIdle());

    expect(build).toHaveBeenCalledWith(corpus);
  });

  test('never schedules a build for an empty corpus', async () => {
    const build = jest.fn();

    await renderHook(() => useWarmSearchIndex(build, []));
    await act(() => flushIdle());

    expect(runWhenIdle).not.toHaveBeenCalled();
    expect(build).not.toHaveBeenCalled();
  });

  test('cancels a pending warm when the corpus changes before it runs', async () => {
    const build = jest.fn();
    const first = [{ name: 'Italian' }];
    const second = [{ name: 'Mexican' }];

    const { rerender } = await renderHook(
      ({ corpus }: { corpus: { name: string }[] }) => useWarmSearchIndex(build, corpus),
      { initialProps: { corpus: first } }
    );

    await rerender({ corpus: second });
    await act(() => flushIdle());

    expect(cancelIdle).toHaveBeenCalledTimes(1);
    expect(build).toHaveBeenCalledTimes(1);
    expect(build).toHaveBeenCalledWith(second);
  });

  test('cancels the pending warm on unmount', async () => {
    const build = jest.fn();

    const { unmount } = await renderHook(() => useWarmSearchIndex(build, [{ name: 'Italian' }]));
    await unmount();
    await act(() => flushIdle());

    expect(cancelIdle).toHaveBeenCalled();
    expect(build).not.toHaveBeenCalled();
  });

  test('reschedules the warm with the new builder when the build function changes', async () => {
    const firstBuild = jest.fn();
    const secondBuild = jest.fn();
    const corpus = [{ name: 'Italian' }];

    const { rerender } = await renderHook(
      ({ build }: { build: (corpus: { name: string }[]) => void }) =>
        useWarmSearchIndex(build, corpus),
      { initialProps: { build: firstBuild } }
    );

    await rerender({ build: secondBuild });
    await act(() => flushIdle());

    expect(cancelIdle).toHaveBeenCalledTimes(1);
    expect(firstBuild).not.toHaveBeenCalled();
    expect(secondBuild).toHaveBeenCalledWith(corpus);
  });

  test('cancels the pending warm and schedules nothing when the corpus becomes empty', async () => {
    const build = jest.fn();

    const { rerender } = await renderHook(
      ({ corpus }: { corpus: { name: string }[] }) => useWarmSearchIndex(build, corpus),
      { initialProps: { corpus: [{ name: 'Italian' }] as { name: string }[] } }
    );

    await rerender({ corpus: [] });
    await act(() => flushIdle());

    expect(runWhenIdle).toHaveBeenCalledTimes(1);
    expect(cancelIdle).toHaveBeenCalledTimes(1);
    expect(build).not.toHaveBeenCalled();
  });

  test('does not reschedule while the corpus reference is unchanged across re-renders', async () => {
    const build = jest.fn();
    const corpus = [{ name: 'Italian' }];

    const { rerender } = await renderHook(() => useWarmSearchIndex(build, corpus));
    await rerender({});
    await act(() => flushIdle());

    expect(runWhenIdle).toHaveBeenCalledTimes(1);
    expect(cancelIdle).not.toHaveBeenCalled();
    expect(build).toHaveBeenCalledTimes(1);
  });
});
