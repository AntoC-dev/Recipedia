export function authBridgeMock() {
  return {
    AuthBridge: {
      fetchAuthenticatedHtml: jest
        .fn()
        .mockRejectedValue(new Error('AuthBridge: No auth handler for host ""')),
      getAuthHandlerHosts: jest.fn().mockReturnValue([]),
      isHostSupported: jest.fn().mockReturnValue(false),
      isActive: false,
      currentLoginUrl: null,
      subscribe: jest.fn().mockReturnValue(() => {}),
      setInjectHandler: jest.fn(),
      handleLoadEnd: jest.fn(),
      handleMessage: jest.fn(),
      handleWebViewError: jest.fn(),
      destroy: jest.fn(),
    },
  };
}
