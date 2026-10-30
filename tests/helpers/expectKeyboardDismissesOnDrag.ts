import type { TestInstance } from 'test-renderer';
import { queryAllByHostType, SCROLL_VIEW_HOST_TYPE } from '@test-helpers/hostQueries';

/**
 * Asserts that at least one rendered scroll view opts into dismissing the soft
 * keyboard when a drag begins (`keyboardDismissMode='on-drag'`).
 * Shared by the screen/dialog suites that enable this behaviour on their
 * keyboard-facing scroll surfaces.
 *
 * @param container - a render result's `container`
 */
export function expectKeyboardDismissesOnDrag(container: TestInstance): void {
  const scrollables = queryAllByHostType(container, SCROLL_VIEW_HOST_TYPE);
  expect(scrollables.some(node => node.props.keyboardDismissMode === 'on-drag')).toBe(true);
}
