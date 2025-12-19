import { BaseRecipeProvider } from '@providers/BaseRecipeProvider';
import { hellofreshRecipePageHtml } from '@test-data/scraperMocks/hellofresh';

const mockFetch = jest.fn();
global.fetch = mockFetch;

class TestProvider extends BaseRecipeProvider {
  readonly id = 'test';
  readonly name = 'Test Provider';
  readonly logoUrl = 'https://example.com/logo.png';
  private testBaseUrl = 'https://www.test-provider.com';
  private testCategoryUrls = [
    'https://www.test-provider.com/cat1',
    'https://www.test-provider.com/cat2',
  ];
  private testRecipeLinks = [
    { url: 'https://www.test-provider.com/recipe1', title: 'Recipe 1' },
    { url: 'https://www.test-provider.com/recipe2', title: 'Recipe 2' },
  ];

  async getBaseUrl(): Promise<string> {
    return this.testBaseUrl;
  }

  async discoverCategoryUrls(): Promise<string[]> {
    return this.testCategoryUrls;
  }

  extractRecipeLinksFromHtml(): { url: string; title?: string; imageUrl?: string }[] {
    return this.testRecipeLinks;
  }

  setTestCategoryUrls(urls: string[]) {
    this.testCategoryUrls = urls;
  }

  setTestRecipeLinks(links: { url: string; title: string; imageUrl?: string }[]) {
    this.testRecipeLinks = links;
  }
}

