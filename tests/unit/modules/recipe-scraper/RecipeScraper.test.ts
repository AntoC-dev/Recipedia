import { RecipeScraper } from '@app/modules/recipe-scraper/src/RecipeScraper';

const SIMPLE_RECIPE_HTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Chocolate Cake Recipe</title>
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": "Chocolate Cake",
        "description": "A delicious chocolate cake",
        "recipeIngredient": ["200g flour", "100g sugar"],
        "recipeInstructions": "Mix and bake."
    }
    </script>
</head>
<body></body>
</html>
`;

const LOGIN_PAGE_HTML = `
<!DOCTYPE html>
<html>
<head><title>Connexion - Site</title></head>
<body><form action="/login"><input type="text" name="email"/></form></body>
</html>
`;

const LOGIN_PAGE_ENGLISH_HTML = `
<!DOCTYPE html>
<html>
<head><title>Sign In to Your Account</title></head>
<body><form action="/login"><input type="text" name="email"/></form></body>
</html>
`;

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.MockedFunction<typeof fetch>;

describe('RecipeScraper', () => {
  let scraper: RecipeScraper;

  beforeEach(() => {
    jest.clearAllMocks();
    scraper = new RecipeScraper();
  });

  describe('scrapeRecipe', () => {
    it('fetches URL and returns parsed recipe', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com/recipe',
        text: () => Promise.resolve(SIMPLE_RECIPE_HTML),
      } as Response);

      const result = await scraper.scrapeRecipe('https://example.com/recipe');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/recipe', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Chocolate Cake');
      }
    });

    it('returns FetchError on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await scraper.scrapeRecipe('https://example.com/missing');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FetchError');
        expect(result.error.message).toContain('404');
      }
    });

    it('returns FetchError on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await scraper.scrapeRecipe('https://example.com/recipe');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('EXCEPTION');
        expect(result.error.message).toContain('Network error');
      }
    });

    it('detects auth redirect and returns AuthenticationRequired', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com/login?redirect=/recipe',
        text: () => Promise.resolve('<html><head><title>Page</title></head></html>'),
      } as Response);

      const result = await scraper.scrapeRecipe('https://example.com/recipe');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('AuthenticationRequired');
        expect(result.error.host).toBe('example.com');
      }
    });

    it('detects auth page title and returns AuthenticationRequired', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com/some-page',
        text: () => Promise.resolve(LOGIN_PAGE_HTML),
      } as Response);

      const result = await scraper.scrapeRecipe('https://example.com/recipe');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('AuthenticationRequired');
      }
    });

    it('detects signin in URL path', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com/signin',
        text: () => Promise.resolve('<html><head><title>Page</title></head></html>'),
      } as Response);

      const result = await scraper.scrapeRecipe('https://example.com/recipe');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('AuthenticationRequired');
      }
    });

    it('detects sign-in in URL path', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com/sign-in',
        text: () => Promise.resolve('<html><head><title>Page</title></head></html>'),
      } as Response);

      const result = await scraper.scrapeRecipe('https://example.com/recipe');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('AuthenticationRequired');
      }
    });

    it('detects connexion in URL path (French)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://www.quitoque.fr/connexion',
        text: () => Promise.resolve('<html><head><title>Page</title></head></html>'),
      } as Response);

      const result = await scraper.scrapeRecipe('https://www.quitoque.fr/recipe');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('AuthenticationRequired');
        expect(result.error.host).toBe('quitoque.fr');
      }
    });

    it('detects English sign in title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com/account',
        text: () => Promise.resolve(LOGIN_PAGE_ENGLISH_HTML),
      } as Response);

      const result = await scraper.scrapeRecipe('https://example.com/recipe');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('AuthenticationRequired');
      }
    });

    it('does not flag valid recipe page as auth required', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com/recipe/chocolate-cake',
        text: () => Promise.resolve(SIMPLE_RECIPE_HTML),
      } as Response);

      const result = await scraper.scrapeRecipe('https://example.com/recipe/chocolate-cake');

      expect(result.success).toBe(true);
    });
  });

  describe('scrapeRecipeFromHtml', () => {
    it('parses recipe from HTML using SchemaRecipeParser', async () => {
      const result = await scraper.scrapeRecipeFromHtml(
        SIMPLE_RECIPE_HTML,
        'https://example.com/recipe'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Chocolate Cake');
        expect(result.data.description).toBe('A delicious chocolate cake');
        expect(result.data.ingredients).toContain('200g flour');
      }
    });

    it('applies enhancements to parsed recipe', async () => {
      const htmlWithLowercaseTitle = `
            <script type="application/ld+json">
            {"@type": "Recipe", "name": "chocolate cake", "recipeIngredient": ["flour"]}
            </script>
            `;

      const result = await scraper.scrapeRecipeFromHtml(
        htmlWithLowercaseTitle,
        'https://example.com/recipe'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Chocolate cake');
      }
    });

    it('returns error when no recipe found', async () => {
      const noRecipeHtml = '<html><body>No recipe here</body></html>';

      const result = await scraper.scrapeRecipeFromHtml(noRecipeHtml, 'https://example.com/page');

      expect(result.success).toBe(false);
    });
  });

  describe('getSupportedHosts', () => {
    it('returns empty array when no native module (iOS/Web)', async () => {
      const result = await scraper.getSupportedHosts();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('isHostSupported', () => {
    it('returns false when no native module (iOS/Web)', async () => {
      const result = await scraper.isHostSupported('allrecipes.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('scrapeRecipeAuthenticated', () => {
    it('returns UnsupportedPlatform error on iOS/Web', async () => {
      const result = await scraper.scrapeRecipeAuthenticated(
        'https://example.com/recipe',
        'user@example.com',
        'password123'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('UnsupportedPlatform');
        expect(result.error.message).toContain('only available on Android');
      }
    });
  });

  describe('getSupportedAuthHosts', () => {
    it('returns empty array when no native module (iOS/Web)', async () => {
      const result = await scraper.getSupportedAuthHosts();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('error handling', () => {
    it('handles malformed URLs gracefully in auth detection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'not-a-valid-url',
        text: () => Promise.resolve(SIMPLE_RECIPE_HTML),
      } as Response);

      const result = await scraper.scrapeRecipe('https://example.com/recipe');

      expect(result.success).toBe(true);
    });

    it('removes www from host in auth errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://www.example.com/login',
        text: () => Promise.resolve('<html><head><title>Page</title></head></html>'),
      } as Response);

      const result = await scraper.scrapeRecipe('https://www.example.com/recipe');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.host).toBe('example.com');
        expect(result.error.host).not.toContain('www');
      }
    });
  });
});
