/**
 * RecipeScraperConverter - Pure functions for converting scraped recipe data
 *
 * These functions are extracted from useRecipeScraper to enable direct testing
 * without requiring hook mocking.
 */

import { numericQuantity } from 'numeric-quantity';
import {
  extractFirstInteger,
  extractNumericValue,
  isAllDigits,
  kcalToKj,
  namesMatch,
} from '@utils/NutritionUtils';
import {
  FormIngredientElement,
  nutritionTableElement,
  preparationStepElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { ScrapedNutrients, ScrapedRecipe } from '@utils/RecipeScraper';

const DEFAULT_PORTION_WEIGHT_GRAMS = 100;
const SODIUM_MG_THRESHOLD = 10;
const MG_PER_GRAM = 1000;

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

export function isUnparseableIngredient(ingredient: string, ignoredPrefixes: string[]): boolean {
  const lower = ingredient.toLowerCase().trim();
  return ignoredPrefixes.some(prefix => lower.startsWith(prefix.toLowerCase()));
}

export function parseIngredientString(
  ingredientStr: string,
  ignoredPrefixes: string[] = []
): ParsedIngredient {
  const trimmed = ingredientStr.trim();

  if (isUnparseableIngredient(trimmed, ignoredPrefixes)) {
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
}

export function convertIngredients(
  rawIngredients: string[],
  ignoredPrefixes: string[] = []
): ConvertedIngredients {
  const ingredients: FormIngredientElement[] = [];
  const skipped: string[] = [];

  for (const raw of rawIngredients) {
    const result = parseIngredientString(raw, ignoredPrefixes);
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

export function convertTags(scraped: ScrapedRecipe): tagTableElement[] {
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
  getStepTitle: (index: number) => string
): preparationStepElement[] {
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
}

export function convertNutrition(nutrients: ScrapedNutrients): nutritionTableElement | undefined {
  const kcalPerServing = extractNumericValue(nutrients.calories);
  if (kcalPerServing === 0) return undefined;

  const portionWeight = extractNumericValue(nutrients.servingSize) || DEFAULT_PORTION_WEIGHT_GRAMS;
  const rawSodium = extractNumericValue(nutrients.sodiumContent);
  const sodiumInGrams = rawSodium > SODIUM_MG_THRESHOLD ? rawSodium / MG_PER_GRAM : rawSodium;

  const toPer100g = (perServingValue: number): number => {
    if (portionWeight !== DEFAULT_PORTION_WEIGHT_GRAMS) {
      return Math.round((perServingValue / portionWeight) * DEFAULT_PORTION_WEIGHT_GRAMS * 10) / 10;
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
}

export function convertScrapedRecipe(
  scraped: ScrapedRecipe,
  ignoredPrefixes: string[],
  defaultPersons: number,
  getStepTitle: (index: number) => string
): ScrapedRecipeResult {
  const { ingredients, skipped } = convertIngredients(scraped.ingredients, ignoredPrefixes);

  return {
    title: scraped.title ?? '',
    description: scraped.description ?? '',
    image_Source: scraped.image ?? '',
    persons: parseServings(scraped.yields ?? undefined, defaultPersons),
    time: scraped.prepTime ?? scraped.totalTime ?? 0,
    ingredients,
    skippedIngredients: skipped.length > 0 ? skipped : undefined,
    preparation: convertPreparation(
      scraped.instructions ?? '',
      scraped.instructionsList ?? undefined,
      getStepTitle
    ),
    nutrition: scraped.nutrients ? convertNutrition(scraped.nutrients) : undefined,
    tags: convertTags(scraped),
    season: [],
  };
}
