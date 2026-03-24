export function interactionManagerMock() {
  const mock = {
    runAfterInteractions: jest.fn(callback => {
      callback();
      return { cancel: jest.fn() };
    }),
    createInteractionHandle: jest.fn(() => 1),
    clearInteractionHandle: jest.fn(),
  };
  return { ...mock, default: mock };
}
