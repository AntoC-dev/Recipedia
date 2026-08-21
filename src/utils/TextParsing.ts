/**
 * TextParsing - Recipe text parsing vocabulary
 *
 * This module is the app's shared vocabulary for parsing and encoding recipe
 * text content: the separators used to encode ingredient/note data into flat
 * strings, and the regular expressions used to pull quantities, units, and
 * words back out of free-form recipe text (OCR output, pasted ingredient
 * lines, imported recipe data, etc.).
 *
 * @example
 * ```typescript
 * import { findAllNumbers, textSeparator } from '@utils/TextParsing';
 *
 * const numbers = ingredientText.match(findAllNumbers);
 * const [name, quantity] = encoded.split(textSeparator);
 * ```
 */

/** Text separator for parsing recipe text content */
export const textSeparator = '--';

/** Unity separator for combining text elements */
export const unitySeparator = '@@';

/** Encoding separator for text processing */
export const EncodingSeparator = '__';

/** Note separator for ingredient usage context in encoded recipes */
export const noteSeparator = '%%';

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
