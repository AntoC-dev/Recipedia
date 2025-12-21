import { BaseRecipeProvider } from '@providers/BaseRecipeProvider';
import { hellofreshRecipePageHtml } from '@test-data/scraperMocks/hellofresh';
import { mockFetch } from '@mocks/deps/fetch-mock';

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
      expect(secondUpdate.categoriesScanned).toBeGreaterThanOrEqual(1);
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
