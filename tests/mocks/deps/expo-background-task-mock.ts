export const BackgroundTaskStatus = {
  Restricted: 1,
  Available: 2,
} as const;

export const BackgroundTaskResult = {
  Success: 1,
  Failed: 2,
} as const;

export const mockGetStatusAsync = jest.fn().mockResolvedValue(BackgroundTaskStatus.Available);
export const mockRegisterTaskAsync = jest.fn().mockResolvedValue(undefined);
export const mockUnregisterTaskAsync = jest.fn().mockResolvedValue(undefined);

export function expoBackgroundTaskMock() {
  return {
    BackgroundTaskStatus,
    BackgroundTaskResult,
    getStatusAsync: mockGetStatusAsync,
    registerTaskAsync: mockRegisterTaskAsync,
    unregisterTaskAsync: mockUnregisterTaskAsync,
  };
}
