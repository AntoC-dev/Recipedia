// Community-maintained mocks setup
// These replace custom mocks with official/community-maintained alternatives

import 'react-native-gesture-handler/jestSetup';

// react-native-safe-area-context
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('@shopify/flash-list', () => require('@mocks/deps/flash-list-mock').flashListMock());

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Note: react-native-reanimated uses custom mock via moduleNameMapper (not installed as dependency)