describe('BaseRecipeProvider', () => {
  let provider: TestProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new TestProvider();
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html></html>'),
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('discoverRecipeUrls', () => {
    it('yields initial progress with zero recipes', async () => {
      const generator = provider.discoverRecipeUrls();
      const firstProgress = await generator.next();

      expect(firstProgress.value).toEqual({
        phase: 'discovering',
        recipesFound: 0,
        categoriesScanned: 0,
        totalCategories: 2,
        isComplete: false,
        recipes: [],
      });
    });

    it('yields progress after each category', async () => {
      jest.useRealTimers();

      const progressUpdates: unknown[] = [];

      for await (const progress of provider.discoverRecipeUrls()) {
        progressUpdates.push(progress);
      }

      expect(progressUpdates.length).toBeGreaterThan(2);

      const secondUpdate = progressUpdates[1] as { categoriesScanned: number };
      expect(secondUpdate.categoriesScanned).toBe(1);
    });

    it('yields complete progress at the end', async () => {
      jest.useRealTimers();

      let lastProgress;

      for await (const progress of provider.discoverRecipeUrls()) {
        lastProgress = progress;
      }

      expect(lastProgress).toMatchObject({
        phase: 'complete',
        isComplete: true,
        totalCategories: 2,
        categoriesScanned: 2,
      });
    });

    it('deduplicates recipes across categories', async () => {
      jest.useRealTimers();

      provider.setTestRecipeLinks([
        { url: 'https://www.test-provider.com/recipe1', title: 'Recipe 1' },
        { url: 'https://www.test-provider.com/recipe1', title: 'Recipe 1 Duplicate' },
      ]);

      let lastProgress;

      for await (const progress of provider.discoverRecipeUrls()) {
        lastProgress = progress;
      }

      expect(lastProgress?.recipesFound).toBe(1);
    });

    it('respects maxRecipes limit', async () => {
      jest.useRealTimers();

      provider.setTestRecipeLinks([
        { url: 'https://www.test-provider.com/recipe1', title: 'Recipe 1' },
        { url: 'https://www.test-provider.com/recipe2', title: 'Recipe 2' },
        { url: 'https://www.test-provider.com/recipe3', title: 'Recipe 3' },
      ]);

      let lastProgress;

      for await (const progress of provider.discoverRecipeUrls({ maxRecipes: 2 })) {
        lastProgress = progress;
      }

      expect(lastProgress?.recipesFound).toBeLessThanOrEqual(2);
    });

    it('stops on abort signal', async () => {
      jest.useRealTimers();

      const controller = new AbortController();
      controller.abort();

      let lastProgress;

      for await (const progress of provider.discoverRecipeUrls({ signal: controller.signal })) {
        lastProgress = progress;
      }

      expect(lastProgress?.recipesFound).toBe(0);
    });

    it('calls onImageLoaded for recipes without images', async () => {
      jest.useRealTimers();

      const onImageLoaded = jest.fn();

      provider.setTestRecipeLinks([
        { url: 'https://www.test-provider.com/recipe1', title: 'Recipe 1' },
      ]);

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(hellofreshRecipePageHtml),
      });

      for await (const progress of provider.discoverRecipeUrls({ onImageLoaded })) {
        if (progress.isComplete) break;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('limits concurrent image fetches to 5', async () => {
      jest.useRealTimers();

      let activeFetches = 0;
      let maxActiveFetches = 0;

      const fetchDelay = () =>
        new Promise<{ ok: boolean; text: () => Promise<string> }>(resolve => {
          activeFetches++;
          maxActiveFetches = Math.max(maxActiveFetches, activeFetches);
          setTimeout(() => {
            activeFetches--;
            resolve({
              ok: true,
              text: () => Promise.resolve(hellofreshRecipePageHtml),
            });
          }, 50);
        });

      mockFetch.mockImplementation(fetchDelay);

      provider.setTestCategoryUrls(['https://www.test-provider.com/cat1']);
      provider.setTestRecipeLinks([
        { url: 'https://www.test-provider.com/recipe1', title: 'Recipe 1' },
        { url: 'https://www.test-provider.com/recipe2', title: 'Recipe 2' },
        { url: 'https://www.test-provider.com/recipe3', title: 'Recipe 3' },
        { url: 'https://www.test-provider.com/recipe4', title: 'Recipe 4' },
        { url: 'https://www.test-provider.com/recipe5', title: 'Recipe 5' },
        { url: 'https://www.test-provider.com/recipe6', title: 'Recipe 6' },
        { url: 'https://www.test-provider.com/recipe7', title: 'Recipe 7' },
        { url: 'https://www.test-provider.com/recipe8', title: 'Recipe 8' },
      ]);

      const onImageLoaded = jest.fn();

      for await (const progress of provider.discoverRecipeUrls({ onImageLoaded })) {
        if (progress.isComplete) break;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(maxActiveFetches).toBeLessThanOrEqual(6);
    });

    it('processes all queued image fetches', async () => {
      jest.useRealTimers();

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(hellofreshRecipePageHtml),
      });

      provider.setTestCategoryUrls(['https://www.test-provider.com/cat1']);
      provider.setTestRecipeLinks([
        { url: 'https://www.test-provider.com/recipe1', title: 'Recipe 1' },
        { url: 'https://www.test-provider.com/recipe2', title: 'Recipe 2' },
        { url: 'https://www.test-provider.com/recipe3', title: 'Recipe 3' },
        { url: 'https://www.test-provider.com/recipe4', title: 'Recipe 4' },
        { url: 'https://www.test-provider.com/recipe5', title: 'Recipe 5' },
        { url: 'https://www.test-provider.com/recipe6', title: 'Recipe 6' },
        { url: 'https://www.test-provider.com/recipe7', title: 'Recipe 7' },
      ]);

      const onImageLoaded = jest.fn();

      for await (const progress of provider.discoverRecipeUrls({ onImageLoaded })) {
        if (progress.isComplete) break;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(onImageLoaded).toHaveBeenCalledTimes(7);
    });

    it('respects abort signal in image fetch queue', async () => {
      jest.useRealTimers();

      const controller = new AbortController();

      mockFetch.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                text: () => Promise.resolve(hellofreshRecipePageHtml),
              });
            }, 100);
          })
      );

      provider.setTestCategoryUrls(['https://www.test-provider.com/cat1']);
      provider.setTestRecipeLinks([
        { url: 'https://www.test-provider.com/recipe1', title: 'Recipe 1' },
        { url: 'https://www.test-provider.com/recipe2', title: 'Recipe 2' },
        { url: 'https://www.test-provider.com/recipe3', title: 'Recipe 3' },
        { url: 'https://www.test-provider.com/recipe4', title: 'Recipe 4' },
        { url: 'https://www.test-provider.com/recipe5', title: 'Recipe 5' },
        { url: 'https://www.test-provider.com/recipe6', title: 'Recipe 6' },
        { url: 'https://www.test-provider.com/recipe7', title: 'Recipe 7' },
        { url: 'https://www.test-provider.com/recipe8', title: 'Recipe 8' },
        { url: 'https://www.test-provider.com/recipe9', title: 'Recipe 9' },
        { url: 'https://www.test-provider.com/recipe10', title: 'Recipe 10' },
      ]);

      const onImageLoaded = jest.fn();

      for await (const progress of provider.discoverRecipeUrls({
        onImageLoaded,
        signal: controller.signal,
      })) {
        if (progress.recipesFound > 0) {
          controller.abort();
        }
        if (progress.isComplete) break;
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      expect(onImageLoaded.mock.calls.length).toBeLessThan(10);
    });
  });

  describe('parseSelectedRecipes', () => {
    const selectedRecipes = [
      { url: 'https://www.test-provider.com/recipe1', title: 'Recipe 1' },
      { url: 'https://www.test-provider.com/recipe2', title: 'Recipe 2' },
    ];

    it('yields initial parsing progress', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(hellofreshRecipePageHtml),
      });

      const generator = provider.parseSelectedRecipes(selectedRecipes);
      const firstProgress = await generator.next();

      expect(firstProgress.value).toMatchObject({
        phase: 'parsing',
        current: 0,
        total: 2,
      });
    });

    it('yields complete progress at the end', async () => {
      jest.useRealTimers();

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(hellofreshRecipePageHtml),
      });

      let lastProgress;

      for await (const progress of provider.parseSelectedRecipes(selectedRecipes)) {
        lastProgress = progress;
      }

      expect(lastProgress).toMatchObject({
        phase: 'complete',
        total: 2,
      });
    });

    it('adds failed recipes on fetch error', async () => {
      jest.useRealTimers();

      mockFetch.mockRejectedValue(new Error('Network error'));

      let lastProgress;

      for await (const progress of provider.parseSelectedRecipes(selectedRecipes)) {
        lastProgress = progress;
      }

      expect(lastProgress?.failedRecipes.length).toBe(2);
      expect(lastProgress?.failedRecipes[0].error).toContain('Network error');
    });

    it('stops on abort signal', async () => {
      jest.useRealTimers();

      const controller = new AbortController();
      controller.abort();

      let lastProgress;

      for await (const progress of provider.parseSelectedRecipes(selectedRecipes, {
        signal: controller.signal,
      })) {
        lastProgress = progress;
      }

      expect(lastProgress?.parsedRecipes.length).toBe(0);
    });
  });

  describe('fetchRecipe', () => {
    it('returns converted recipe on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(hellofreshRecipePageHtml),
      });

      const result = await provider.fetchRecipe('https://example.com/recipe', 4, {
        prefixes: [],
        exactMatches: [],
      });

      expect(result.url).toBe('https://example.com/recipe');
      expect(result.converted).toBeDefined();
      expect(result.converted.title).toBeDefined();
    });

    it('throws on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        provider.fetchRecipe('https://example.com/recipe', 4, { prefixes: [], exactMatches: [] })
      ).rejects.toThrow('HTTP 404');
    });

    it('throws on parse failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body>No JSON-LD</body></html>'),
      });

      await expect(
        provider.fetchRecipe('https://example.com/recipe', 4, { prefixes: [], exactMatches: [] })
      ).rejects.toThrow('Failed to parse recipe');
    });
  });

  describe('fetchHtml', () => {
    it('returns HTML content on success', async () => {
      const testHtml = '<html><body>Test</body></html>';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(testHtml),
      });

      const result = await (provider as any).fetchHtml('https://example.com');

      expect(result).toBe(testHtml);
    });

    it('throws on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect((provider as any).fetchHtml('https://example.com')).rejects.toThrow('HTTP 500');
    });

    it('handles abort signal', async () => {
      const controller = new AbortController();
      controller.abort();

      mockFetch.mockImplementation(() => {
        throw new DOMException('Aborted', 'AbortError');
      });

      await expect(
        (provider as any).fetchHtml('https://example.com', controller.signal)
      ).rejects.toThrow();
    });
  });
});
