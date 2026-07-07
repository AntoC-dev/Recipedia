import { parseSelectedRecipes, fetchRecipeImageUrl } from '@utils/RecipeImportOrchestrator';
import { createEmptyScrapedRecipe } from '@mocks/modules/recipe-scraper-mock';
import { ScrapedRecipe, ScraperResult } from '@app/modules/recipe-scraper';
import { DiscoveredRecipe, ParsingProgress, RecipeProvider } from '@customTypes/BulkImportTypes';
import { fetchHtml } from '@utils/UrlHelpers';
import { downloadImageToCache } from '@utils/FileGestion';

jest.mock('@utils/UrlHelpers', () => ({
  ...jest.requireActual('@utils/UrlHelpers'),
  fetchHtml: jest.fn(),
}));

jest.mock('@utils/FileGestion', () => ({
  ...jest.requireActual('@utils/FileGestion'),
  downloadImageToCache: jest.fn(),
}));

const mockFetchHtml = fetchHtml as jest.Mock;
const mockDownload = downloadImageToCache as jest.Mock;

const successResult = (data: ScrapedRecipe): ScraperResult<ScrapedRecipe> => ({
  success: true,
  data,
});

const errorResult = (message: string): ScraperResult<ScrapedRecipe> => ({
  success: false,
  error: { type: 'Error', message },
});

const scrapedPasta = (overrides: Partial<ScrapedRecipe> = {}): ScrapedRecipe =>
  createEmptyScrapedRecipe({
    title: 'Pasta',
    image: 'https://site.com/pic.jpg',
    ingredients: ['200g pasta'],
    instructionsList: ['Boil the pasta'],
    totalTime: 30,
    yields: '4 servings',
    ...overrides,
  });

const makeProvider = (
  extractImageFromHtml: (html: string) => string | null = () => null
): RecipeProvider =>
  ({
    id: 'test-provider',
    name: 'Test Provider',
    extractImageFromHtml: jest.fn(extractImageFromHtml),
  }) as unknown as RecipeProvider;

const discovered = (n: number, withImage = true): DiscoveredRecipe => ({
  url: `https://site.com/recipe-${n}`,
  title: `Recipe ${n}`,
  ...(withImage ? { imageUrl: `https://site.com/discovered-${n}.jpg` } : {}),
});

const collect = async (gen: AsyncGenerator<ParsingProgress>): Promise<ParsingProgress[]> => {
  const updates: ParsingProgress[] = [];
  for await (const update of gen) {
    updates.push(update);
  }
  return updates;
};

