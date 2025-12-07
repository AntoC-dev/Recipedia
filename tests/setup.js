// Global test setup

// Centralized mocks - these are used across many test files
jest.mock('expo-sqlite', () => require('@mocks/deps/expo-sqlite-mock').expoSqliteMock());
jest.mock('@utils/FileGestion', () =>
  require('@mocks/utils/FileGestion-mock.tsx').fileGestionMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@utils/settings', () => require('@mocks/utils/settings-mock').settingsMock());
jest.mock('@utils/firstLaunch', () => ({
  isFirstLaunch: jest.fn().mockResolvedValue(false),
  markAsLaunched: jest.fn().mockResolvedValue(undefined),
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
