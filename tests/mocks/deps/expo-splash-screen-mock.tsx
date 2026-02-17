export const mockPreventAutoHideAsync = jest.fn().mockResolvedValue(undefined);
export const mockHideAsync = jest.fn().mockResolvedValue(undefined);

export function expoSplashScreenMock() {
  return {
    preventAutoHideAsync: mockPreventAutoHideAsync,
    hideAsync: mockHideAsync,
  };
}
