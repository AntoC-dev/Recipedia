import { renderHook } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { usePulseOpacity } from '@hooks/usePulseOpacity';

describe('usePulseOpacity', () => {
  test('returns an Animated.Value', () => {
    const { result } = renderHook(() => usePulseOpacity());
    expect(result.current).toBeInstanceOf(Animated.Value);
  });

  test('returns a stable value across re-renders', () => {
    const { result, rerender } = renderHook(() => usePulseOpacity());
    const first = result.current;
    rerender({});
    expect(result.current).toBe(first);
  });

  test('starts a looping animation on mount and stops on unmount', () => {
    const start = jest.fn();
    const stop = jest.fn();
    const loopSpy = jest
      .spyOn(Animated, 'loop')
      .mockReturnValue({ start, stop } as unknown as Animated.CompositeAnimation);

    const { unmount } = renderHook(() => usePulseOpacity());
    expect(start).toHaveBeenCalledTimes(1);

    unmount();
    expect(stop).toHaveBeenCalledTimes(1);

    loopSpy.mockRestore();
  });

  test('drives the animation with custom bounds and duration', () => {
    const loopSpy = jest.spyOn(Animated, 'loop').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as unknown as Animated.CompositeAnimation);
    const timingSpy = jest.spyOn(Animated, 'timing');

    renderHook(() => usePulseOpacity(0.1, 0.9, 500));

    expect(timingSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 0.9, duration: 500 })
    );
    expect(timingSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 0.1, duration: 500 })
    );

    timingSpy.mockRestore();
    loopSpy.mockRestore();
  });
});
