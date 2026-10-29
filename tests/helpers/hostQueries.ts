import type { TestInstance } from 'test-renderer';

/** Host element type React Native's jest preset renders for `ScrollView` and the lists built on it. */
export const SCROLL_VIEW_HOST_TYPE = 'RCTScrollView';

/** Host element type every `View`, including `Animated.View`, renders to. */
export const VIEW_HOST_TYPE = 'View';

/** Host element types react-native-keyboard-controller's jest mock renders for the toolbar buttons. */
export const KEYBOARD_TOOLBAR_HOST_TYPES = {
  prev: 'KeyboardToolbar.Prev',
  next: 'KeyboardToolbar.Next',
  done: 'KeyboardToolbar.Done',
} as const;

/**
 * Collects every host element of the given type below a render container.
 * Replaces the composite `UNSAFE_*ByType` queries RNTL 14 removed: the test
 * renderer only exposes host elements, so callers look them up by host name.
 *
 * @param container - a render result's `container`
 * @param hostType - the host element type, e.g. {@link SCROLL_VIEW_HOST_TYPE}
 * @returns the matching host elements in tree order
 */
export function queryAllByHostType(container: TestInstance, hostType: string): TestInstance[] {
  return container.queryAll(instance => instance.type === hostType);
}
