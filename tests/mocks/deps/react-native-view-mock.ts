const PRESET_NATIVE_COMPONENT_MOCK_MODULE = '@react-native/jest-preset/jest/mockNativeComponent';

/**
 * Swaps the jest preset's View mock, which has no native tag, for the preset's own native
 * component mock, which gives each instance a `_nativeTag`, so `findNodeHandle` resolves a View
 * ref under the Fabric renderer used since React Native 0.86.
 */
export function viewWithNativeTagMock() {
  const mockNativeComponent = jest.requireActual(PRESET_NATIVE_COMPONENT_MOCK_MODULE).default;
  return { __esModule: true, default: mockNativeComponent('RCTView') };
}
