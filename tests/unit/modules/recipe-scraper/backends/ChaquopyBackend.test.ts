import type { ScraperBackend } from '@app/modules/recipe-scraper/src/backends/ScraperBackend';

function loadBackend(nativeModule: Record<string, unknown>): ScraperBackend {
  jest.resetModules();
  jest.doMock('@app/modules/recipe-scraper/src/RecipeScraperModule', () => ({
    default: nativeModule,
  }));
  const { ChaquopyBackend } = require('@app/modules/recipe-scraper/src/backends/ChaquopyBackend');
  return new ChaquopyBackend();
}

describe('ChaquopyBackend', () => {
  afterEach(() => {
    jest.resetModules();
  });

  describe('warmup', () => {
    it('delegates to the native warmup', async () => {
      const warmup = jest.fn().mockResolvedValue(undefined);
      await loadBackend({ warmup }).warmup();
      expect(warmup).toHaveBeenCalledTimes(1);
    });

    it('resolves when the native module has no warmup', async () => {
      await expect(loadBackend({}).warmup()).resolves.toBeUndefined();
    });
  });

  describe('isReady', () => {
    it('returns the native readiness result', async () => {
      const isPythonAvailable = jest.fn().mockResolvedValue(true);
      await expect(loadBackend({ isPythonAvailable }).isReady()).resolves.toBe(true);
    });

    it('returns false when the native module has no readiness check', async () => {
      await expect(loadBackend({}).isReady()).resolves.toBe(false);
    });

    it('returns false when the native readiness check throws', async () => {
      const isPythonAvailable = jest.fn().mockRejectedValue(new Error('boom'));
      await expect(loadBackend({ isPythonAvailable }).isReady()).resolves.toBe(false);
    });
  });

  describe('scrapeHtml', () => {
    it('parses the native JSON result', async () => {
      const scrapeRecipeFromHtml = jest
        .fn()
        .mockResolvedValue(JSON.stringify({ success: true, data: { title: 'Cake' } }));
      const result = await loadBackend({ scrapeRecipeFromHtml }).scrapeHtml('<html>', 'url', true);
      expect(scrapeRecipeFromHtml).toHaveBeenCalledWith('<html>', 'url', true);
      expect(result).toEqual({ success: true, data: { title: 'Cake' } });
    });
  });

  describe('getSupportedHosts', () => {
    it('parses the native JSON result', async () => {
      const getSupportedHosts = jest
        .fn()
        .mockResolvedValue(JSON.stringify({ success: true, data: ['allrecipes.com'] }));
      const result = await loadBackend({ getSupportedHosts }).getSupportedHosts();
      expect(result).toEqual({ success: true, data: ['allrecipes.com'] });
    });
  });

  describe('isHostSupported', () => {
    it('parses the native JSON result', async () => {
      const isHostSupported = jest
        .fn()
        .mockResolvedValue(JSON.stringify({ success: true, data: true }));
      const result = await loadBackend({ isHostSupported }).isHostSupported('allrecipes.com');
      expect(isHostSupported).toHaveBeenCalledWith('allrecipes.com');
      expect(result).toEqual({ success: true, data: true });
    });
  });

  describe('getSupportedAuthHosts', () => {
    it('parses the native JSON result', async () => {
      const getSupportedAuthHosts = jest
        .fn()
        .mockResolvedValue(JSON.stringify({ success: true, data: ['quitoque.fr'] }));
      const result = await loadBackend({ getSupportedAuthHosts }).getSupportedAuthHosts();
      expect(result).toEqual({ success: true, data: ['quitoque.fr'] });
    });

    it('returns an empty list when the native module has no auth support', async () => {
      const result = await loadBackend({}).getSupportedAuthHosts();
      expect(result).toEqual({ success: true, data: [] });
    });
  });

  describe('scrapeAuthenticated', () => {
    it('splits the native response into fetched html and parsed result', async () => {
      const scrapeRecipeAuthenticated = jest
        .fn()
        .mockResolvedValue(
          JSON.stringify({ success: true, html: '<page/>', data: { title: 'X' } })
        );
      const outcome = await loadBackend({ scrapeRecipeAuthenticated }).scrapeAuthenticated(
        'url',
        'user',
        'pass',
        true
      );
      expect(scrapeRecipeAuthenticated).toHaveBeenCalledWith('url', 'user', 'pass', true);
      expect(outcome).toEqual({ html: '<page/>', result: { success: true, data: { title: 'X' } } });
    });

    it('defaults html to empty string when the native response omits it', async () => {
      const scrapeRecipeAuthenticated = jest
        .fn()
        .mockResolvedValue(JSON.stringify({ success: true, data: { title: 'X' } }));
      const outcome = await loadBackend({ scrapeRecipeAuthenticated }).scrapeAuthenticated(
        'url',
        'user',
        'pass',
        true
      );
      expect(outcome).toEqual({ html: '', result: { success: true, data: { title: 'X' } } });
    });

    it('returns an UnsupportedPlatform error when native auth scraping is absent', async () => {
      const outcome = await loadBackend({}).scrapeAuthenticated('url', 'user', 'pass', true);
      expect(outcome).toEqual({
        success: false,
        error: {
          type: 'UnsupportedPlatform',
          message: 'Authenticated scraping requires Android or iOS',
        },
      });
    });
  });
});
