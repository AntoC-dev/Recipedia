/**
 * useRecipeScraper - Hook for scraping recipes from URLs
 *
 * Encapsulates the scraping logic including:
 * - URL validation
 * - Calling the recipe scraper module
 * - Converting scraped data to app format
 * - Downloading recipe images
 * - Error handling
 *
 * @example
 * ```typescript
 * const { scrapeAndPrepare, isLoading, error, clearError } = useRecipeScraper();
 *
 * const handleImport = async (url: string) => {
 *   const result = await scrapeAndPrepare(url);
 *   if (result.success) {
 *     navigation.navigate('Recipe', {
 *       mode: 'addFromScrape',
 *       scrapedData: result.data,
 *       sourceUrl: url,
 *     });
 *   }
 * };
 * ```
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { numericQuantity } from 'numeric-quantity';
import {
  isScraperSuccess,
  recipeScraper,
  ScrapedNutrients,
  ScrapedRecipe,
} from '@utils/RecipeScraper';
import { downloadImageToCache } from '@utils/FileGestion';
import { uiLogger } from '@utils/logger';
import {
  extractFirstInteger,
  extractNumericValue,
  isAllDigits,
  kcalToKj,
  namesMatch,
} from '@utils/NutritionUtils';
import { useDefaultPersons } from '@context/DefaultPersonsContext';
import {
  FormIngredientElement,
  nutritionTableElement,
  preparationStepElement,
  recipeTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';

const DEFAULT_PORTION_WEIGHT_GRAMS = 100;
const SODIUM_MG_THRESHOLD = 10;
const MG_PER_GRAM = 1000;

/**
 * Return type for scraped recipe conversion.
 */
export type ScrapedRecipeResult = Omit<Partial<recipeTableElement>, 'ingredients' | 'nutrition'> & {
  ingredients: FormIngredientElement[];
  skippedIngredients?: string[];
  nutrition?: nutritionTableElement;
};

/**
 * Result type for scrapeAndPrepare function.
 */
export type ScrapeResult =
  | { success: true; data: ScrapedRecipeResult; sourceUrl: string }
  | { success: false; error: string };

/**
 * Return type for useRecipeScraper hook.
 */
export interface UseRecipeScraperReturn {
  scrapeAndPrepare: (url: string) => Promise<ScrapeResult>;
  isLoading: boolean;
  error: string | undefined;
  clearError: () => void;
}

type ParsedIngredient =
  | { success: true; ingredient: FormIngredientElement }
  | { success: false; original: string };

/**
 * Hook for scraping recipes from URLs.
 */
