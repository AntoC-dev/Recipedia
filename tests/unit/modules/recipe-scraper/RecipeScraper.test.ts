import { RecipeScraper, usePythonReady } from '@app/modules/recipe-scraper/src/RecipeScraper';
import { renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { nutritionKcalSuffixHtml } from '@test-data/scraperMocks/htmlFixtures';

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
    it('returns UnsupportedPlatform error when no native module or Pyodide', async () => {
      const result = await scraper.scrapeRecipeAuthenticated(
        'https://example.com/recipe',
        'user@example.com',
        'password123'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('UnsupportedPlatform');
        expect(result.error.message).toContain('requires Android or iOS');
      }
    });
  });

  describe('getSupportedAuthHosts', () => {
    it('returns empty array when no native module or Pyodide', async () => {
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

  describe('isPythonReady', () => {
    it('returns true on web platform (no native module)', async () => {
      const result = await scraper.isPythonReady();
      expect(result).toBe(true);
    });
  });

  describe('waitForReady', () => {
    it('returns true immediately on web platform', async () => {
      const startTime = Date.now();
      const result = await scraper.waitForReady();
      const elapsed = Date.now() - startTime;

      expect(result).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });

    it('respects timeout parameter', async () => {
      const result = await scraper.waitForReady(100);
      expect(result).toBe(true);
    });
  });

  describe('usePythonReady hook', () => {
    it('returns true on web platform', async () => {
      const { result } = renderHook(() => usePythonReady());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('initially returns false then becomes true', async () => {
      const { result } = renderHook(() => usePythonReady());

      expect(result.current).toBe(false);

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });
});

describe('RecipeScraper (Pyodide/iOS path)', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalOS = Platform.OS;
  const RECIPE_DATA = { title: 'Camembert Roti', ingredients: ['camembert'], description: '' };

  beforeEach(() => {
    jest.resetModules();
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  function loadScraperWithMocks(
    mockAuthBridge: Record<string, jest.Mock>,
    mockPyodideBridge?: Record<string, jest.Mock>
  ) {
    const defaultPyodideMock = {
      scrapeRecipeFromHtml: jest
        .fn()
        .mockResolvedValue(JSON.stringify({ success: true, data: RECIPE_DATA })),
      isPythonReady: jest.fn().mockReturnValue(true),
      waitForReady: jest.fn().mockResolvedValue(true),
    };

    jest.doMock('../../../../modules/recipe-scraper/src/ios/AuthBridge', () => ({
      AuthBridge: mockAuthBridge,
    }));
    jest.doMock('../../../../modules/recipe-scraper/src/ios/PyodideBridge', () => ({
      PyodideBridge: mockPyodideBridge ?? defaultPyodideMock,
    }));

    const { RecipeScraper: Scraper } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../../../modules/recipe-scraper/src/RecipeScraper');
    return new Scraper();
  }

  describe('scrapeRecipeAuthenticated', () => {
    it('delegates to AuthBridge then parses returned HTML via Pyodide', async () => {
      const mockPyodide = {
        scrapeRecipeFromHtml: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ success: true, data: RECIPE_DATA })),
        isPythonReady: jest.fn().mockReturnValue(true),
        waitForReady: jest.fn().mockResolvedValue(true),
      };
      const mockAuth = {
        isHostSupported: jest.fn().mockReturnValue(true),
        fetchAuthenticatedHtml: jest.fn().mockResolvedValue(SIMPLE_RECIPE_HTML),
      };

      const scraper = loadScraperWithMocks(mockAuth, mockPyodide);
      const result = await scraper.scrapeRecipeAuthenticated(
        'https://www.quitoque.fr/products/123',
        'user@test.com',
        'pass123'
      );

      expect(mockAuth.isHostSupported).toHaveBeenCalledWith('quitoque.fr');
      expect(mockAuth.fetchAuthenticatedHtml).toHaveBeenCalledWith(
        'https://www.quitoque.fr/products/123',
        'user@test.com',
        'pass123'
      );
      expect(mockPyodide.scrapeRecipeFromHtml).toHaveBeenCalledWith(
        SIMPLE_RECIPE_HTML,
        'https://www.quitoque.fr/products/123',
        false
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Camembert Roti');
      }
    });

    it('always passes wildMode=false to Pyodide parser regardless of user options', async () => {
      const mockPyodide = {
        scrapeRecipeFromHtml: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ success: true, data: RECIPE_DATA })),
        isPythonReady: jest.fn().mockReturnValue(true),
        waitForReady: jest.fn().mockResolvedValue(true),
      };
      const mockAuth = {
        isHostSupported: jest.fn().mockReturnValue(true),
        fetchAuthenticatedHtml: jest.fn().mockResolvedValue(SIMPLE_RECIPE_HTML),
      };

      const scraper = loadScraperWithMocks(mockAuth, mockPyodide);
      await scraper.scrapeRecipeAuthenticated(
        'https://www.quitoque.fr/products/123',
        'user@test.com',
        'pass123',
        { wildMode: true }
      );

      expect(mockPyodide.scrapeRecipeFromHtml).toHaveBeenCalledWith(
        SIMPLE_RECIPE_HTML,
        'https://www.quitoque.fr/products/123',
        false
      );
    });

    it('returns UnsupportedAuthSite for unsupported host', async () => {
      const mockAuth = {
        isHostSupported: jest.fn().mockReturnValue(false),
        fetchAuthenticatedHtml: jest.fn(),
      };

      const scraper = loadScraperWithMocks(mockAuth);
      const result = await scraper.scrapeRecipeAuthenticated(
        'https://www.unknown-site.com/recipe/123',
        'user@test.com',
        'pass123'
      );

      expect(mockAuth.fetchAuthenticatedHtml).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('UnsupportedAuthSite');
      }
    });

    it('returns EXCEPTION when AuthBridge throws', async () => {
      const mockAuth = {
        isHostSupported: jest.fn().mockReturnValue(true),
        fetchAuthenticatedHtml: jest
          .fn()
          .mockRejectedValue(new Error('Login failed - credentials may be incorrect')),
      };

      const scraper = loadScraperWithMocks(mockAuth);
      const result = await scraper.scrapeRecipeAuthenticated(
        'https://www.quitoque.fr/products/123',
        'user@test.com',
        'wrongpass'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('EXCEPTION');
        expect(result.error.message).toContain('Login failed');
      }
    });
  });

  describe('getSupportedAuthHosts', () => {
    it('returns host list from AuthBridge synchronously', async () => {
      const mockAuth = {
        getAuthHandlerHosts: jest.fn().mockReturnValue(['quitoque.fr']),
      };

      const scraper = loadScraperWithMocks(mockAuth);
      const result = await scraper.getSupportedAuthHosts();

      expect(mockAuth.getAuthHandlerHosts).toHaveBeenCalled();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['quitoque.fr']);
      }
    });
  });
});

