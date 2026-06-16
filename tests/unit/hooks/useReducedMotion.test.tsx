import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from '@hooks/useReducedMotion';

describe('useReducedMotion', () => {
  let changeHandler: (enabled: boolean) => void;
  const remove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const addListener = jest.spyOn(AccessibilityInfo, 'addEventListener') as unknown as jest.Mock;
    addListener.mockImplementation((_event: string, handler: (enabled: boolean) => void) => {
      changeHandler = handler;
      return { remove };
    });
  });

  test('reflects the initial system preference', async () => {
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
  });

  test('updates when the preference changes', async () => {
    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => expect(result.current).toBe(false));

    act(() => changeHandler(true));

    expect(result.current).toBe(true);
  });

  test('removes the subscription on unmount', () => {
    const { unmount } = renderHook(() => useReducedMotion());

    unmount();

    expect(remove).toHaveBeenCalled();
  });
});
