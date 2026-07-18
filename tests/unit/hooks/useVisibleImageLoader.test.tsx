import { renderHook, waitFor } from '@testing-library/react-native';
import { useVisibleImageLoader } from '@hooks/useVisibleImageLoader';
import { DiscoveredRecipe } from '@customTypes/BulkImportTypes';

const recipeWithoutImage = (id: number): DiscoveredRecipe => ({
  url: `https://example.com/recipe-${id}`,
  title: `Recipe ${id}`,
});

const recipeWithImage = (id: number): DiscoveredRecipe => ({
  url: `https://example.com/recipe-${id}`,
  title: `Recipe ${id}`,
  imageUrl: `https://example.com/image-${id}.jpg`,
});

const urlOf = (id: number) => `https://example.com/recipe-${id}`;

describe('useVisibleImageLoader', () => {
  test('fetches image urls for visible recipes and exposes them in imageMap', async () => {
    const recipes = [recipeWithoutImage(0), recipeWithoutImage(1)];
    const fetchImageUrl = jest.fn(async (url: string) => `${url}/image`);

    const { result } = renderHook(() =>
      useVisibleImageLoader({
        recipes,
        visibleUrls: new Set([urlOf(0), urlOf(1)]),
        fetchImageUrl,
        debounceMs: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.imageMap.size).toBe(2);
    });

    expect(result.current.imageMap.get(urlOf(0))).toBe(`${urlOf(0)}/image`);
    expect(result.current.imageMap.get(urlOf(1))).toBe(`${urlOf(1)}/image`);
    expect(result.current.pendingCount).toBe(0);
  });

  test('skips recipes that already have an image', async () => {
    const recipes = [recipeWithImage(0), recipeWithoutImage(1)];
    const fetchImageUrl = jest.fn(async (url: string) => `${url}/image`);

    const { result } = renderHook(() =>
      useVisibleImageLoader({
        recipes,
        visibleUrls: new Set([urlOf(0), urlOf(1)]),
        fetchImageUrl,
        debounceMs: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.imageMap.size).toBe(1);
    });

    expect(fetchImageUrl).toHaveBeenCalledTimes(1);
    expect(fetchImageUrl).toHaveBeenCalledWith(urlOf(1), expect.anything());
  });

  test('prefetches buffer recipes beyond the visible range', async () => {
    const recipes = Array.from({ length: 10 }, (_, i) => recipeWithoutImage(i));
    const fetchImageUrl = jest.fn(async (url: string) => `${url}/image`);

    renderHook(() =>
      useVisibleImageLoader({
        recipes,
        visibleUrls: new Set([urlOf(0)]),
        fetchImageUrl,
        bufferSize: 2,
        debounceMs: 0,
      })
    );

    await waitFor(() => {
      expect(fetchImageUrl).toHaveBeenCalledTimes(3);
    });

    const fetchedUrls = fetchImageUrl.mock.calls.map(call => call[0]);
    expect(fetchedUrls).toEqual(expect.arrayContaining([urlOf(0), urlOf(1), urlOf(2)]));
    expect(fetchedUrls).not.toContain(urlOf(5));
  });

  test('does not store a result when the fetch resolves to null', async () => {
    const recipes = [recipeWithoutImage(0)];
    const fetchImageUrl = jest.fn(async () => null);

    const { result } = renderHook(() =>
      useVisibleImageLoader({
        recipes,
        visibleUrls: new Set([urlOf(0)]),
        fetchImageUrl,
        debounceMs: 0,
      })
    );

    await waitFor(() => {
      expect(fetchImageUrl).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });

    expect(result.current.imageMap.size).toBe(0);
  });

  test('recovers from a rejected fetch without storing a result', async () => {
    const recipes = [recipeWithoutImage(0), recipeWithoutImage(1)];
    const fetchImageUrl = jest.fn(async (url: string) => {
      if (url === urlOf(0)) throw new Error('network down');
      return `${url}/image`;
    });

    const { result } = renderHook(() =>
      useVisibleImageLoader({
        recipes,
        visibleUrls: new Set([urlOf(0), urlOf(1)]),
        fetchImageUrl,
        debounceMs: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.imageMap.get(urlOf(1))).toBe(`${urlOf(1)}/image`);
    });
    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });

    expect(result.current.imageMap.has(urlOf(0))).toBe(false);
  });

  test('limits concurrent fetches to maxConcurrent and drains the queue as fetches resolve', async () => {
    const recipes = Array.from({ length: 4 }, (_, i) => recipeWithoutImage(i));
    const resolvers: (() => void)[] = [];
    const fetchImageUrl = jest.fn(
      (url: string) =>
        new Promise<string>(resolve => {
          resolvers.push(() => resolve(`${url}/image`));
        })
    );

    const { result } = renderHook(() =>
      useVisibleImageLoader({
        recipes,
        visibleUrls: new Set(recipes.map(r => r.url)),
        fetchImageUrl,
        maxConcurrent: 2,
        debounceMs: 0,
      })
    );

    await waitFor(() => {
      expect(fetchImageUrl).toHaveBeenCalledTimes(2);
    });
    expect(result.current.pendingCount).toBe(2);

    resolvers[0]!();

    await waitFor(() => {
      expect(fetchImageUrl).toHaveBeenCalledTimes(3);
    });

    resolvers[1]!();
    resolvers[2]!();

    await waitFor(() => {
      expect(fetchImageUrl).toHaveBeenCalledTimes(4);
    });

    resolvers[3]!();

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });
    expect(result.current.imageMap.size).toBe(4);
  });

  test('aborts in-flight fetches on unmount', async () => {
    const recipes = [recipeWithoutImage(0)];
    const signals: AbortSignal[] = [];
    const fetchImageUrl = jest.fn(
      (_url: string, signal: AbortSignal) =>
        new Promise<string>(() => {
          signals.push(signal);
        })
    );

    const { unmount } = renderHook(() =>
      useVisibleImageLoader({
        recipes,
        visibleUrls: new Set([urlOf(0)]),
        fetchImageUrl,
        debounceMs: 0,
      })
    );

    await waitFor(() => {
      expect(signals).toHaveLength(1);
    });
    expect(signals[0]!.aborted).toBe(false);

    unmount();

    expect(signals[0]!.aborted).toBe(true);
  });

  test('cancels out-of-bounds fetches and drops a result that resolves after abort', async () => {
    const recipes = Array.from({ length: 5 }, (_, i) => recipeWithoutImage(i));
    let resolveFirst: ((value: string) => void) | undefined;
    const fetchImageUrl = jest.fn((url: string) => {
      if (url === urlOf(0)) {
        return new Promise<string>(resolve => {
          resolveFirst = () => resolve(`${url}/image`);
        });
      }
      return Promise.resolve(`${url}/image`);
    });

    const { result, rerender } = renderHook(
      (props: { visibleUrls: Set<string> }) =>
        useVisibleImageLoader({
          recipes,
          visibleUrls: props.visibleUrls,
          fetchImageUrl,
          bufferSize: 0,
          maxConcurrent: 2,
          debounceMs: 0,
        }),
      { initialProps: { visibleUrls: new Set([urlOf(0)]) } }
    );

    await waitFor(() => {
      expect(fetchImageUrl).toHaveBeenCalledWith(urlOf(0), expect.anything());
    });

    rerender({ visibleUrls: new Set([urlOf(4)]) });

    await waitFor(() => {
      expect(result.current.imageMap.get(urlOf(4))).toBe(`${urlOf(4)}/image`);
    });

    resolveFirst!(`${urlOf(0)}/image`);

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });

    expect(result.current.imageMap.has(urlOf(0))).toBe(false);
  });

  test('reprocesses visibility when the visible set changes', async () => {
    const recipes = [recipeWithoutImage(0), recipeWithoutImage(1)];
    const fetchImageUrl = jest.fn(async (url: string) => `${url}/image`);

    const { result, rerender } = renderHook(
      (props: { visibleUrls: Set<string> }) =>
        useVisibleImageLoader({
          recipes,
          visibleUrls: props.visibleUrls,
          fetchImageUrl,
          debounceMs: 0,
        }),
      { initialProps: { visibleUrls: new Set([urlOf(0)]) } }
    );

    await waitFor(() => {
      expect(result.current.imageMap.get(urlOf(0))).toBe(`${urlOf(0)}/image`);
    });

    rerender({ visibleUrls: new Set([urlOf(1)]) });

    await waitFor(() => {
      expect(result.current.imageMap.get(urlOf(1))).toBe(`${urlOf(1)}/image`);
    });
  });
});
