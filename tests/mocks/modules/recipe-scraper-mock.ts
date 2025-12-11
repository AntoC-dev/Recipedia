import { ScrapedRecipe, ScraperResult } from '@app/modules/recipe-scraper';
import { hellofreshKeftasRecipe } from '@test-data/scraperMocks/hellofresh';

export const mockScrapeRecipe = jest.fn<Promise<ScraperResult<ScrapedRecipe>>, [string]>();
export const mockScrapeRecipeAuthenticated = jest.fn<
  Promise<ScraperResult<ScrapedRecipe>>,
  [string, string, string]
>();
export const mockGetSupportedHosts = jest.fn<Promise<ScraperResult<string[]>>, []>();
export const mockIsHostSupported = jest.fn<Promise<ScraperResult<boolean>>, [string]>();

export const recipeScraperMock = {
  RecipeScraper: jest.fn(),
  recipeScraper: {
    scrapeRecipe: mockScrapeRecipe,
    scrapeRecipeAuthenticated: mockScrapeRecipeAuthenticated,
    getSupportedHosts: mockGetSupportedHosts,
    isHostSupported: mockIsHostSupported,
  },
  ScraperErrorTypes: {
    AuthenticationRequired: 'AuthenticationRequired',
    AuthenticationFailed: 'AuthenticationFailed',
    UnsupportedAuthSite: 'UnsupportedAuthSite',
    NoRecipeFoundError: 'NoRecipeFoundError',
    FetchError: 'FetchError',
    NoSchemaFoundInWildMode: 'NoSchemaFoundInWildMode',
    WebsiteNotImplementedError: 'WebsiteNotImplementedError',
    ConnectionError: 'ConnectionError',
    HTTPError: 'HTTPError',
    URLError: 'URLError',
    Timeout: 'timeout',
    UnsupportedPlatform: 'UnsupportedPlatform',
  },
};

export function mockScrapeRecipeSuccess(data: ScrapedRecipe = hellofreshKeftasRecipe) {
  mockScrapeRecipe.mockResolvedValue({
    success: true,
    data,
  });
}

export function mockScrapeRecipeError(message: string, type = 'Error', host?: string) {
  mockScrapeRecipe.mockResolvedValue({
    success: false,
    error: { type, message, host },
  });
}

export function mockScrapeRecipeAuthenticatedSuccess(data: ScrapedRecipe = hellofreshKeftasRecipe) {
  mockScrapeRecipeAuthenticated.mockResolvedValue({
    success: true,
    data,
  });
}

export function mockScrapeRecipeAuthenticatedError(message: string, type = 'Error') {
  mockScrapeRecipeAuthenticated.mockResolvedValue({
    success: false,
    error: { type, message },
  });
}

export function createEmptyScrapedRecipe(overrides: Partial<ScrapedRecipe> = {}): ScrapedRecipe {
  return {
    title: null,
    description: null,
    ingredients: [],
    parsedIngredients: null,
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
