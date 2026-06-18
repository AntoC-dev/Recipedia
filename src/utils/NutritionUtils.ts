/**
 * Utility functions for nutrition calculations and string parsing.
 *
 * @module NutritionUtils
 */

import { nutritionTableElement } from '@customTypes/DatabaseElementTypes';
import { defaultValueNumber } from '@utils/Constants';

const KCAL_TO_KJ_FACTOR = 4.184;

/**
 * Builds a fresh nutrition object with every numeric field set to the
 * "not set" sentinel (`defaultValueNumber`). Single source of the ten-field
 * shape so seeders (OCR extraction, manual table first-edit) don't each
 * transcribe the key set.
 *
 * @returns A nutrition object with all values unset
 */
export function emptyNutrition(): nutritionTableElement {
  return {
    energyKcal: defaultValueNumber,
    energyKj: defaultValueNumber,
    fat: defaultValueNumber,
    saturatedFat: defaultValueNumber,
    carbohydrates: defaultValueNumber,
    sugars: defaultValueNumber,
    fiber: defaultValueNumber,
    protein: defaultValueNumber,
    salt: defaultValueNumber,
    portionWeight: defaultValueNumber,
  };
}

/**
 * Normalizes a string key for consistent comparison.
 *
 * Applies lowercase, trim, Unicode NFC normalization, and whitespace collapsing
 * to ensure consistent string matching regardless of input variations.
 *
 * @param name - The name to normalize
 * @returns Lowercase, trimmed, NFC-normalized string with collapsed whitespace
 */
export function normalizeKey(name: string): string {
  return name.toLowerCase().trim().normalize('NFC').replace(/\s+/g, ' ');
}

/**
 * Extracts digits from a string, optionally including decimal point.
 * Stops at the first non-digit character after finding digits.
 */
function extractDigits(value: string, allowDecimal: boolean): string {
  let numStr = '';
  let foundDigit = false;

  for (const char of value) {
    if (char >= '0' && char <= '9') {
      numStr += char;
      foundDigit = true;
    } else if (allowDecimal && char === '.' && foundDigit) {
      numStr += char;
    } else if (foundDigit) {
      break;
    }
  }

  return numStr;
}

/**
 * Converts kilocalories to kilojoules.
 *
 * @param kcal - Energy value in kilocalories
 * @returns Energy value in kilojoules, rounded to 1 decimal place
 */
export function kcalToKj(kcal: number): number {
  return Math.round(kcal * KCAL_TO_KJ_FACTOR * 10) / 10;
}

/**
 * Extracts the first numeric value from a nutrition string.
 * Handles formats like "200 kcal", "15g", "2.5 mg", etc.
 *
 * @param value - Nutrition string potentially containing a number
 * @returns The extracted number, or 0 if no number found
 */
export function extractNumericValue(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const numStr = extractDigits(value, true);
  return numStr ? parseFloat(numStr) : 0;
}

/**
 * Extracts the first integer from a string.
 * Useful for parsing servings like "4 portions" or "Serves 6".
 *
 * @param value - String potentially containing a number
 * @returns The extracted integer, or undefined if no number found
 */
export function extractFirstInteger(value: string): number | undefined {
  const numStr = extractDigits(value, false);
  return numStr ? parseInt(numStr, 10) : undefined;
}

/**
 * Checks if a string contains only digit characters.
 *
 * @param str - String to check
 * @returns true if string is non-empty and contains only digits 0-9
 */
export function isAllDigits(str: string): boolean {
  if (str.length === 0) return false;
  for (const char of str) {
    if (char < '0' || char > '9') return false;
  }
  return true;
}

/**
 * Compares two strings using normalized comparison.
 * Useful for matching ingredient/tag names with Unicode normalization.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if both strings are defined and match after normalization
 */
export function namesMatch(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  return normalizeKey(a) === normalizeKey(b);
}

/**
 * Removes parenthetical qualifiers from an ingredient name.
 *
 * @param name - Raw ingredient name (may contain qualifiers)
 * @returns Name with all `(...)` segments stripped and trimmed
 *
 * @example
 * cleanIngredientName('Tomatoes (canned)') // 'Tomatoes'
 * cleanIngredientName('Chicken (boneless) (skinless)') // 'Chicken'
 */
export function cleanIngredientName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}
