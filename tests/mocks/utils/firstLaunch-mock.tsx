export function firstLaunchMock() {
  return {
    isFirstLaunch: jest.fn().mockResolvedValue(false),
    markAsLaunched: jest.fn().mockResolvedValue(undefined),
  };
}
