import type { ComponentType } from 'react';

interface ScrollableInstance {
  props: { keyboardDismissMode?: string };
}

/**
 * Asserts that at least one rendered scrollable of the given type opts into
 * dismissing the soft keyboard when a drag begins (`keyboardDismissMode='on-drag'`).
 * Shared by the screen/dialog suites that enable this behaviour on their
 * keyboard-facing scroll surfaces.
 *
 * @param getAllByType - a render result's `UNSAFE_getAllByType`
 * @param scrollableType - the scrollable component to look for (`FlatList` or `ScrollView`)
 */
export function expectKeyboardDismissesOnDrag(
  getAllByType: (type: ComponentType<never>) => ScrollableInstance[],
  scrollableType: ComponentType<never>
): void {
  const scrollables = getAllByType(scrollableType);
  expect(scrollables.some(node => node.props.keyboardDismissMode === 'on-drag')).toBe(true);
}
