import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useVisibleImageLoader } from '@hooks/useVisibleImageLoader';
import { DiscoveredRecipe } from '@customTypes/BulkImportTypes';
import { bulkImportLogger } from '@utils/logger';

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

  test('does not retry a lookup that resolved to null when the effect reruns', async () => {
    const recipes = [recipeWithoutImage(0)];
    const fetchImageUrl = jest.fn(async () => null);

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
      expect(fetchImageUrl).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });

    rerender({ visibleUrls: new Set([urlOf(0)]) });
    rerender({ visibleUrls: new Set([urlOf(0)]) });
    await act(() => new Promise(resolve => setTimeout(resolve, 20)));

    expect(fetchImageUrl).toHaveBeenCalledTimes(1);
  });

  test('does not retry a rejected lookup in a loop when its own re-renders rerun the effect', async () => {
    const recipes = [recipeWithoutImage(0)];
    const fetchImageUrl = jest.fn(
      (_url: string, _signal: AbortSignal) =>
        new Promise<string>((_resolve, reject) => {
          setTimeout(() => reject(new Error('network down')), 5);
        })
    );

    renderHook(() =>
      useVisibleImageLoader({
        recipes,
        visibleUrls: new Set([urlOf(0)]),
        fetchImageUrl: (url, signal) => fetchImageUrl(url, signal),
        debounceMs: 0,
      })
    );

    await waitFor(() => {
      expect(fetchImageUrl).toHaveBeenCalled();
    });
    await act(() => new Promise(resolve => setTimeout(resolve, 50)));

    expect(fetchImageUrl).toHaveBeenCalledTimes(1);
  });

  test('refetches a lookup cancelled out of bounds once it becomes visible again', async () => {
    const recipes = Array.from({ length: 5 }, (_, i) => recipeWithoutImage(i));
    const fetchImageUrl = jest.fn(
      (url: string, signal: AbortSignal) =>
        new Promise<string>((resolve, reject) => {
          if (url === urlOf(0) && fetchImageUrl.mock.calls.length === 1) {
            signal.addEventListener('abort', () => reject(new Error('aborted')));
            return;
          }
          resolve(`${url}/image`);
        })
    );

    const { result, rerender } = renderHook(
      (props: { visibleUrls: Set<string> }) =>
        useVisibleImageLoader({
          recipes,
          visibleUrls: props.visibleUrls,
          fetchImageUrl,
          bufferSize: 0,
          debounceMs: 0,
        }),
      { initialProps: { visibleUrls: new Set([urlOf(0)]) } }
    );

    await waitFor(() => {
      expect(fetchImageUrl).toHaveBeenCalledTimes(1);
    });

    rerender({ visibleUrls: new Set([urlOf(4)]) });
    await waitFor(() => {
      expect(result.current.imageMap.get(urlOf(4))).toBe(`${urlOf(4)}/image`);
    });

    rerender({ visibleUrls: new Set([urlOf(0)]) });
    await waitFor(() => {
      expect(result.current.imageMap.get(urlOf(0))).toBe(`${urlOf(0)}/image`);
    });
  });

  test('does not start queued lookups after unmount', async () => {
    const recipes = [recipeWithoutImage(0), recipeWithoutImage(1)];
    const fetchImageUrl = jest.fn(
      (_url: string, signal: AbortSignal) =>
        new Promise<string>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        })
    );

    const { unmount } = renderHook(() =>
      useVisibleImageLoader({
        recipes,
        visibleUrls: new Set([urlOf(0), urlOf(1)]),
        fetchImageUrl,
        maxConcurrent: 1,
        debounceMs: 0,
      })
    );

    await waitFor(() => {
      expect(fetchImageUrl).toHaveBeenCalledTimes(1);
    });

    unmount();
    await act(() => new Promise(resolve => setTimeout(resolve, 20)));

    expect(fetchImageUrl).toHaveBeenCalledTimes(1);
  });

  test('aborts in-flight lookups and stops the queue when disabled', async () => {
    const recipes = [recipeWithoutImage(0), recipeWithoutImage(1)];
    const signals: AbortSignal[] = [];
    const fetchImageUrl = jest.fn(
      (_url: string, signal: AbortSignal) =>
        new Promise<string>((_resolve, reject) => {
          signals.push(signal);
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        })
    );

    const { result, rerender } = renderHook(
      (props: { enabled: boolean }) =>
        useVisibleImageLoader({
          recipes,
          visibleUrls: new Set([urlOf(0), urlOf(1)]),
          fetchImageUrl,
          enabled: props.enabled,
          maxConcurrent: 1,
          debounceMs: 0,
        }),
      { initialProps: { enabled: true } }
    );

    await waitFor(() => {
      expect(signals).toHaveLength(1);
    });

    rerender({ enabled: false });

    expect(signals[0]!.aborted).toBe(true);
    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });
    await act(() => new Promise(resolve => setTimeout(resolve, 20)));
    expect(fetchImageUrl).toHaveBeenCalledTimes(1);
  });

  test('does not fetch anything while disabled', async () => {
    const recipes = [recipeWithoutImage(0)];
    const fetchImageUrl = jest.fn(async (url: string) => `${url}/image`);

    renderHook(() =>
      useVisibleImageLoader({
        recipes,
        visibleUrls: new Set([urlOf(0)]),
        fetchImageUrl,
        enabled: false,
        debounceMs: 0,
      })
    );

    await act(() => new Promise(resolve => setTimeout(resolve, 20)));

    expect(fetchImageUrl).not.toHaveBeenCalled();
  });

  test('keeps tracking a refetched lookup when the aborted earlier attempt settles late', async () => {
    const recipes = Array.from({ length: 5 }, (_, i) => recipeWithoutImage(i));
    const lateRejections: (() => void)[] = [];
    const fetchImageUrl = jest.fn(
      (url: string, signal: AbortSignal) =>
        new Promise<string>((_resolve, reject) => {
          if (url !== urlOf(0)) return;
          signal.addEventListener('abort', () =>
            lateRejections.push(() => reject(new Error('aborted')))
          );
        })
    );
    const callsFor = (url: string) =>
      fetchImageUrl.mock.calls.filter(call => call[0] === url).length;

    const { rerender } = renderHook(
      (props: { visibleUrls: Set<string> }) =>
        useVisibleImageLoader({
          recipes,
          visibleUrls: props.visibleUrls,
          fetchImageUrl,
          bufferSize: 0,
          debounceMs: 0,
        }),
      { initialProps: { visibleUrls: new Set([urlOf(0)]) } }
    );

    await waitFor(() => {
      expect(callsFor(urlOf(0))).toBe(1);
    });

    rerender({ visibleUrls: new Set([urlOf(4)]) });
    await waitFor(() => {
      expect(lateRejections).toHaveLength(1);
    });

    rerender({ visibleUrls: new Set([urlOf(0)]) });
    await waitFor(() => {
      expect(callsFor(urlOf(0))).toBe(2);
    });

    await act(async () => {
      lateRejections[0]!();
    });
    rerender({ visibleUrls: new Set([urlOf(0)]) });
    await act(() => new Promise(resolve => setTimeout(resolve, 20)));

    expect(callsFor(urlOf(0))).toBe(2);
  });

  test('logs a serializable warning when a lookup rejects', async () => {
    const warnSpy = jest.spyOn(bulkImportLogger, 'warn');
    const recipes = [recipeWithoutImage(0)];
    const fetchImageUrl = jest.fn(async () => {
      throw new TypeError('lookup exploded');
    });

    renderHook(() =>
      useVisibleImageLoader({
        recipes,
        visibleUrls: new Set([urlOf(0)]),
        fetchImageUrl,
        debounceMs: 0,
      })
    );

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith('Image lookup rejected', expect.anything());
    });
    const loggedContext = JSON.parse(JSON.stringify(warnSpy.mock.calls[0]![1]));
    expect(loggedContext).toEqual({
      url: urlOf(0),
      error: expect.objectContaining({ name: 'TypeError', message: 'lookup exploded' }),
    });
    warnSpy.mockRestore();
  });

  test('does not warn when a lookup rejects because it was aborted', async () => {
    const warnSpy = jest.spyOn(bulkImportLogger, 'warn');
    const recipes = [recipeWithoutImage(0)];
    const fetchImageUrl = jest.fn(
      (_url: string, signal: AbortSignal) =>
        new Promise<string>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')));
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
      expect(fetchImageUrl).toHaveBeenCalled();
    });
    unmount();
    await act(() => new Promise(resolve => setTimeout(resolve, 20)));

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('fetches a url only once when it appears twice in the recipe list', async () => {
    const recipes = [recipeWithoutImage(0), recipeWithoutImage(0)];
    const fetchImageUrl = jest.fn(async (url: string) => `${url}/image`);

    const { result } = renderHook(() =>
      useVisibleImageLoader({
        recipes,
        visibleUrls: new Set([urlOf(0)]),
        fetchImageUrl,
        debounceMs: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.imageMap.get(urlOf(0))).toBe(`${urlOf(0)}/image`);
    });
    expect(fetchImageUrl).toHaveBeenCalledTimes(1);
  });

  test('resumes loading and refetches aborted lookups once re-enabled', async () => {
    const recipes = [recipeWithoutImage(0)];
    const fetchImageUrl = jest.fn(
      (url: string, signal: AbortSignal) =>
        new Promise<string>((resolve, reject) => {
          if (fetchImageUrl.mock.calls.length === 1) {
            signal.addEventListener('abort', () => reject(new Error('aborted')));
            return;
          }
          resolve(`${url}/image`);
        })
    );

    const { result, rerender } = renderHook(
      (props: { enabled: boolean }) =>
        useVisibleImageLoader({
          recipes,
          visibleUrls: new Set([urlOf(0)]),
          fetchImageUrl,
          enabled: props.enabled,
          debounceMs: 0,
        }),
      { initialProps: { enabled: true } }
    );

    await waitFor(() => {
      expect(fetchImageUrl).toHaveBeenCalledTimes(1);
    });

    rerender({ enabled: false });
    rerender({ enabled: true });

    await waitFor(() => {
      expect(result.current.imageMap.get(urlOf(0))).toBe(`${urlOf(0)}/image`);
    });
    expect(fetchImageUrl).toHaveBeenCalledTimes(2);
  });

  test('fetches after the default debounce delay when none is given', async () => {
    const recipes = [recipeWithoutImage(0)];
    const fetchImageUrl = jest.fn(async (url: string) => `${url}/image`);

    const { result } = renderHook(() =>
      useVisibleImageLoader({
        recipes,
        visibleUrls: new Set([urlOf(0)]),
        fetchImageUrl,
      })
    );

    await waitFor(() => {
      expect(result.current.imageMap.get(urlOf(0))).toBe(`${urlOf(0)}/image`);
    });
  });
});
