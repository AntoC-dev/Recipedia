/**
 * RecipeScraperConverter - Pure functions for converting scraped recipe data
 *
 * These functions are extracted from useRecipeScraper to enable direct testing
 * without requiring hook mocking.
 */

import { numericQuantity } from 'numeric-quantity';
import { decode } from 'html-entities';
import {
  extractFirstInteger,
  extractNumericValue,
  isAllDigits,
  kcalToKj,
  namesMatch,
} from '@utils/NutritionUtils';
import { cleanIngredientName } from '@utils/FuzzySearch';
import {
  FormIngredientElement,
  nutritionTableElement,
  preparationStepElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import {
  ParsedIngredient as ScrapedParsedIngredient,
  ParsedInstruction,
  ScrapedNutrients,
  ScrapedRecipe,
} from '@utils/RecipeScraper';

const DEFAULT_PORTION_WEIGHT_GRAMS = 100;
const SODIUM_MG_THRESHOLD = 10;
const MG_PER_GRAM = 1000;

/**
 * Retrieves ignored ingredient patterns from i18n translations.
 *
 * @param t - i18n translation function
 * @returns Patterns for ingredients to skip during parsing
 */
export function getIgnoredPatterns(
  t: (key: string, options?: { returnObjects: boolean }) => unknown
): IgnoredIngredientPatterns {
  const prefixes = t('recipe.scraper.ignoredIngredientPrefixes', { returnObjects: true });
  const exactMatches = t('recipe.scraper.ignoredIngredientExactMatches', { returnObjects: true });

  return {
    prefixes: Array.isArray(prefixes)
      ? prefixes.filter((p): p is string => typeof p === 'string')
      : [],
    exactMatches: Array.isArray(exactMatches)
      ? exactMatches.filter((e): e is string => typeof e === 'string')
      : [],
  };
}

function stripHtml(text: string): string {
  return decode(text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

export type ParsedIngredient =
  | { success: true; ingredient: FormIngredientElement }
  | { success: false; original: string };

export type ConvertedIngredients = {
  ingredients: FormIngredientElement[];
  skipped: string[];
};

export type ScrapedRecipeResult = Omit<
  Partial<import('@customTypes/DatabaseElementTypes').recipeTableElement>,
  'ingredients' | 'nutrition'
> & {
  ingredients: FormIngredientElement[];
  skippedIngredients?: string[];
  nutrition?: nutritionTableElement;
};

export type IgnoredIngredientPatterns = {
  prefixes: string[];
  exactMatches: string[];
};

export function isUnparseableIngredient(
  ingredient: string,
  patterns: IgnoredIngredientPatterns
): boolean {
  const lower = ingredient.toLowerCase().trim();

  if (patterns.exactMatches.some(exact => lower === exact.toLowerCase())) {
    return true;
  }

  return patterns.prefixes.some(prefix => lower.startsWith(prefix.toLowerCase()));
}

const DEFAULT_PATTERNS: IgnoredIngredientPatterns = { prefixes: [], exactMatches: [] };

/**
 * Parses a raw ingredient string into structured data.
 *
 * Extracts quantity, unit, and name from strings like "2 cups flour".
 * Cleans ingredient names by removing parenthetical content (e.g., "cheddar (sous vide)" → "cheddar").
 *
 * @param ingredientStr - Raw ingredient string from scraper
 * @param patterns - Patterns for ingredients to skip
 * @returns Parsed ingredient or failure with original string
 */
export function parseIngredientString(
  ingredientStr: string,
  patterns: IgnoredIngredientPatterns = DEFAULT_PATTERNS
): ParsedIngredient {
  const trimmed = ingredientStr.trim();

  if (isUnparseableIngredient(trimmed, patterns)) {
    return { success: false, original: trimmed };
  }

  const words = trimmed.split(/\s+/);
  if (words.length < 2) {
    return {
      success: true,
      ingredient: { name: cleanIngredientName(trimmed), quantity: '', unit: '' },
    };
  }

  const firstWord = words[0];
  const secondWord = words[1];
  const isFraction = secondWord.includes('/');

  const candidateQuantity = isFraction ? `${firstWord} ${secondWord}` : firstWord;
  const parsedQuantity = numericQuantity(candidateQuantity);

  if (isNaN(parsedQuantity)) {
    return {
      success: true,
      ingredient: { name: cleanIngredientName(trimmed), quantity: '', unit: '' },
    };
  }

  const quantity = parsedQuantity.toString();
  const remainingWords = isFraction ? words.slice(2) : words.slice(1);

  if (remainingWords.length === 0) {
    return { success: true, ingredient: { name: '', quantity, unit: '' } };
  }

  if (remainingWords.length === 1) {
    return {
      success: true,
      ingredient: { name: cleanIngredientName(remainingWords[0]), quantity, unit: '' },
    };
  }

  const unit = remainingWords[0];
  const name = cleanIngredientName(remainingWords.slice(1).join(' '));
  return { success: true, ingredient: { name, quantity, unit } };
}

export function convertIngredients(
  rawIngredients: string[],
  parsedIngredients: ScrapedParsedIngredient[] | null | undefined,
  patterns: IgnoredIngredientPatterns = DEFAULT_PATTERNS
): ConvertedIngredients {
  // Use pre-parsed ingredients if available (from well-structured HTML)
  if (parsedIngredients && parsedIngredients.length > 0) {
    const ingredients: FormIngredientElement[] = [];
    const skipped: string[] = [];

    for (const p of parsedIngredients) {
      if (isUnparseableIngredient(p.name, patterns)) {
        skipped.push(p.name);
      } else {
        ingredients.push({
          quantity: p.quantity,
          unit: p.unit,
          name: cleanIngredientName(p.name),
        });
      }
    }

    return { ingredients, skipped };
  }

  // Fall back to string parsing
  const ingredients: FormIngredientElement[] = [];
  const skipped: string[] = [];

  for (const raw of rawIngredients) {
    const result = parseIngredientString(raw, patterns);
    if (result.success) {
      ingredients.push(result.ingredient);
    } else {
      skipped.push(result.original);
    }
  }

  return { ingredients, skipped };
}

export function parseServings(yields: string | undefined, defaultPersons: number): number {
  if (!yields) return defaultPersons;
  return extractFirstInteger(yields) ?? defaultPersons;
}

export function convertTags(keywords: string[], dietaryRestrictions: string[]): tagTableElement[] {
  const tags: tagTableElement[] = [];

  const addTagIfNotDuplicate = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !tags.some(tag => namesMatch(tag.name, trimmed))) {
      tags.push({ name: trimmed });
    }
  };

  keywords.filter(Boolean).forEach(addTagIfNotDuplicate);
  dietaryRestrictions.filter(Boolean).forEach(addTagIfNotDuplicate);

  return tags;
}

export function removeNumberedPrefix(text: string): string {
  const trimmed = text.trim();
  const dotIndex = trimmed.indexOf('.');
  if (dotIndex > 0 && dotIndex <= 3) {
    const beforeDot = trimmed.slice(0, dotIndex);
    if (isAllDigits(beforeDot)) {
      return trimmed.slice(dotIndex + 1).trim();
    }
  }
  return trimmed;
}

export function convertPreparation(
  instructions: string,
  instructionsList: string[] | undefined | null,
  parsedInstructions: ParsedInstruction[] | undefined | null
): preparationStepElement[] {
  if (parsedInstructions && parsedInstructions.length > 0) {
    return parsedInstructions.map(group => ({
      title: group.title ? stripHtml(group.title) : '',
      description: group.instructions.map(i => stripHtml(i.trim())).join('\n'),
    }));
  }

  if (instructionsList && instructionsList.length > 0) {
    return instructionsList.map(step => ({
      title: '',
      description: stripHtml(step.trim()),
    }));
  }

  const steps = instructions
    .split('\n')
    .map(s => stripHtml(removeNumberedPrefix(s)))
    .filter(step => step.length > 0);

  return steps.map(step => ({
    title: '',
    description: step,
  }));
}

/**
 * Converts scraped nutrition data to app format.
 *
 * Only converts when servingSize is explicitly provided by the scraper.
 * Without servingSize, we cannot reliably determine if values are per-100g or per-serving,
 * so we skip nutrition entirely to avoid storing incorrect data.
 */
export function convertNutrition(nutrients: ScrapedNutrients): nutritionTableElement | undefined {
  const kcalValue = extractNumericValue(nutrients.calories);
  if (kcalValue === 0) return undefined;

  const explicitServingSize = extractNumericValue(nutrients.servingSize);
  const rawSodium = extractNumericValue(nutrients.sodiumContent);
  const sodiumInGrams = rawSodium > SODIUM_MG_THRESHOLD ? rawSodium / MG_PER_GRAM : rawSodium;

  // Site provides explicit serving size - convert to per-100g
  if (explicitServingSize > 0) {
    const toPer100g = (perServingValue: number): number => {
      return (
        Math.round((perServingValue / explicitServingSize) * DEFAULT_PORTION_WEIGHT_GRAMS * 10) / 10
      );
    };

    const energyKcal = toPer100g(kcalValue);
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
      portionWeight: explicitServingSize,
    };
  }

  // No serving size = can't convert reliably, skip nutrition
  return undefined;
}