describe('RecipeScraper (Android native module path)', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.resetModules();
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  function loadScraperWithNativeModule(mockNativeModule: Record<string, jest.Mock>) {
    jest.doMock('../../../../modules/recipe-scraper/src/RecipeScraperModule', () => ({
      default: mockNativeModule,
    }));

    const {
      RecipeScraper: Scraper,
    } = require('../../../../modules/recipe-scraper/src/RecipeScraper');
    return new Scraper();
  }

  describe('scrapeRecipeAuthenticated', () => {
    it('applies TypeScript enhancements using html returned by Python', async () => {
      const mockScrapeAuthenticated = jest.fn().mockResolvedValue(
        JSON.stringify({
          success: true,
          html: nutritionKcalSuffixHtml,
          data: {
            title: 'Tartare de saumon',
            ingredients: [],
            instructions: null,
            nutrients: { calories: '374kCal' },
          },
        })
      );

      const scraper = loadScraperWithNativeModule({
        scrapeRecipeAuthenticated: mockScrapeAuthenticated,
      });
      const result = await scraper.scrapeRecipeAuthenticated(
        'https://www.quitoque.fr/products/123',
        'user@test.com',
        'pass123'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nutrients?.servingSize).toBe('249g');
        expect((result as any).html).toBeUndefined();
      }
    });

    it('handles missing html field in Python response gracefully', async () => {
      const mockScrapeAuthenticated = jest.fn().mockResolvedValue(
        JSON.stringify({
          success: true,
          data: {
            title: 'Test',
            ingredients: [],
            instructions: null,
            nutrients: { calories: '300kCal' },
          },
        })
      );

      const scraper = loadScraperWithNativeModule({
        scrapeRecipeAuthenticated: mockScrapeAuthenticated,
      });
      const result = await scraper.scrapeRecipeAuthenticated(
        'https://www.quitoque.fr/products/123',
        'u',
        'p'
      );

      expect(result.success).toBe(true);
      expect((result as any).html).toBeUndefined();
    });

    it('passes error result through without applying enhancements', async () => {
      const mockScrapeAuthenticated = jest.fn().mockResolvedValue(
        JSON.stringify({
          success: false,
          error: {
            type: 'AuthenticationFailed',
            message: 'Invalid credentials',
            host: 'quitoque.fr',
          },
        })
      );

      const scraper = loadScraperWithNativeModule({
        scrapeRecipeAuthenticated: mockScrapeAuthenticated,
      });
      const result = await scraper.scrapeRecipeAuthenticated(
        'https://www.quitoque.fr/products/123',
        'user@test.com',
        'wrongpass'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('AuthenticationFailed');
      }
    });
  });
});
