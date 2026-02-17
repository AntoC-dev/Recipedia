export const mockIsFirstLaunch = jest.fn().mockResolvedValue(false);
export const mockMarkAsLaunched = jest.fn().mockResolvedValue(undefined);

export function firstLaunchMock() {
  return {
    isFirstLaunch: mockIsFirstLaunch,
    markAsLaunched: mockMarkAsLaunched,
  };
}
