import { isScraperError, isScraperSuccess, ScraperResult } from '@utils/RecipeScraper';
import { createEmptyScrapedRecipe } from '@mocks/modules/recipe-scraper-mock';

jest.mock(
  '@app/modules/recipe-scraper',
  () => require('@mocks/modules/recipe-scraper-mock').recipeScraperMock
);

describe('RecipeScraper', () => {
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

  describe('isScraperError', () => {
    test('returns true for error result', () => {
      const result: ScraperResult = {
        success: false,
        error: { type: 'Error', message: 'Failed' },
      };

      expect(isScraperError(result)).toBe(true);
    });

    test('returns false for success result', () => {
      const result: ScraperResult = {
        success: true,
        data: createEmptyScrapedRecipe({ title: 'Test', host: 'example.com' }),
      };

      expect(isScraperError(result)).toBe(false);
    });

    test('type narrows to ScraperErrorResult', () => {
      const result: ScraperResult = {
        success: false,
        error: { type: 'Error', message: 'Failed' },
      };

      if (isScraperError(result)) {
        expect(result.error.message).toBe('Failed');
      }
    });
  });
});
