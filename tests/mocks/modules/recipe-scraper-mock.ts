import { ScrapedRecipe, ScraperResult } from '@app/modules/recipe-scraper';
import { hellofreshKeftasRecipe } from '@test-data/scraperMocks/hellofresh';

export const mockScrapeRecipe = jest.fn<Promise<ScraperResult<ScrapedRecipe>>, [string]>();
export const mockGetSupportedHosts = jest.fn<Promise<ScraperResult<string[]>>, []>();
export const mockIsHostSupported = jest.fn<Promise<ScraperResult<boolean>>, [string]>();

export const recipeScraperMock = {
  RecipeScraper: jest.fn(),
  recipeScraper: {
    scrapeRecipe: mockScrapeRecipe,
    getSupportedHosts: mockGetSupportedHosts,
    isHostSupported: mockIsHostSupported,
  },
};

export function mockScrapeRecipeSuccess(data: ScrapedRecipe = hellofreshKeftasRecipe) {
  mockScrapeRecipe.mockResolvedValue({
    success: true,
    data,
  });
}

export function mockScrapeRecipeError(message: string, type = 'Error') {
  mockScrapeRecipe.mockResolvedValue({
    success: false,
    error: { type, message },
  });
}

export function createEmptyScrapedRecipe(overrides: Partial<ScrapedRecipe> = {}): ScrapedRecipe {
  return {
    title: null,
    description: null,
    ingredients: [],
    ingredientGroups: null,
    instructions: null,
    instructionsList: null,
    totalTime: null,
    prepTime: null,
    cookTime: null,
    yields: null,
    image: null,
    host: null,
    canonicalUrl: null,
    siteName: null,
    author: null,
    language: null,
    category: null,
    cuisine: null,
    cookingMethod: null,
    keywords: null,
    dietaryRestrictions: null,
    ratings: null,
    ratingsCount: null,
    nutrients: null,
    equipment: null,
    links: null,
    ...overrides,
  };
}
