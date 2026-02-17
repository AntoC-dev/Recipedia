export function pyodideBridgeMock() {
  return {
    PyodideBridge: {
      scrapeRecipeFromHtml: jest.fn().mockResolvedValue('{}'),
      getSupportedHosts: jest.fn().mockResolvedValue('[]'),
      isHostSupported: jest.fn().mockResolvedValue('false'),
      isPythonReady: jest.fn().mockReturnValue(false),
      waitForReady: jest.fn().mockResolvedValue(false),
      setMessageHandler: jest.fn(),
      sendToWebView: jest.fn(),
      handleMessage: jest.fn(),
      destroy: jest.fn(),
    },
  };
}
