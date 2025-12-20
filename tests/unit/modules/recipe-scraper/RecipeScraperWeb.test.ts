import { RecipeScraperWeb } from '@app/modules/recipe-scraper/src/web/RecipeScraperWeb';
import { pyodideScraper } from '@app/modules/recipe-scraper/src/web/PyodideScraper';
import { createEmptyScrapedRecipe } from '@mocks/modules/recipe-scraper-mock';
import { mockFetch } from '@mocks/deps/fetch-mock';

jest.mock('@app/modules/recipe-scraper/src/web/PyodideScraper', () => ({
  pyodideScraper: {
    isReady: false,
    hasFailed: false,
    preload: jest.fn(),
    scrapeFromHtml: jest.fn(),
    getSupportedHosts: jest.fn(),
    isHostSupported: jest.fn(),
  },
}));

const mockPyodideScraper = pyodideScraper as jest.Mocked<typeof pyodideScraper>;

describe('RecipeScraperWeb', () => {
  let scraper: RecipeScraperWeb;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(mockPyodideScraper, 'isReady', { value: false, writable: true });
    Object.defineProperty(mockPyodideScraper, 'hasFailed', { value: false, writable: true });
    scraper = new RecipeScraperWeb();
  });

  describe('isAvailable', () => {
    test('returns true', async () => {
      const result = await scraper.isAvailable();
      expect(result).toBe(true);
    });
  });

  describe('getSupportedHosts', () => {
    test('returns empty array', async () => {
      const json = await scraper.getSupportedHosts();
      const result = JSON.parse(json);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('isHostSupported', () => {
    test('returns false for any host', async () => {
      const json = await scraper.isHostSupported('allrecipes.com');
      const result = JSON.parse(json);

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('scrapeRecipe', () => {
    test('fetches URL and parses recipe', async () => {
      const recipeHtml = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Test Recipe", "recipeIngredient": ["1 cup flour"] }
          </script>
        </head>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com/recipe',
        text: async () => recipeHtml,
      });

      const json = await scraper.scrapeRecipe('https://example.com/recipe');
      const result = JSON.parse(json);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Test Recipe');
      expect(result.data.ingredients).toEqual(['1 cup flour']);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/recipe');
    });

    test('returns error on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const json = await scraper.scrapeRecipe('https://example.com/missing');
      const result = JSON.parse(json);

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('FetchError');
      expect(result.error.message).toContain('404');
    });

    test('returns error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const json = await scraper.scrapeRecipe('https://example.com/recipe');
      const result = JSON.parse(json);

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('FetchError');
      expect(result.error.message).toBe('Network error');
    });

    test('returns error when no recipe found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com/page',
        text: async () => '<html><body>No recipe here</body></html>',
      });

      const json = await scraper.scrapeRecipe('https://example.com/page');
      const result = JSON.parse(json);

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('NoRecipeFoundError');
    });

    test('ignores wildMode parameter', async () => {
      const recipeHtml = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Recipe" }
          </script>
        </head>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com/recipe',
        text: async () => recipeHtml,
      });

      const json = await scraper.scrapeRecipe('https://example.com/recipe', false);
      const result = JSON.parse(json);

      expect(result.success).toBe(true);
    });
  });

  describe('scrapeRecipeFromHtml', () => {
    test('parses recipe from provided HTML', async () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "HTML Recipe",
            "description": "From HTML"
          }
          </script>
        </head>
        </html>
      `;

      const json = await scraper.scrapeRecipeFromHtml(html, 'https://example.com/recipe');
      const result = JSON.parse(json);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('HTML Recipe');
      expect(result.data.description).toBe('From HTML');
    });

    test('does not call fetch', async () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Test" }
          </script>
        </head>
        </html>
      `;

      await scraper.scrapeRecipeFromHtml(html, 'https://example.com');

      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('returns error when no recipe found in HTML', async () => {
      const html = '<html><body>Not a recipe</body></html>';

      const json = await scraper.scrapeRecipeFromHtml(html, 'https://example.com');
      const result = JSON.parse(json);

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('NoRecipeFoundError');
    });

    test('ignores wildMode parameter', async () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Test" }
          </script>
        </head>
        </html>
      `;

      const json = await scraper.scrapeRecipeFromHtml(html, 'https://example.com', false);
      const result = JSON.parse(json);

      expect(result.success).toBe(true);
    });
  });

  describe('isPythonAvailable', () => {
    test('returns false when pyodide is not ready', async () => {
      Object.defineProperty(mockPyodideScraper, 'isReady', { value: false });

      const result = await scraper.isPythonAvailable();

      expect(result).toBe(false);
    });

    test('returns true when pyodide is ready', async () => {
      Object.defineProperty(mockPyodideScraper, 'isReady', { value: true });

      const result = await scraper.isPythonAvailable();

      expect(result).toBe(true);
    });
  });

  describe('hybrid Python/TypeScript fallback', () => {
    const recipeHtml = `
      <html>
      <head>
        <script type="application/ld+json">
        { "@type": "Recipe", "name": "Test Recipe", "recipeIngredient": ["1 cup flour"] }
        </script>
      </head>
      </html>
    `;

    test('uses Python scraper when ready', async () => {
      Object.defineProperty(mockPyodideScraper, 'isReady', { value: true });
      mockPyodideScraper.scrapeFromHtml.mockResolvedValue({
        success: true,
        data: createEmptyScrapedRecipe({ title: 'Python Recipe', ingredients: ['from python'] }),
      });

      const json = await scraper.scrapeRecipeFromHtml(recipeHtml, 'https://example.com/recipe');
      const result = JSON.parse(json);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Python Recipe');
      expect(mockPyodideScraper.scrapeFromHtml).toHaveBeenCalledWith(
        recipeHtml,
        'https://example.com/recipe',
        true
      );
    });

    test('falls back to TypeScript when Python not ready', async () => {
      Object.defineProperty(mockPyodideScraper, 'isReady', { value: false });

      const json = await scraper.scrapeRecipeFromHtml(recipeHtml, 'https://example.com/recipe');
      const result = JSON.parse(json);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Test Recipe');
      expect(mockPyodideScraper.scrapeFromHtml).not.toHaveBeenCalled();
    });

    test('tries Python if TypeScript fails and Python is loading', async () => {
      Object.defineProperty(mockPyodideScraper, 'isReady', { value: false });
      Object.defineProperty(mockPyodideScraper, 'hasFailed', { value: false });
      mockPyodideScraper.scrapeFromHtml.mockResolvedValue({
        success: true,
        data: createEmptyScrapedRecipe({ title: 'Python Fallback', ingredients: [] }),
      });

      const noRecipeHtml = '<html><body>Not a recipe</body></html>';
      const json = await scraper.scrapeRecipeFromHtml(noRecipeHtml, 'https://example.com/page');
      const result = JSON.parse(json);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Python Fallback');
      expect(mockPyodideScraper.scrapeFromHtml).toHaveBeenCalled();
    });

    test('returns TypeScript error if Python also fails', async () => {
      Object.defineProperty(mockPyodideScraper, 'isReady', { value: false });
      Object.defineProperty(mockPyodideScraper, 'hasFailed', { value: false });
      mockPyodideScraper.scrapeFromHtml.mockResolvedValue({
        success: false,
        error: { type: 'PythonError', message: 'Failed' },
      });

      const noRecipeHtml = '<html><body>Not a recipe</body></html>';
      const json = await scraper.scrapeRecipeFromHtml(noRecipeHtml, 'https://example.com/page');
      const result = JSON.parse(json);

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('NoRecipeFoundError');
    });

    test('does not try Python if it has failed', async () => {
      Object.defineProperty(mockPyodideScraper, 'isReady', { value: false });
      Object.defineProperty(mockPyodideScraper, 'hasFailed', { value: true });

      const noRecipeHtml = '<html><body>Not a recipe</body></html>';
      const json = await scraper.scrapeRecipeFromHtml(noRecipeHtml, 'https://example.com/page');
      const result = JSON.parse(json);

      expect(result.success).toBe(false);
      expect(mockPyodideScraper.scrapeFromHtml).not.toHaveBeenCalled();
    });
  });

  describe('preload behavior', () => {
    test('calls preload in browser environment', () => {
      const originalWindow = global.window;
      // @ts-expect-error simulating browser environment
      global.window = {};

      const newScraper = new RecipeScraperWeb();

      expect(mockPyodideScraper.preload).toHaveBeenCalled();
      expect(newScraper).toBeDefined();

      global.window = originalWindow;
    });

    test('does not call preload in non-browser environment', () => {
      const originalWindow = global.window;
      // @ts-expect-error simulating node environment
      delete global.window;

      jest.clearAllMocks();
      const newScraper = new RecipeScraperWeb();

      expect(mockPyodideScraper.preload).not.toHaveBeenCalled();
      expect(newScraper).toBeDefined();

      global.window = originalWindow;
    });
  });

  describe('getSupportedHosts with Python', () => {
    test('uses Python when ready', async () => {
      Object.defineProperty(mockPyodideScraper, 'isReady', { value: true });
      mockPyodideScraper.getSupportedHosts.mockResolvedValue({
        success: true,
        data: ['allrecipes.com', 'bbc.co.uk'],
      } as never);

      const json = await scraper.getSupportedHosts();
      const result = JSON.parse(json);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['allrecipes.com', 'bbc.co.uk']);
    });

    test('returns empty array when Python not ready', async () => {
      Object.defineProperty(mockPyodideScraper, 'isReady', { value: false });

      const json = await scraper.getSupportedHosts();
      const result = JSON.parse(json);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('isHostSupported with Python', () => {
    test('uses Python when ready', async () => {
      Object.defineProperty(mockPyodideScraper, 'isReady', { value: true });
      mockPyodideScraper.isHostSupported.mockResolvedValue({
        success: true,
        data: true,
      } as never);

      const json = await scraper.isHostSupported('allrecipes.com');
      const result = JSON.parse(json);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    test('returns false when Python not ready', async () => {
      Object.defineProperty(mockPyodideScraper, 'isReady', { value: false });

      const json = await scraper.isHostSupported('allrecipes.com');
      const result = JSON.parse(json);

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });
});