export function cleanImageUrl(url: string): string {
  if (!url) return url;

  if (url.includes('assets.afcdn.com')) {
    return url.replace(/_w\d+h\d+[^.]*\./, '.');
  }

  return url;
}

export function convertScrapedRecipe(
  scraped: ScrapedRecipe,
  ignoredPatterns: IgnoredIngredientPatterns,
  defaultPersons: number
): ScrapedRecipeResult {
  const { ingredients, skipped } = convertIngredients(
    scraped.ingredients,
    scraped.parsedIngredients,
    ignoredPatterns
  );

  return {
    title: scraped.title ?? '',
    description: scraped.description ?? '',
    image_Source: cleanImageUrl(scraped.image ?? ''),
    persons: parseServings(scraped.yields ?? undefined, defaultPersons),
    time: scraped.totalTime ?? scraped.prepTime ?? 0,
    ingredients,
    skippedIngredients: skipped.length > 0 ? skipped : undefined,
    preparation: convertPreparation(
      scraped.instructions ?? '',
      scraped.instructionsList ?? undefined,
      scraped.parsedInstructions ?? undefined
    ),
    nutrition: scraped.nutrients ? convertNutrition(scraped.nutrients) : undefined,
    tags: convertTags(scraped.keywords ?? [], scraped.dietaryRestrictions ?? []),
    season: [],
  };
}
