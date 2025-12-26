/**
 * Utility for cross-platform E2E test element identification
 *
 * This module provides a utility function that ensures React Native components
 * are properly identifiable by Maestro E2E tests on both iOS and Android platforms.
 *
 * @module testProps
 */

/**
 * Returns props for both testID and accessibilityLabel to ensure
 * cross-platform compatibility with Maestro E2E tests.
 *
 * On iOS, `testID` alone may not work for nested components due to
 * accessibility tree limitations. When a parent Touchable component has
 * `accessible={true}` (the default), child testIDs are hidden from the
 * accessibility tree. Adding `accessibilityLabel` as a fallback ensures
 * Maestro can find elements on both platforms.
 *
 * @param testId - The identifier for the element
 * @returns Object with both testID and accessibilityLabel set to the same value
 *
 * @example
 * ```tsx
 * import { testProps } from '@utils/testProps';
 *
 * // Instead of:
 * <Card testID="MyCard" />
 *
 * // Use:
 * <Card {...testProps('MyCard')} />
 *
 * // For dynamic IDs:
 * <Card {...testProps(`${prefix}::${id}`)} />
 * ```
 *
 * @see https://github.com/facebook/react-native/issues/30575
 * @see https://docs.maestro.dev/platform-support/react-native
 */
export function testProps(testId: string) {
  return {
    testID: testId,
    accessibilityLabel: testId,
  };
}
