import { BaseRecipeProvider } from '@providers/BaseRecipeProvider';
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

  describe('extractImageFromHtml', () => {
    it('returns null by default', () => {
      expect(provider.extractImageFromHtml('<html></html>')).toBeNull();
    });
  });

  describe('canHandleUrl', () => {
    it('returns false by default', () => {
      expect(provider.canHandleUrl('https://www.test-provider.com/recipe1')).toBe(false);
    });
  });

  describe('multi-batch category scanning', () => {
    it('delays between batches and scans all categories when there are more than the concurrency limit', async () => {
      jest.useRealTimers();
      jest.spyOn(provider as any, 'delay').mockResolvedValue(undefined);

      provider.setTestCategoryUrls([
        'https://www.test-provider.com/cat1',
        'https://www.test-provider.com/cat2',
        'https://www.test-provider.com/cat3',
        'https://www.test-provider.com/cat4',
      ]);

      let lastProgress;
      for await (const progress of provider.discoverRecipeUrls()) {
        lastProgress = progress;
      }

      expect(lastProgress).toMatchObject({
        phase: 'complete',
        isComplete: true,
        totalCategories: 4,
        categoriesScanned: 4,
      });
      expect((provider as any).delay).toHaveBeenCalled();
    });
  });

  describe('failed category pages', () => {
    it('marks the page empty and logs when fetch rejects with an Error', async () => {
      jest.useRealTimers();
      jest.spyOn(provider as any, 'delay').mockResolvedValue(undefined);
      mockFetch.mockRejectedValueOnce(new Error('network down'));

      let lastProgress;
      for await (const progress of provider.discoverRecipeUrls()) {
        lastProgress = progress;
      }

      expect(lastProgress?.recipesFound).toBe(2);
    });

    it('marks the page empty and logs when fetch rejects with a non-Error value', async () => {
      jest.useRealTimers();
      jest.spyOn(provider as any, 'delay').mockResolvedValue(undefined);
      mockFetch.mockRejectedValueOnce('boom');

      let lastProgress;
      for await (const progress of provider.discoverRecipeUrls()) {
        lastProgress = progress;
      }

      expect(lastProgress?.recipesFound).toBe(2);
    });
  });

  describe('empty category pages', () => {
    it('adds a page with zero links to emptyPages instead of recipes', async () => {
      jest.useRealTimers();

      provider.setTestCategoryUrls(['https://www.test-provider.com/cat1']);
      provider.setTestRecipeLinks([]);

      let lastProgress;
      for await (const progress of provider.discoverRecipeUrls()) {
        lastProgress = progress;
      }

      expect(lastProgress?.recipesFound).toBe(0);
    });
  });

  describe('retryEmptyPages', () => {
    it('recovers some empty pages and warns about pages still empty after exhausting retries', async () => {
      jest.useRealTimers();
      jest.spyOn(provider as any, 'delay').mockResolvedValue(undefined);

      const cat1 = 'https://www.test-provider.com/cat1';
      const cat2 = 'https://www.test-provider.com/cat2';
      const cat3 = 'https://www.test-provider.com/cat3';
      provider.setTestCategoryUrls([cat1, cat2, cat3]);

      const cat1Responses = ['empty', 'links'];
      const cat2Responses = ['empty', 'empty', 'empty', 'empty'];
      const responsesByUrl: Record<string, string[]> = {
        [cat1]: cat1Responses,
        [cat2]: cat2Responses,
        [cat3]: ['links'],
      };

      mockFetch.mockImplementation((url: string) => {
        const queue = responsesByUrl[url]!;
        const html = queue.length > 1 ? queue.shift()! : queue[0]!;
        return Promise.resolve({ ok: true, text: () => Promise.resolve(html) });
      });

      (provider as any).extractRecipeLinksFromHtml = (html: string) =>
        html === 'links'
          ? [{ url: `https://www.test-provider.com/recipe-${html}-${Math.random()}` }]
          : [];

      let lastProgress;
      for await (const progress of provider.discoverRecipeUrls()) {
        lastProgress = progress;
      }

      expect(lastProgress?.phase).toBe('complete');
      expect(lastProgress?.recipesFound).toBe(2);
    });

    it('stops retrying when the abort signal fires mid-retry', async () => {
      jest.useRealTimers();

      const controller = new AbortController();
      const cat1 = 'https://www.test-provider.com/cat1';
      const cat2 = 'https://www.test-provider.com/cat2';
      provider.setTestCategoryUrls([cat1, cat2]);

      const responsesByUrl: Record<string, string> = { [cat1]: 'empty', [cat2]: 'links' };
      mockFetch.mockImplementation((url: string) =>
        Promise.resolve({ ok: true, text: () => Promise.resolve(responsesByUrl[url]) })
      );
      (provider as any).extractRecipeLinksFromHtml = (html: string) =>
        html === 'links' ? [{ url: 'https://www.test-provider.com/recipeX' }] : [];

      jest.spyOn(provider as any, 'delay').mockImplementation(async () => {
        controller.abort();
      });

      let lastProgress;
      for await (const progress of provider.discoverRecipeUrls({ signal: controller.signal })) {
        lastProgress = progress;
      }

      expect(lastProgress?.phase).toBe('complete');
    });

    it('stops mid-batch inside a retry attempt when the abort signal fires between retried pages', async () => {
      jest.useRealTimers();

      const controller = new AbortController();
      const cat1 = 'https://www.test-provider.com/cat1';
      const cat2 = 'https://www.test-provider.com/cat2';
      const cat3 = 'https://www.test-provider.com/cat3';
      provider.setTestCategoryUrls([cat1, cat2, cat3]);

      const responsesByUrl: Record<string, string> = {
        [cat1]: 'empty',
        [cat2]: 'empty',
        [cat3]: 'links',
      };
      mockFetch.mockImplementation((url: string) =>
        Promise.resolve({ ok: true, text: () => Promise.resolve(responsesByUrl[url]) })
      );
      (provider as any).extractRecipeLinksFromHtml = (html: string) =>
        html === 'links' ? [{ url: 'https://www.test-provider.com/recipeX' }] : [];

      let delayCalls = 0;
      jest.spyOn(provider as any, 'delay').mockImplementation(async () => {
        delayCalls++;
        if (delayCalls === 2) {
          controller.abort();
        }
      });

      let lastProgress;
      for await (const progress of provider.discoverRecipeUrls({ signal: controller.signal })) {
        lastProgress = progress;
      }

      expect(lastProgress?.phase).toBe('complete');
      expect(lastProgress?.recipesFound).toBe(1);
    });
  });

  describe('delay', () => {
    it('resolves to undefined after the given time', async () => {
      jest.useRealTimers();

      await expect((provider as any).delay(5)).resolves.toBeUndefined();
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
