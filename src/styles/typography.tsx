/**
 * Typography System - Font loading and text processing utilities
 *
 * This module provides font loading and text processing utilities for the
 * Recipedia app. Includes custom Lora font family loading, regular expressions
 * for recipe text parsing, and shared text separators.
 *
 * Key Features:
 * - Custom Lora font family loading and configuration
 * - Text processing utilities and regular expressions
 * - Text separators for encoding recipe content
 *
 * @example
 * ```typescript
 * import { useFetchFonts, findAllNumbers } from '@styles/typography';
 *
 * // Loading fonts in app component
 * const [fontsLoaded] = useFetchFonts();
 * if (!fontsLoaded) return <LoadingScreen />;
 *
 * // Text processing
 * const numbers = ingredientText.match(findAllNumbers);
 * ```
 */

import { useFonts } from 'expo-font';

/** Text separator for parsing recipe text content */
export const textSeparator = '--';

/** Unity separator for combining text elements */
export const unitySeparator = '@@';

/** Encoding separator for text processing */
export const EncodingSeparator = '__';

/** Note separator for ingredient usage context in encoded recipes */
export const noteSeparator = '%%';

/** All calendar months as string values (1-12) */
export const ALL_MONTHS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;

/** All months pre-encoded for database storage */
export const ALL_MONTHS_ENCODED = ALL_MONTHS.join(EncodingSeparator);

/** Regular expression to replace all newline characters */
export const replaceAllBackToLine = /\n/g;

/** Regular expression to find all numbers in text */
export const findAllNumbers = /\b\d+\b/g;

/** Regular expression to match all non-digit characters */
export const allNonDigitCharacter = /\D/g;

/** Regular expression to check if text starts with a number */
export const numberAtFirstIndex = /^\d/;

/** Regular expression to match letters only */
export const letterRegExp = /[a-zA-z]/;

/** Regular expression to check if text starts with a letter */
export const startsWithLetter = /^[a-zA-Z]/;

/** Regular expression to check if text has letters in the middle (digit followed by letter followed by digit) */
export const hasLettersInMiddle = /\d[a-zA-Z].*\d/;

/** Regular expression to check if text ends with letters (units) */
export const endsWithLetters = /[a-zA-Z]+$/;

/** Regular expression to match only digits, dots, and whitespace */
export const onlyDigitsDotsSpaces = /^[\d.\s]+$/;

/**
 * Loads custom Lora font family for the application
 *
 * @returns [boolean, Error] - Font loading status and any error
 */
export function useFetchFonts() {
  return useFonts({
    'Lora-VariableFont_wght': require(`../assets/fonts/Lora/Lora-VariableFont_wght.ttf`),
    'Lora-Italic-VariableFont_wght': require(
      `../assets/fonts/Lora/Lora-Italic-VariableFont_wght.ttf`
    ),
  });
}
