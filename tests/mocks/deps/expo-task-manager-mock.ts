export const mockDefineTask = jest.fn();
export const mockIsTaskDefined = jest.fn().mockReturnValue(false);
export const mockIsTaskRegisteredAsync = jest.fn().mockResolvedValue(false);

export function expoTaskManagerMock() {
  return {
    defineTask: mockDefineTask,
    isTaskDefined: mockIsTaskDefined,
    isTaskRegisteredAsync: mockIsTaskRegisteredAsync,
  };
}
