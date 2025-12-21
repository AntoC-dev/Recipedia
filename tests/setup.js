// Global test setup

// Global fetch mock - must be set up before any imports
require('./mocks/deps/fetch-mock');

// Centralized mocks - these are used across many test files
jest.mock('expo-sqlite', () => require('@mocks/deps/expo-sqlite-mock').expoSqliteMock());
jest.mock('@react-navigation/stack', () =>
  require('@mocks/deps/react-navigation-stack-mock').reactNavigationStackMock()
);
jest.mock('@utils/FileGestion', () =>
  require('@mocks/utils/FileGestion-mock.tsx').fileGestionMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@utils/settings', () => require('@mocks/utils/settings-mock').settingsMock());
jest.mock('@utils/firstLaunch', () => require('@mocks/utils/firstLaunch-mock').firstLaunchMock());
jest.mock('react-native/Libraries/Interaction/InteractionManager', () =>
  require('@mocks/deps/InteractionManager-mock').interactionManagerMock()
);

// Mock the RecipeScraper native module
jest.mock('@app/modules/recipe-scraper/src/RecipeScraperModule', () => ({
  __esModule: true,
  default: {
    scrapeRecipe: jest.fn().mockResolvedValue('{"success":true,"data":{}}'),
    scrapeRecipeFromHtml: jest.fn().mockResolvedValue('{"success":true,"data":{}}'),
    getSupportedHosts: jest.fn().mockResolvedValue('{"success":true,"data":[]}'),
    isHostSupported: jest.fn().mockResolvedValue('{"success":true,"data":false}'),
    isAvailable: jest.fn().mockResolvedValue(true),
  },
}));

// Store original console methods for tests that need to verify console calls
global.originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
};

// Mock console methods to reduce noise in tests, but allow tests to override
if (!global.console._isMocked) {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    _isMocked: true,
  };
}

// Global teardown to allow async operations to complete before Jest exits
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
});
