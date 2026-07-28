export let mockDeferredMountReady = true;

export function setMockDeferredMountReady(ready: boolean) {
  mockDeferredMountReady = ready;
}

export function resetUseDeferredMountMock() {
  mockDeferredMountReady = true;
}

export const useDeferredMountMock = jest.fn(() => mockDeferredMountReady);
