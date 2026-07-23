import { renderHook } from '@testing-library/react-native';
import { useDeferredMount } from '@hooks/useDeferredMount';

describe('useDeferredMount', () => {
  test('resolves to true once the deferred render commits', () => {
    const { result } = renderHook(() => useDeferredMount());

    expect(result.current).toBe(true);
  });
});
