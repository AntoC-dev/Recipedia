import { renderHook } from '@testing-library/react-native';
import { useDeferredMount } from '@hooks/useDeferredMount';

describe('useDeferredMount', () => {
  test('resolves to true once the deferred render commits', async () => {
    const { result } = await renderHook(() => useDeferredMount());

    expect(result.current).toBe(true);
  });
});
