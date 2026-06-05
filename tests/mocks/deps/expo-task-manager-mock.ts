export const mockDefineTask = jest.fn();
export const mockIsTaskDefined = jest.fn().mockReturnValue(false);
export const mockIsTaskRegisteredAsync = jest.fn().mockResolvedValue(false);
export const mockUnregisterTaskAsync = jest.fn().mockResolvedValue(undefined);

export function expoTaskManagerMock() {
  return {
    defineTask: mockDefineTask,
    isTaskDefined: mockIsTaskDefined,
    isTaskRegisteredAsync: mockIsTaskRegisteredAsync,
    unregisterTaskAsync: mockUnregisterTaskAsync,
  };
}
