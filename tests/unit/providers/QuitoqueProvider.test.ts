import { QuitoqueProvider } from '@providers/QuitoqueProvider';
import {
  createEmptyScrapedRecipe,
  mockScrapeRecipeFromHtml,
  mockScrapeRecipeFromHtmlSuccess,
} from '@mocks/modules/recipe-scraper-mock';
import { mockFetch } from '@mocks/deps/fetch-mock';
import { quitoqueCamembertRecipe } from '@test-data/scraperMocks/quitoque';

jest.mock(
  '@app/modules/recipe-scraper',
  () => require('@mocks/modules/recipe-scraper-mock').recipeScraperMock
);

describe('QuitoqueProvider', () => {
  let provider: QuitoqueProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new QuitoqueProvider();
  });

  describe('static properties', () => {
    it('has correct id', () => {
      expect(provider.id).toBe('quitoque');
    });

    it('has correct name', () => {
      expect(provider.name).toBe('Quitoque');
    });

    it('has valid logo URL', () => {
      expect(provider.logoUrl).toContain('quitoque');
    });

    it('is available only for French language', () => {
      expect(provider.supportedLanguages).toEqual(['fr']);
    });
  });

  describe('getBaseUrl', () => {
    it('returns French URL (Quitoque is France-only)', async () => {
      const result = await provider.getBaseUrl();

      expect(result).toBe('https://www.quitoque.fr');
    });
  });

  describe('discoverCategoryUrls', () => {
    const baseUrl = 'https://www.quitoque.fr';
    const recipeHtml = '<a href="/recettes/poulet-roti">Recipe</a>';
    const emptyHtml = '<div>No recipes here</div>';

    it('discovers pages dynamically until finding empty page', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(recipeHtml) })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(recipeHtml) })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(recipeHtml) })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(emptyHtml) })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(emptyHtml) });

      const categories = await provider.discoverCategoryUrls(baseUrl);

      expect(categories.length).toBe(3);
      expect(categories[0]).toBe('https://www.quitoque.fr/recettes?page=1');
      expect(categories[2]).toBe('https://www.quitoque.fr/recettes?page=3');
    });

    it('returns empty array when no recipes found on first page', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(emptyHtml),
      });

      const categories = await provider.discoverCategoryUrls(baseUrl);

      expect(categories).toEqual([]);
    });

    it('returns empty array on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const categories = await provider.discoverCategoryUrls(baseUrl);

      expect(categories).toEqual([]);
    });
  });

  describe('extractRecipeLinksFromHtml', () => {
    it('extracts recipe URLs from HTML', () => {
      const html = `
        <a href="/recettes/poulet-roti-aux-herbes">Recipe 1</a>
        <a href="/recettes/pizza-margherita">Recipe 2</a>
      `;

      const results = provider.extractRecipeLinksFromHtml(html);

      expect(results).toHaveLength(2);
      expect(results[0].url).toBe('https://www.quitoque.fr/recettes/poulet-roti-aux-herbes');
      expect(results[1].url).toBe('https://www.quitoque.fr/recettes/pizza-margherita');
    });

    it('extracts titles from URL slugs', () => {
      const html = '<a href="/recettes/poulet-tikka-masala">Recipe</a>';

      const results = provider.extractRecipeLinksFromHtml(html);

      expect(results[0].title).toBe('Poulet tikka masala');
    });

    it('capitalizes first letter of title', () => {
      const html = '<a href="/recettes/spaghetti-bolognese">Recipe</a>';

      const results = provider.extractRecipeLinksFromHtml(html);

      expect(results[0].title?.charAt(0)).toBe('S');
    });

    it('deduplicates recipe URLs', () => {
      const html = `
        <a href="/recettes/poulet-roti">Recipe 1</a>
        <a href="/recettes/poulet-roti">Recipe 1 duplicate</a>
      `;

      const results = provider.extractRecipeLinksFromHtml(html);

      expect(results).toHaveLength(1);
    });

    it('filters out invalid recipe paths', () => {
      const html = `
        <a href="/recettes">All recipes</a>
        <a href="/recettes/a">Too short</a>
        <a href="/recettes/poulet-roti-aux-herbes">Valid</a>
      `;

      const results = provider.extractRecipeLinksFromHtml(html);

      expect(results).toHaveLength(1);
      expect(results[0].url).toContain('poulet-roti-aux-herbes');
    });
  });

  describe('fetchImageUrlForRecipe', () => {
    const recipeUrl = 'https://www.quitoque.fr/recettes/camembert-roti';
    const abortController = new AbortController();
    const realImageUrl = 'https://www.quitoque.fr/media/cache/recipe-image.jpg';
    const placeholderUrl = 'https://www.quitoque.fr/images/placeholder.jpg';

    it('extracts image from JSON-LD schema directly', async () => {
      const htmlWithJsonLd = `
        <html>
          <script type="application/ld+json">
            {"@type": "Recipe", "image": "${realImageUrl}"}
          </script>
        </html>
      `;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(htmlWithJsonLd),
      });

      const result = await provider.fetchImageUrlForRecipe(recipeUrl, abortController.signal);

      expect(result).toBe(realImageUrl);
      expect(mockScrapeRecipeFromHtml).not.toHaveBeenCalled();
    });

    it('skips placeholder images from JSON-LD and falls back to scraper', async () => {
      const htmlWithPlaceholder = `
        <html>
          <script type="application/ld+json">
            {"@type": "Recipe", "image": "${placeholderUrl}"}
          </script>
        </html>
      `;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(htmlWithPlaceholder),
      });
      mockScrapeRecipeFromHtmlSuccess(quitoqueCamembertRecipe);

      const result = await provider.fetchImageUrlForRecipe(recipeUrl, abortController.signal);

      expect(result).toBe(quitoqueCamembertRecipe.image);
      expect(mockScrapeRecipeFromHtml).toHaveBeenCalled();
    });

    it('returns null when both JSON-LD and scraper return placeholders', async () => {
      const htmlWithPlaceholder = `
        <html>
          <script type="application/ld+json">
            {"@type": "Recipe", "image": "${placeholderUrl}"}
          </script>
        </html>
      `;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(htmlWithPlaceholder),
      });
      mockScrapeRecipeFromHtmlSuccess(createEmptyScrapedRecipe({ image: placeholderUrl }));

      const result = await provider.fetchImageUrlForRecipe(recipeUrl, abortController.signal);

      expect(result).toBeNull();
    });

    it('handles @graph format in JSON-LD', async () => {
      const htmlWithGraph = `
        <html>
          <script type="application/ld+json">
            {"@graph": [{"@type": "WebPage"}, {"@type": "Recipe", "image": "${realImageUrl}"}]}
          </script>
        </html>
      `;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(htmlWithGraph),
      });

      const result = await provider.fetchImageUrlForRecipe(recipeUrl, abortController.signal);

      expect(result).toBe(realImageUrl);
    });

    it('handles image as array in JSON-LD', async () => {
      const htmlWithArray = `
        <html>
          <script type="application/ld+json">
            {"@type": "Recipe", "image": ["${realImageUrl}", "other.jpg"]}
          </script>
        </html>
      `;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(htmlWithArray),
      });

      const result = await provider.fetchImageUrlForRecipe(recipeUrl, abortController.signal);

      expect(result).toBe(realImageUrl);
    });

    it('returns null on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.fetchImageUrlForRecipe(recipeUrl, abortController.signal);

      expect(result).toBeNull();
    });
  });
});
