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

    const renderedPreferences: boolean[] = [];
    const { result } = await renderHook(() => {
      const isReduced = useReducedMotion();
      renderedPreferences.push(isReduced);
      return isReduced;
    });

    expect(renderedPreferences[0]).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
  });

  test('updates when the preference changes', async () => {
    const { result } = await renderHook(() => useReducedMotion());

    await waitFor(() => expect(result.current).toBe(false));

    await act(() => changeHandler(true));

    expect(result.current).toBe(true);
  });

  test('ignores a preference that resolves after unmount', async () => {
    let resolvePreference: (enabled: boolean) => void = () => {};
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockReturnValue(
      new Promise<boolean>(resolve => {
        resolvePreference = resolve;
      })
    );
    const renderedPreferences: boolean[] = [];
    const { unmount } = await renderHook(() => {
      const isReduced = useReducedMotion();
      renderedPreferences.push(isReduced);
      return isReduced;
    });
    await unmount();

    await act(async () => resolvePreference(true));

    expect(renderedPreferences).not.toContain(true);
  });

  test('removes the subscription on unmount', async () => {
    const { unmount } = await renderHook(() => useReducedMotion());

    await unmount();

    expect(remove).toHaveBeenCalled();
  });
});
