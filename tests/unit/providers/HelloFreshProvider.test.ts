import { HelloFreshProvider } from '@providers/HelloFreshProvider';
import { mockGetLanguage } from '@mocks/utils/settings-mock';
import {
  hellofreshCategoryPageHtml,
  hellofreshRecipesPageHtml,
} from '@test-data/scraperMocks/hellofresh';
import { mockFetch } from '@mocks/deps/fetch-mock';

describe('HelloFreshProvider', () => {
  let provider: HelloFreshProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new HelloFreshProvider();
  });

  describe('static properties', () => {
    it('has correct id', () => {
      expect(provider.id).toBe('hellofresh');
    });

    it('has correct name', () => {
      expect(provider.name).toBe('HelloFresh');
    });

    it('has valid logo URL', () => {
      expect(provider.logoUrl).toContain('hellofresh');
      expect(provider.logoUrl).toContain('logo');
    });
  });

  describe('getBaseUrl', () => {
    it('returns French URL for fr language', async () => {
      mockGetLanguage.mockResolvedValueOnce('fr');

      const result = await provider.getBaseUrl();

      expect(result).toBe('https://www.hellofresh.fr');
    });

    it('returns English URL for en language', async () => {
      mockGetLanguage.mockResolvedValueOnce('en');

      const result = await provider.getBaseUrl();

      expect(result).toBe('https://www.hellofresh.com');
    });

    it('returns German URL for de language', async () => {
      mockGetLanguage.mockResolvedValueOnce('de');

      const result = await provider.getBaseUrl();

      expect(result).toBe('https://www.hellofresh.de');
    });

    it('returns Dutch URL for nl language', async () => {
      mockGetLanguage.mockResolvedValueOnce('nl');

      const result = await provider.getBaseUrl();

      expect(result).toBe('https://www.hellofresh.nl');
    });

    it('returns Italian URL for it language', async () => {
      mockGetLanguage.mockResolvedValueOnce('it');

      const result = await provider.getBaseUrl();

      expect(result).toBe('https://www.hellofresh.it');
    });

    it('returns Spanish URL for es language', async () => {
      mockGetLanguage.mockResolvedValueOnce('es');

      const result = await provider.getBaseUrl();

      expect(result).toBe('https://www.hellofresh.es');
    });

    it('returns Danish URL for da language', async () => {
      mockGetLanguage.mockResolvedValueOnce('da');

      const result = await provider.getBaseUrl();

      expect(result).toBe('https://www.hellofresh.dk');
    });

    it('returns Swedish URL for sv language', async () => {
      mockGetLanguage.mockResolvedValueOnce('sv');

      const result = await provider.getBaseUrl();

      expect(result).toBe('https://www.hellofresh.se');
    });

    it('returns Norwegian URL for nb language', async () => {
      mockGetLanguage.mockResolvedValueOnce('nb');

      const result = await provider.getBaseUrl();

      expect(result).toBe('https://www.hellofresh.no');
    });

    it('throws error for unsupported language', async () => {
      mockGetLanguage.mockResolvedValueOnce('zh');

      await expect(provider.getBaseUrl()).rejects.toThrow(
        /HelloFresh is not available for language "zh"/
      );
    });

    it('includes supported languages in error message', async () => {
      mockGetLanguage.mockResolvedValueOnce('ja');

      await expect(provider.getBaseUrl()).rejects.toThrow('Supported languages:');
    });
  });

  describe('discoverCategoryUrls', () => {
    beforeEach(async () => {
      mockGetLanguage.mockResolvedValue('fr');
      await provider.getBaseUrl();
    });

    it('extracts category URLs from recipes page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(hellofreshRecipesPageHtml),
      });

      const categories = await provider.discoverCategoryUrls('https://www.hellofresh.fr');

      expect(categories).toContain('https://www.hellofresh.fr/recipes/recettes-faciles');
      expect(categories).toContain('https://www.hellofresh.fr/recipes/recettes-vegetariennes');
      expect(categories).toContain('https://www.hellofresh.fr/recipes/recettes-rapides');
      expect(categories).toContain('https://www.hellofresh.fr/recipes/plats-principaux');
    });

    it('filters out recipe URLs ending with hex IDs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(hellofreshRecipesPageHtml),
      });

      const categories = await provider.discoverCategoryUrls('https://www.hellofresh.fr');

      const hasRecipeWithHexId = categories.some(url => /[a-f0-9]{24}$/.test(url));
      expect(hasRecipeWithHexId).toBe(false);
    });

    it('returns empty array on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const categories = await provider.discoverCategoryUrls('https://www.hellofresh.fr');

      expect(categories).toEqual([]);
    });

    it('returns empty array on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const categories = await provider.discoverCategoryUrls('https://www.hellofresh.fr');

      expect(categories).toEqual([]);
    });
  });

  describe('extractRecipeLinksFromHtml', () => {
    beforeEach(async () => {
      mockGetLanguage.mockResolvedValue('fr');
      await provider.getBaseUrl();
    });

    it('extracts recipe URLs with 24-char hex IDs', () => {
      const results = provider.extractRecipeLinksFromHtml(hellofreshCategoryPageHtml);

      expect(results.length).toBeGreaterThan(0);

      const urls = results.map(r => r.url);
      expect(urls).toContain(
        'https://www.hellofresh.fr/recipes/keftas-de-boeuf-66e83b9e7dfc60d59bf5f913'
      );
      expect(urls).toContain(
        'https://www.hellofresh.fr/recipes/poulet-tikka-masala-66e83b9e7dfc60d59bf5f914'
      );
      expect(urls).toContain(
        'https://www.hellofresh.fr/recipes/spaghetti-bolognese-66e83b9e7dfc60d59bf5f915'
      );
    });

    it('extracts titles from URL slugs', () => {
      const results = provider.extractRecipeLinksFromHtml(hellofreshCategoryPageHtml);

      const keftas = results.find(r => r.url.includes('keftas-de-boeuf'));
      expect(keftas?.title).toBe('Keftas de boeuf');

      const poulet = results.find(r => r.url.includes('poulet-tikka-masala'));
      expect(poulet?.title).toBe('Poulet tikka masala');

      const spaghetti = results.find(r => r.url.includes('spaghetti-bolognese'));
      expect(spaghetti?.title).toBe('Spaghetti bolognese');
    });

    it('capitalizes first letter of title', () => {
      const results = provider.extractRecipeLinksFromHtml(hellofreshCategoryPageHtml);

      results.forEach(result => {
        if (result.title) {
          expect(result.title.charAt(0)).toBe(result.title.charAt(0).toUpperCase());
        }
      });
    });

    it('deduplicates recipe URLs', () => {
      const results = provider.extractRecipeLinksFromHtml(hellofreshCategoryPageHtml);

      const urls = results.map(r => r.url);
      const uniqueUrls = [...new Set(urls)];
      expect(urls.length).toBe(uniqueUrls.length);
    });

    it('filters out category URLs without hex IDs', () => {
      const results = provider.extractRecipeLinksFromHtml(hellofreshCategoryPageHtml);

      const categoryUrl = results.find(r => r.url.includes('recettes-italiennes'));
      expect(categoryUrl).toBeUndefined();
    });

    it('resolves relative URLs to absolute URLs', () => {
      const results = provider.extractRecipeLinksFromHtml(hellofreshCategoryPageHtml);

      results.forEach(result => {
        expect(result.url).toMatch(/^https:\/\//);
      });
    });

    it('throws if base URL not initialized', () => {
      const freshProvider = new HelloFreshProvider();

      expect(() => freshProvider.extractRecipeLinksFromHtml(hellofreshCategoryPageHtml)).toThrow(
        'Base URL not initialized'
      );
    });

    it('handles absolute URLs in HTML', () => {
      const results = provider.extractRecipeLinksFromHtml(hellofreshCategoryPageHtml);

      const absoluteUrlRecipe = results.find(r => r.url.includes('poulet-tikka-masala'));
      expect(absoluteUrlRecipe).toBeDefined();
      expect(absoluteUrlRecipe?.url).toBe(
        'https://www.hellofresh.fr/recipes/poulet-tikka-masala-66e83b9e7dfc60d59bf5f914'
      );
    });
  });

  describe('discoverRecipeUrls', () => {
    beforeEach(async () => {
      mockGetLanguage.mockResolvedValue('fr');
    });

    it('yields progress updates during discovery', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(hellofreshRecipesPageHtml),
        })
        .mockResolvedValue({
          ok: true,
          text: () => Promise.resolve(hellofreshCategoryPageHtml),
        });

      const progressUpdates: unknown[] = [];

      for await (const progress of provider.discoverRecipeUrls()) {
        progressUpdates.push(progress);
      }

      expect(progressUpdates.length).toBeGreaterThan(0);

      const firstUpdate = progressUpdates[0] as { phase: string };
      expect(firstUpdate.phase).toBe('discovering');

      const lastUpdate = progressUpdates[progressUpdates.length - 1] as { phase: string };
      expect(lastUpdate.phase).toBe('complete');
    });

    it('respects maxRecipes limit', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(hellofreshRecipesPageHtml),
        })
        .mockResolvedValue({
          ok: true,
          text: () => Promise.resolve(hellofreshCategoryPageHtml),
        });

      let finalRecipes: unknown[] = [];

      for await (const progress of provider.discoverRecipeUrls({ maxRecipes: 2 })) {
        if (progress.phase === 'complete') {
          finalRecipes = progress.recipes;
        }
      }

      expect(finalRecipes.length).toBeLessThanOrEqual(2);
    });

    it('handles abort signal', async () => {
      const controller = new AbortController();
      controller.abort();

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(hellofreshRecipesPageHtml),
      });

      const progressUpdates: unknown[] = [];

      for await (const progress of provider.discoverRecipeUrls({ signal: controller.signal })) {
        progressUpdates.push(progress);
      }

      const lastUpdate = progressUpdates[progressUpdates.length - 1] as {
        recipesFound: number;
        phase: string;
      };
      expect(lastUpdate.phase).toBe('complete');
      expect(lastUpdate.recipesFound).toBe(0);
    });
  });
});
