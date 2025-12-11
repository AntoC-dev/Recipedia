/**
 * Type definitions for recipe-scraper module.
 *
 * These types match the JSON structure returned by the embedded Python
 * recipe-scrapers library. The module returns raw data without transformation.
 */

/**
 * Nutritional information for a recipe.
 * Values are typically strings with units (e.g., "200 kcal", "15 g").
 */
export interface ScrapedNutrients {
    calories?: string;
    carbohydrateContent?: string;
    proteinContent?: string;
    fatContent?: string;
    fiberContent?: string;
    sodiumContent?: string;
    sugarContent?: string;
    saturatedFatContent?: string;
    cholesterolContent?: string;
    servingSize?: string;

    [key: string]: string | undefined;
}

/**
 * A group of ingredients with a common purpose (e.g., "For the sauce").
 */
export interface IngredientGroup {
    purpose: string | null;
    ingredients: string[];
}

/**
 * Structured ingredient data extracted from well-formatted HTML.
 * Only available for sites that have clear quantity/unit/name separation in their HTML.
 */
export interface ParsedIngredient {
    quantity: string;
    unit: string;
    name: string;
}

/**
 * A link found in the recipe page.
 */
export interface RecipeLink {
    href: string;
    text?: string;
}

/**
 * Complete recipe data as scraped from a recipe website.
 * Matches the output of the recipe-scrapers Python package.
 */
export interface ScrapedRecipe {
    // Core recipe data
    title: string | null;
    description: string | null;
    ingredients: string[];
    parsedIngredients: ParsedIngredient[] | null;
    ingredientGroups: IngredientGroup[] | null;
    instructions: string | null;
    instructionsList: string[] | null;

    // Timing (in minutes)
    totalTime: number | null;
    prepTime: number | null;
    cookTime: number | null;

    // Yield and servings
    yields: string | null;

    // Media
    image: string | null;

    // Metadata
    host: string | null;
    canonicalUrl: string | null;
    siteName: string | null;
    author: string | null;
    language: string | null;

    // Categorization
    category: string | null;
    cuisine: string | null;
    cookingMethod: string | null;
    keywords: string[] | null;
    dietaryRestrictions: string[] | null;

    // Ratings
    ratings: number | null;
    ratingsCount: number | null;

    // Additional data
    nutrients: ScrapedNutrients | null;
    equipment: string[] | null;
    links: RecipeLink[] | null;
}

/**
 * Error information returned on scraping failure.
 */
export interface ScraperError {
    type: string;
    message: string;
    host?: string;
}

/**
 * Known error types returned by the scraper.
 */
export const ScraperErrorTypes = {
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
} as const;

export type ScraperErrorType = (typeof ScraperErrorTypes)[keyof typeof ScraperErrorTypes] | string;

/**
 * Error result specifically for authentication-required pages.
 */
export interface AuthenticationRequiredError extends ScraperError {
    type: 'AuthenticationRequired';
    host: string;
}

/**
 * Credentials for authenticating to a recipe site.
 */
export interface SiteCredentials {
    host: string;
    username: string;
    password: string;
}

/**
 * Successful scrape result containing recipe data.
 */
export interface ScraperSuccessResult<T = ScrapedRecipe> {
    success: true;
    data: T;
}

/**
 * Failed scrape result containing error information.
 */
export interface ScraperErrorResult {
    success: false;
    error: ScraperError;
}

/**
 * Union type for scraper result (success or error).
 */
export type ScraperResult<T = ScrapedRecipe> =
    | ScraperSuccessResult<T>
    | ScraperErrorResult;

/**
 * Result type for getSupportedHosts.
 */
export type SupportedHostsResult = ScraperResult<string[]>;

/**
 * Result type for isHostSupported.
 */
export type HostSupportedResult = ScraperResult<boolean>;
