export function pyodideBridgeMock() {
  return {
    PyodideBridge: {
      scrapeRecipeFromHtml: jest.fn().mockResolvedValue('{}'),
      getSupportedHosts: jest.fn().mockResolvedValue('[]'),
      isHostSupported: jest.fn().mockResolvedValue('false'),
      isPythonReady: jest.fn().mockReturnValue(false),
      whenReady: jest.fn().mockResolvedValue(undefined),
      getInitializationError: jest.fn().mockReturnValue(null),
      setMessageHandler: jest.fn(),
      attach: jest.fn(),
      detach: jest.fn(),
      sendToWebView: jest.fn(),
      handleMessage: jest.fn(),
      destroy: jest.fn(),
    },
  };
}