export function useRecipeScraper(): UseRecipeScraperReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { defaultPersons } = useDefaultPersons();
  const { t } = useTranslation();

  const getIgnoredPrefixes = (): string[] => {
    const prefixes = t('recipe.scraper.ignoredIngredientPrefixes', { returnObjects: true });
    if (!Array.isArray(prefixes)) {
      return [];
    }
    return prefixes.filter((p): p is string => typeof p === 'string');
  };

  const isUnparseableIngredient = (ingredient: string): boolean => {
    const ignoredPrefixes = getIgnoredPrefixes();
    const lower = ingredient.toLowerCase().trim();
    return ignoredPrefixes.some(prefix => lower.startsWith(prefix.toLowerCase()));
  };

  const parseIngredientString = (ingredientStr: string): ParsedIngredient => {
    const trimmed = ingredientStr.trim();

    if (isUnparseableIngredient(trimmed)) {
      return { success: false, original: trimmed };
    }

    const words = trimmed.split(/\s+/);
    if (words.length < 2) {
      return { success: true, ingredient: { name: trimmed, quantity: '', unit: '' } };
    }

    const firstWord = words[0];
    const secondWord = words[1];
    const isFraction = secondWord.includes('/');

    const candidateQuantity = isFraction ? `${firstWord} ${secondWord}` : firstWord;
    const parsedQuantity = numericQuantity(candidateQuantity);

    if (isNaN(parsedQuantity)) {
      return { success: true, ingredient: { name: trimmed, quantity: '', unit: '' } };
    }

    const quantity = parsedQuantity.toString();
    const remainingWords = isFraction ? words.slice(2) : words.slice(1);

    if (remainingWords.length === 0) {
      return { success: true, ingredient: { name: '', quantity, unit: '' } };
    }

    if (remainingWords.length === 1) {
      return { success: true, ingredient: { name: remainingWords[0], quantity, unit: '' } };
    }

    const unit = remainingWords[0];
    const name = remainingWords.slice(1).join(' ');
    return { success: true, ingredient: { name, quantity, unit } };
  };

  const convertIngredients = (
    rawIngredients: string[]
  ): { ingredients: FormIngredientElement[]; skipped: string[] } => {
    const ingredients: FormIngredientElement[] = [];
    const skipped: string[] = [];

    for (const raw of rawIngredients) {
      const result = parseIngredientString(raw);
      if (result.success) {
        ingredients.push(result.ingredient);
      } else {
        skipped.push(result.original);
      }
    }

    return { ingredients, skipped };
  };

  const parseServings = (yields: string | undefined): number => {
    if (!yields) return defaultPersons;
    return extractFirstInteger(yields) ?? defaultPersons;
  };

  const convertTags = (scraped: ScrapedRecipe): tagTableElement[] => {
    const tags: tagTableElement[] = [];

    const addTagIfNotDuplicate = (name: string) => {
      const trimmed = name.trim();
      if (trimmed && !tags.some(tag => namesMatch(tag.name, trimmed))) {
        tags.push({ name: trimmed });
      }
    };

    const keywords = (scraped.keywords ?? [])
      .filter(Boolean)
      .flatMap(k => (k.includes(',') ? k.split(',') : [k]));
    keywords.forEach(addTagIfNotDuplicate);

    const restrictions = (scraped.dietaryRestrictions ?? []).filter(Boolean);
    restrictions.forEach(addTagIfNotDuplicate);

    return tags;
  };

  const removeNumberedPrefix = (text: string): string => {
    const trimmed = text.trim();
    const dotIndex = trimmed.indexOf('.');
    if (dotIndex > 0 && dotIndex <= 3) {
      const beforeDot = trimmed.slice(0, dotIndex);
      if (isAllDigits(beforeDot)) {
        return trimmed.slice(dotIndex + 1).trim();
      }
    }
    return trimmed;
  };

  const convertPreparation = (
    instructions: string,
    instructionsList?: string[]
  ): preparationStepElement[] => {
    const getStepTitle = (index: number) => t('recipe.scraper.stepTitle', { number: index + 1 });

    if (instructionsList && instructionsList.length > 0) {
      return instructionsList.map((step, index) => ({
        title: getStepTitle(index),
        description: step.trim(),
      }));
    }

    const steps = instructions
      .split('\n')
      .map(removeNumberedPrefix)
      .filter(step => step.length > 0);

    return steps.map((step, index) => ({
      title: getStepTitle(index),
      description: step,
    }));
  };

  const convertNutrition = (nutrients: ScrapedNutrients): nutritionTableElement | undefined => {
    const kcalPerServing = extractNumericValue(nutrients.calories);
    if (kcalPerServing === 0) return undefined;

    const portionWeight =
      extractNumericValue(nutrients.servingSize) || DEFAULT_PORTION_WEIGHT_GRAMS;
    const rawSodium = extractNumericValue(nutrients.sodiumContent);
    const sodiumInGrams = rawSodium > SODIUM_MG_THRESHOLD ? rawSodium / MG_PER_GRAM : rawSodium;

    const toPer100g = (perServingValue: number): number => {
      if (portionWeight !== DEFAULT_PORTION_WEIGHT_GRAMS) {
        return (
          Math.round((perServingValue / portionWeight) * DEFAULT_PORTION_WEIGHT_GRAMS * 10) / 10
        );
      }
      return perServingValue;
    };

    const energyKcal = toPer100g(kcalPerServing);

    return {
      energyKcal,
      energyKj: kcalToKj(energyKcal),
      fat: toPer100g(extractNumericValue(nutrients.fatContent)),
      saturatedFat: toPer100g(extractNumericValue(nutrients.saturatedFatContent)),
      carbohydrates: toPer100g(extractNumericValue(nutrients.carbohydrateContent)),
      sugars: toPer100g(extractNumericValue(nutrients.sugarContent)),
      fiber: toPer100g(extractNumericValue(nutrients.fiberContent)),
      protein: toPer100g(extractNumericValue(nutrients.proteinContent)),
      salt: toPer100g(sodiumInGrams),
      portionWeight,
    };
  };

  const convertScrapedRecipe = (scraped: ScrapedRecipe): ScrapedRecipeResult => {
    const { ingredients, skipped } = convertIngredients(scraped.ingredients);

    return {
      title: scraped.title ?? '',
      description: scraped.description ?? '',
      image_Source: scraped.image ?? '',
      persons: parseServings(scraped.yields ?? undefined),
      time: scraped.prepTime ?? scraped.totalTime ?? 0,
      ingredients,
      skippedIngredients: skipped.length > 0 ? skipped : undefined,
      preparation: convertPreparation(
        scraped.instructions ?? '',
        scraped.instructionsList ?? undefined
      ),
      nutrition: scraped.nutrients ? convertNutrition(scraped.nutrients) : undefined,
      tags: convertTags(scraped),
      season: [],
    };
  };

  const clearError = () => setError(undefined);

  const scrapeAndPrepare = async (url: string): Promise<ScrapeResult> => {
    setIsLoading(true);
    setError(undefined);

    uiLogger.info('Starting recipe scrape', { url });

    try {
      const scraperResult = await recipeScraper.scrapeRecipe(url);

      if (!isScraperSuccess(scraperResult)) {
        const errorMessage = scraperResult.error.message || 'urlDialog.errorScraping';
        uiLogger.warn('Scraping failed', { url, error: scraperResult.error });
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, error: errorMessage };
      }

      uiLogger.info('Scraping successful', {
        url,
        title: scraperResult.data.title,
        ingredientCount: scraperResult.data.ingredients.length,
        ingredients: scraperResult.data.ingredients,
        category: scraperResult.data.category,
        cuisine: scraperResult.data.cuisine,
        keywords: scraperResult.data.keywords,
        dietaryRestrictions: scraperResult.data.dietaryRestrictions,
        totalTime: scraperResult.data.totalTime,
        prepTime: scraperResult.data.prepTime,
        cookTime: scraperResult.data.cookTime,
      });

      const recipeData = convertScrapedRecipe(scraperResult.data);

      if (recipeData.skippedIngredients?.length) {
        uiLogger.warn('Some ingredients could not be parsed', {
          skipped: recipeData.skippedIngredients,
        });
      }

      if (scraperResult.data.image) {
        uiLogger.info('Downloading recipe image', { imageUrl: scraperResult.data.image });
        const localImageUri = await downloadImageToCache(scraperResult.data.image);
        if (localImageUri) {
          recipeData.image_Source = localImageUri;
        }
      }

      setIsLoading(false);
      return { success: true, data: recipeData, sourceUrl: url };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'urlDialog.errorNetwork';
      uiLogger.error('Unexpected error during scraping', { url, error: err });
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  return {
    scrapeAndPrepare,
    isLoading,
    error,
    clearError,
  };
}
