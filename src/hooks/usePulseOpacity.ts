/**
 * Pulsing opacity animation shared by loading-skeleton placeholders.
 *
 * @module usePulseOpacity
 */

import { useEffect, useState } from 'react';
import { Animated } from 'react-native';

/**
 * Returns a stable `Animated.Value` that loops a pulsing opacity between `min`
 * and `max`. The animation starts on mount and stops on unmount.
 *
 * @param min - Lowest opacity in the pulse. Defaults to 0.3.
 * @param max - Highest opacity in the pulse. Defaults to 0.7.
 * @param duration - Duration of each half-cycle in milliseconds. Defaults to 1000.
 * @returns The animated opacity value to assign to a `style.opacity`.
 */
export function usePulseOpacity(min = 0.3, max = 0.7, duration = 1000): Animated.Value {
  const [opacity] = useState(() => new Animated.Value(min));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: max, duration, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: min, duration, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity, min, max, duration]);

  return opacity;
}