describe('RecipeImportOrchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchHtml.mockResolvedValue({ html: '<html></html>' });
    mockDownload.mockResolvedValue('/cache/image.jpg');
  });

  describe('parseSelectedRecipes', () => {
    test('parses a recipe and downloads its image', async () => {
      const scrapeFromHtml = jest.fn().mockResolvedValue(successResult(scrapedPasta()));

      const updates = await collect(
        parseSelectedRecipes(makeProvider(), [discovered(1)], { scrapeFromHtml })
      );

      const complete = updates[updates.length - 1];
      expect(complete.phase).toBe('complete');
      expect(complete.failedRecipes).toEqual([]);
      expect(complete.parsedRecipes).toHaveLength(1);
      expect(complete.parsedRecipes[0]).toMatchObject({
        url: 'https://site.com/recipe-1',
        title: 'Pasta',
        persons: 4,
        time: 30,
        localImageUri: '/cache/image.jpg',
      });
      expect(mockDownload).toHaveBeenCalledWith('https://site.com/pic.jpg');
    });

    test('emits a parsing progress update before the completion update', async () => {
      const scrapeFromHtml = jest.fn().mockResolvedValue(successResult(scrapedPasta()));

      const updates = await collect(
        parseSelectedRecipes(makeProvider(), [discovered(1)], { scrapeFromHtml })
      );

      expect(updates.map(u => u.phase)).toEqual(['parsing', 'complete']);
      expect(updates[0].total).toBe(1);
    });

    test('records a failure when the scraper returns an error', async () => {
      const scrapeFromHtml = jest.fn().mockResolvedValue(errorResult('no recipe found'));

      const updates = await collect(
        parseSelectedRecipes(makeProvider(), [discovered(1)], { scrapeFromHtml })
      );

      const complete = updates[updates.length - 1];
      expect(complete.parsedRecipes).toEqual([]);
      expect(complete.failedRecipes).toEqual([
        { url: 'https://site.com/recipe-1', title: 'Recipe 1', error: 'no recipe found' },
      ]);
    });

    test('records a failure with the error message when fetching throws an Error', async () => {
      mockFetchHtml.mockRejectedValue(new Error('network down'));
      const scrapeFromHtml = jest.fn();

      const updates = await collect(
        parseSelectedRecipes(makeProvider(), [discovered(1)], { scrapeFromHtml })
      );

      const complete = updates[updates.length - 1];
      expect(complete.failedRecipes[0].error).toBe('network down');
      expect(scrapeFromHtml).not.toHaveBeenCalled();
    });

    test('stringifies non-Error rejection reasons', async () => {
      mockFetchHtml.mockRejectedValue('boom');
      const scrapeFromHtml = jest.fn();

      const updates = await collect(
        parseSelectedRecipes(makeProvider(), [discovered(1)], { scrapeFromHtml })
      );

      expect(updates[updates.length - 1].failedRecipes[0].error).toBe('boom');
    });

    test('skips image download when the resolved image is a placeholder', async () => {
      const scrapeFromHtml = jest
        .fn()
        .mockResolvedValue(
          successResult(scrapedPasta({ image: 'https://site.com/placeholder.jpg' }))
        );

      const updates = await collect(
        parseSelectedRecipes(makeProvider(), [discovered(1, false)], { scrapeFromHtml })
      );

      expect(updates[updates.length - 1].parsedRecipes[0].localImageUri).toBeUndefined();
      expect(mockDownload).not.toHaveBeenCalled();
    });

    test('leaves localImageUri undefined when no image url is available', async () => {
      const scrapeFromHtml = jest
        .fn()
        .mockResolvedValue(successResult(scrapedPasta({ image: null })));

      const updates = await collect(
        parseSelectedRecipes(makeProvider(), [discovered(1, false)], { scrapeFromHtml })
      );

      expect(updates[updates.length - 1].parsedRecipes[0].localImageUri).toBeUndefined();
      expect(mockDownload).not.toHaveBeenCalled();
    });

    test('leaves localImageUri undefined when the download fails', async () => {
      mockDownload.mockResolvedValue(null);
      const scrapeFromHtml = jest.fn().mockResolvedValue(successResult(scrapedPasta()));

      const updates = await collect(
        parseSelectedRecipes(makeProvider(), [discovered(1)], { scrapeFromHtml })
      );

      expect(updates[updates.length - 1].parsedRecipes[0].localImageUri).toBeUndefined();
    });

    test('processes recipes in batches with a progress update per batch', async () => {
      jest.useFakeTimers();
      const scrapeFromHtml = jest.fn().mockResolvedValue(successResult(scrapedPasta()));
      const recipes = [discovered(1), discovered(2), discovered(3), discovered(4)];

      const collected = collect(parseSelectedRecipes(makeProvider(), recipes, { scrapeFromHtml }));
      await jest.runAllTimersAsync();
      const updates = await collected;
      jest.useRealTimers();

      expect(updates.filter(u => u.phase === 'parsing')).toHaveLength(2);
      expect(updates[updates.length - 1].parsedRecipes).toHaveLength(4);
    });

    test('stops before parsing when the signal is already aborted', async () => {
      const scrapeFromHtml = jest.fn();
      const controller = new AbortController();
      controller.abort();

      const updates = await collect(
        parseSelectedRecipes(makeProvider(), [discovered(1)], {
          scrapeFromHtml,
          signal: controller.signal,
        })
      );

      expect(updates).toHaveLength(1);
      expect(updates[0].phase).toBe('complete');
      expect(updates[0].parsedRecipes).toEqual([]);
      expect(mockFetchHtml).not.toHaveBeenCalled();
    });

    test('falls back to defaults when the scraped recipe is mostly empty', async () => {
      const scrapeFromHtml = jest
        .fn()
        .mockResolvedValue(successResult(createEmptyScrapedRecipe({})));

      const updates = await collect(
        parseSelectedRecipes(makeProvider(), [discovered(7, false)], {
          scrapeFromHtml,
          defaultPersons: 6,
        })
      );

      const parsed = updates[updates.length - 1].parsedRecipes[0];
      expect(parsed.title).toBe('Recipe 7');
      expect(parsed.persons).toBe(6);
      expect(parsed.time).toBe(0);
      expect(parsed.tags).toEqual([]);
      expect(parsed.preparation).toEqual([]);
    });

    test('falls back to the discovered image when the scraped image is empty', async () => {
      const scrapeFromHtml = jest
        .fn()
        .mockResolvedValue(successResult(scrapedPasta({ image: null })));

      await collect(
        parseSelectedRecipes(makeProvider(), [discovered(1, true)], { scrapeFromHtml })
      );

      expect(mockDownload).toHaveBeenCalledWith('https://site.com/discovered-1.jpg');
    });
  });

  describe('fetchRecipeImageUrl', () => {
    const signal = new AbortController().signal;

    test('returns the provider-extracted image when it is valid', async () => {
      const provider = makeProvider(() => 'https://site.com/from-provider.jpg');
      const scrapeFromHtml = jest.fn();

      const result = await fetchRecipeImageUrl(
        provider,
        'https://site.com/r',
        signal,
        scrapeFromHtml
      );

      expect(result).toBe('https://site.com/from-provider.jpg');
      expect(scrapeFromHtml).not.toHaveBeenCalled();
    });

    test('falls back to the scraper image when the provider image is a placeholder', async () => {
      const provider = makeProvider(() => 'https://site.com/placeholder.jpg');
      const scrapeFromHtml = jest
        .fn()
        .mockResolvedValue(successResult(scrapedPasta({ image: 'https://site.com/scraped.jpg' })));

      const result = await fetchRecipeImageUrl(
        provider,
        'https://site.com/r',
        signal,
        scrapeFromHtml
      );

      expect(result).toBe('https://site.com/scraped.jpg');
    });

    test('cleans afcdn image urls returned by the scraper', async () => {
      const provider = makeProvider();
      const scrapeFromHtml = jest
        .fn()
        .mockResolvedValue(
          successResult(scrapedPasta({ image: 'https://assets.afcdn.com/recipe_w300h200c1.jpg' }))
        );

      const result = await fetchRecipeImageUrl(
        provider,
        'https://site.com/r',
        signal,
        scrapeFromHtml
      );

      expect(result).toBe('https://assets.afcdn.com/recipe.jpg');
    });

    test('returns null when the scraper image is a placeholder', async () => {
      const provider = makeProvider();
      const scrapeFromHtml = jest
        .fn()
        .mockResolvedValue(
          successResult(scrapedPasta({ image: 'https://site.com/placeholder.jpg' }))
        );

      const result = await fetchRecipeImageUrl(
        provider,
        'https://site.com/r',
        signal,
        scrapeFromHtml
      );

      expect(result).toBeNull();
    });

    test('returns null when the scraper has no image', async () => {
      const provider = makeProvider();
      const scrapeFromHtml = jest
        .fn()
        .mockResolvedValue(successResult(scrapedPasta({ image: null })));

      const result = await fetchRecipeImageUrl(
        provider,
        'https://site.com/r',
        signal,
        scrapeFromHtml
      );

      expect(result).toBeNull();
    });

    test('returns null when the scrape fails', async () => {
      const provider = makeProvider();
      const scrapeFromHtml = jest.fn().mockResolvedValue(errorResult('boom'));

      const result = await fetchRecipeImageUrl(
        provider,
        'https://site.com/r',
        signal,
        scrapeFromHtml
      );

      expect(result).toBeNull();
    });

    test('returns null when fetching the html throws', async () => {
      mockFetchHtml.mockRejectedValue(new Error('offline'));
      const provider = makeProvider(() => 'https://site.com/from-provider.jpg');
      const scrapeFromHtml = jest.fn();

      const result = await fetchRecipeImageUrl(
        provider,
        'https://site.com/r',
        signal,
        scrapeFromHtml
      );

      expect(result).toBeNull();
    });
  });
});
