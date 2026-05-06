import { isScraperSuccess, ScraperErrorTypes } from '@app/modules/recipe-scraper';
import type { ScraperResult } from '@app/modules/recipe-scraper';
import { createEmptyScrapedRecipe } from '@mocks/modules/recipe-scraper-mock';

jest.unmock('@app/modules/recipe-scraper');

describe('isScraperSuccess', () => {
  test('returns true for success result', () => {
    const result: ScraperResult = {
      success: true,
      data: createEmptyScrapedRecipe({ title: 'Test', host: 'example.com' }),
    };

    expect(isScraperSuccess(result)).toBe(true);
  });

  test('returns false for error result', () => {
    const result: ScraperResult = {
      success: false,
      error: { type: 'Error', message: 'Failed' },
    };

    expect(isScraperSuccess(result)).toBe(false);
  });

  test('type narrows to ScraperSuccessResult', () => {
    const result: ScraperResult = {
      success: true,
      data: createEmptyScrapedRecipe({ title: 'Test', host: 'example.com' }),
    };

    if (isScraperSuccess(result)) {
      expect(result.data.title).toBe('Test');
    }
  });
});

describe('ScraperErrorTypes', () => {
  test('has all expected error type values', () => {
    expect(ScraperErrorTypes.AuthenticationRequired).toBe('AuthenticationRequired');
    expect(ScraperErrorTypes.AuthenticationFailed).toBe('AuthenticationFailed');
    expect(ScraperErrorTypes.UnsupportedAuthSite).toBe('UnsupportedAuthSite');
    expect(ScraperErrorTypes.NoRecipeFoundError).toBe('NoRecipeFoundError');
    expect(ScraperErrorTypes.FetchError).toBe('FetchError');
    expect(ScraperErrorTypes.NoSchemaFoundInWildMode).toBe('NoSchemaFoundInWildMode');
    expect(ScraperErrorTypes.WebsiteNotImplementedError).toBe('WebsiteNotImplementedError');
    expect(ScraperErrorTypes.ConnectionError).toBe('ConnectionError');
    expect(ScraperErrorTypes.HTTPError).toBe('HTTPError');
    expect(ScraperErrorTypes.URLError).toBe('URLError');
    expect(ScraperErrorTypes.Timeout).toBe('timeout');
    expect(ScraperErrorTypes.UnsupportedPlatform).toBe('UnsupportedPlatform');
  });
});
