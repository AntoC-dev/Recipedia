import type { ScraperBackend } from '@app/modules/recipe-scraper/src/backends/ScraperBackend';
import { pyodideBridgeMock } from '@mocks/modules/pyodide-bridge-mock';

const SCHEMA_HTML = `
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Recipe","name":"Schema Cake","recipeIngredient":["flour"]}
</script>
`;

const pyodideLogger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

function loadBackend(
  bridge: Record<string, jest.Mock>,
  authBridge: Record<string, jest.Mock> = {}
): ScraperBackend {
  jest.resetModules();
  jest.doMock('@utils/logger', () => ({ pyodideLogger }));
  jest.doMock('@app/modules/recipe-scraper/src/ios/PyodideBridge', () => ({
    PyodideBridge: { ...pyodideBridgeMock().PyodideBridge, ...bridge },
  }));
  jest.doMock('@app/modules/recipe-scraper/src/ios/AuthBridge', () => ({ AuthBridge: authBridge }));
  const { PyodideBackend } = require('@app/modules/recipe-scraper/src/backends/PyodideBackend');
  return new PyodideBackend();
}

describe('PyodideBackend', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('warms up by waiting for the bridge', async () => {
    const whenReady = jest.fn().mockResolvedValue(undefined);
    await loadBackend({ whenReady }).warmup();
    expect(whenReady).toHaveBeenCalledTimes(1);
  });

  it('reports readiness from the bridge', async () => {
    const isPythonReady = jest.fn().mockReturnValue(true);
    await expect(loadBackend({ isPythonReady }).isReady()).resolves.toBe(true);
  });

  describe('scrapeHtml', () => {
    it('parses the bridge JSON result', async () => {
      const scrapeRecipeFromHtml = jest
        .fn()
        .mockResolvedValue(JSON.stringify({ success: true, data: { title: 'Pyodide Cake' } }));
      const result = await loadBackend({ scrapeRecipeFromHtml }).scrapeHtml('<html>', 'url', true);
      expect(scrapeRecipeFromHtml).toHaveBeenCalledWith('<html>', 'url', true);
      expect(result).toEqual({ success: true, data: { title: 'Pyodide Cake' } });
    });

    it('falls back to schema parsing and logs init error when the bridge fails', async () => {
      const scrapeRecipeFromHtml = jest.fn().mockRejectedValue(new Error('bridge down'));
      const getInitializationError = jest.fn().mockReturnValue(new Error('never started'));
      const result = await loadBackend({ scrapeRecipeFromHtml, getInitializationError }).scrapeHtml(
        SCHEMA_HTML,
        'url',
        true
      );
      expect(result.success).toBe(true);
      expect(pyodideLogger.warn).toHaveBeenCalledWith('Pyodide never initialized', {
        error: 'never started',
      });
    });

    it('falls back to schema parsing without init log when no init error', async () => {
      const scrapeRecipeFromHtml = jest.fn().mockRejectedValue(new Error('bridge down'));
      const getInitializationError = jest.fn().mockReturnValue(null);
      const result = await loadBackend({ scrapeRecipeFromHtml, getInitializationError }).scrapeHtml(
        SCHEMA_HTML,
        'url',
        true
      );
      expect(result.success).toBe(true);
      expect(pyodideLogger.warn).not.toHaveBeenCalledWith(
        'Pyodide never initialized',
        expect.anything()
      );
    });
  });

  it('parses supported hosts from the bridge', async () => {
    const getSupportedHosts = jest
      .fn()
      .mockResolvedValue(JSON.stringify({ success: true, data: ['site.com'] }));
    await expect(loadBackend({ getSupportedHosts }).getSupportedHosts()).resolves.toEqual({
      success: true,
      data: ['site.com'],
    });
  });

  it('parses host support from the bridge', async () => {
    const isHostSupported = jest
      .fn()
      .mockResolvedValue(JSON.stringify({ success: true, data: false }));
    await expect(loadBackend({ isHostSupported }).isHostSupported('site.com')).resolves.toEqual({
      success: true,
      data: false,
    });
  });

  it('lists auth hosts from the AuthBridge', async () => {
    const getAuthHandlerHosts = jest.fn().mockReturnValue(['quitoque.fr']);
    const backend = loadBackend({}, { getAuthHandlerHosts });
    await expect(backend.getSupportedAuthHosts()).resolves.toEqual({
      success: true,
      data: ['quitoque.fr'],
    });
  });

  describe('scrapeAuthenticated', () => {
    it('fetches authenticated html then parses it with wildMode disabled', async () => {
      const scrapeRecipeFromHtml = jest
        .fn()
        .mockResolvedValue(JSON.stringify({ success: true, data: { title: 'Authed' } }));
      const authBridge = {
        isHostSupported: jest.fn().mockReturnValue(true),
        fetchAuthenticatedHtml: jest.fn().mockResolvedValue('<authed/>'),
      };
      const outcome = await loadBackend({ scrapeRecipeFromHtml }, authBridge).scrapeAuthenticated(
        'https://www.quitoque.fr/r',
        'user',
        'pass',
        true
      );
      expect(authBridge.fetchAuthenticatedHtml).toHaveBeenCalledWith(
        'https://www.quitoque.fr/r',
        'user',
        'pass'
      );
      expect(scrapeRecipeFromHtml).toHaveBeenCalledWith(
        '<authed/>',
        'https://www.quitoque.fr/r',
        false
      );
      expect(outcome).toEqual({
        html: '<authed/>',
        result: { success: true, data: { title: 'Authed' } },
      });
    });

    it('returns an UnsupportedAuthSite error for an unsupported host', async () => {
      const authBridge = { isHostSupported: jest.fn().mockReturnValue(false) };
      const outcome = await loadBackend({}, authBridge).scrapeAuthenticated(
        'https://www.unknown.com/r',
        'user',
        'pass',
        true
      );
      expect(outcome).toEqual({
        success: false,
        error: {
          type: 'UnsupportedAuthSite',
          message: 'Authentication not supported for unknown.com on iOS',
          host: 'unknown.com',
        },
      });
    });
  });
});
