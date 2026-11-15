// Community-maintained mocks setup
// These replace custom mocks with official/community-maintained alternatives

// react-native-safe-area-context
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

import '@shopify/flash-list/jestSetup';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Note: react-native-reanimated uses custom mock via moduleNameMapper (not installed as dependency)
