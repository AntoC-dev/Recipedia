import type * as ReactNative from 'react-native';

/**
 * Stubs `findNodeHandle` on the public `react-native` module. The jest preset's View mock has no
 * native tag, so the real call resolves no handle for a View ref under Fabric.
 */
export function mockFindNodeHandle(handle: number | null | undefined) {
  const reactNative: typeof ReactNative = jest.requireActual('react-native');
  return jest.spyOn(reactNative, 'findNodeHandle').mockReturnValue(handle as number);
}
