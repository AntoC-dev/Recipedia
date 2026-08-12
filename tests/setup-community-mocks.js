// Community-maintained mocks setup
// These replace custom mocks with official/community-maintained alternatives

import 'react-native-gesture-handler/jestSetup';

// react-native-safe-area-context
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

// Mirrors @shopify/flash-list 2.0.3+ `jestSetup.js`, which only stubs layout measurement so the
// real FlashList renders under Jest. Vendored because the 2.0.2 pinned by Expo SDK 56 ships a
// broken `jestSetup.js` (it swaps FlashList for the unexported RecyclerView). Replace this with
// `import '@shopify/flash-list/jestSetup'` once Expo bundles >= 2.0.3.
jest.mock('@shopify/flash-list/dist/recyclerview/utils/measureLayout', () =>
  require('@mocks/deps/flash-list-measure-layout-mock').flashListMeasureLayoutMock()
);

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Note: react-native-reanimated uses custom mock via moduleNameMapper (not installed as dependency)
