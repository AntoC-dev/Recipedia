/**
 * OCR (Optical Character Recognition) - Advanced text extraction from recipe images
 *
 * This module provides sophisticated OCR capabilities specifically designed for recipe recognition.
 * It uses ML Kit text recognition to extract and parse various recipe components from images,
 * including ingredients with quantities, preparation steps, cooking times, and serving sizes.
 *
 * Key Features:
 * - Structured ingredient parsing with automatic quantity scaling
 * - Multi-person serving detection and conversion
 * - Step-by-step preparation instruction extraction
 * - Smart text parsing with error correction
 * - Support for various recipe formats and layouts
 *
 * @example
 * ```typescript
 * // Extract recipe title from image
 * const title = await recognizeText(imageUri, recipeColumnsNames.title);
 *
 * // Extract structured ingredients
 * const ingredients = await recognizeText(imageUri, recipeColumnsNames.ingredients);
 *
 * // Extract complete field data
 * const result = await extractFieldFromImage(uri, recipeColumnsNames.ingredients, currentState);
 * ```
 */

import {
  FormIngredientElement,
  preparationStepElement,
  recipeColumnsNames,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import {
  FUSE_THRESHOLD,
  nutritionObject,
  NutritionTerms,
  OcrKeys,
  per100gKey,
  perPortionKey,
} from '@customTypes/OCRTypes';
import {
  allNonDigitCharacter,
  endsWithLetters,
  findAllNumbers,
  hasLettersInMiddle,
  letterRegExp,
  numberAtFirstIndex as numberAtFirstIndex,
  onlyDigitsDotsSpaces,
  replaceAllBackToLine,
  startsWithLetter,
} from '@styles/typography';

import TextRecognition, {
  TextBlock,
  TextRecognitionResult,
} from '@react-native-ml-kit/text-recognition';
import { scaleQuantityForPersons } from '@utils/Quantity';
import { isArrayOfNumber, isArrayOfType, isNumber, isString } from '@utils/TypeCheckingFunctions';
import { defaultValueNumber } from '@utils/Constants';
import { ocrLogger } from '@utils/logger';
import i18n from '@utils/i18n';
import Fuse from 'fuse.js';

/**
 * Constants for ingredient parsing heuristics
 *
 * These values are tuned based on observed OCR behavior differences between iOS and Android.
 * iOS's ML Kit tends to return blocks in different orders than Android.
 */
const INGREDIENT_PARSING = {
  /**
   * If the first person marker (e.g., "2p") appears within this many lines from the start,
   * it likely indicates iOS reversed block order (quantities before ingredient names).
   * Android typically has all ingredient names before any person markers.
   */
  REVERSED_ORDER_THRESHOLD: 3,

  /** Pattern to match person markers like "2p", "3 p", "4P", "2 pers." */
  PERSON_MARKER_PATTERN: /\d+\s*p\s*$/i,

  /** Pattern to match ingredient with unit in parentheses like "flour (g)" */
  INGREDIENT_WITH_UNIT_PATTERN: /\([^)]+\)/,

  /** Quantities above this value without units are considered suspicious (possible parsing error) */
  SUSPICIOUS_QUANTITY_THRESHOLD: 10,
} as const;

/** Type representing person count and cooking time extracted from OCR */
export type personAndTimeObject = { person: number; time: number };
export const keysPersonsAndTimeObject = Object.keys({
  person: 0,
  time: 0,
} as personAndTimeObject) as (keyof personAndTimeObject)[];

/** Type representing a tag extracted from OCR */
export type tagObject = { id?: string; name: string };
export const keysTagObject = Object.keys({
  name: '',
} as tagObject) as (keyof tagObject)[];

/** Type representing ingredient quantity for a specific number of persons */
export type ingredientQuantityPerPersons = {
  persons: number;
  quantity: string;
};

/** Type representing an ingredient with multiple quantity specifications */
export type ingredientObject = {
  name: string;
  unit: string;
  quantityPerPersons: ingredientQuantityPerPersons[];
  /** Optional usage note from additional parentheticals */
  note?: string;
};
export const keysIngredientObject = Object.keys({
  name: '',
  unit: '',
  quantityPerPersons: [],
} as Omit<ingredientObject, 'note'>) as (keyof ingredientObject)[];

/** Function type for handling OCR warnings */
export type WarningHandler = (message: string) => void;

/**
 * Recognizes and extracts text from an image based on the specified recipe field type
 *
 * Uses ML Kit text recognition to extract text from images and processes it according
 * to the expected field type (title, ingredients, preparation steps, etc.).
 *
 * @param imageUri - URI path to the image to process
 * @param fieldName - Type of recipe field to extract (title, ingredients, etc.)
 * @returns Promise resolving to extracted and processed data specific to field type
 *
 * @example
 * ```typescript
 * // Extract title as string
 * const title = await recognizeText(imageUri, recipeColumnsNames.title);
 *
 * // Extract ingredients as structured objects
 * const ingredients = await recognizeText(imageUri, recipeColumnsNames.ingredients);
 *
 * // Extract preparation steps as array
 * const steps = await recognizeText(imageUri, recipeColumnsNames.preparation);
 * ```
 */
export async function recognizeText(imageUri: string, fieldName: recipeColumnsNames) {
  try {
    const normalizedUri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
    const ocr = await TextRecognition.recognize(normalizedUri);
    switch (fieldName) {
      // TODO should be really use OCR for these ?
      case recipeColumnsNames.time:
        return tranformOCRInOneNumber(ocr);
      case recipeColumnsNames.persons:
        return tranformOCRInOneNumber(ocr);
      case recipeColumnsNames.title:
      case recipeColumnsNames.description:
        return tranformOCRInOneString(ocr);
      case recipeColumnsNames.preparation:
        return tranformOCRInPreparation(ocr);
      case recipeColumnsNames.ingredients:
        return tranformOCRInIngredients(ocr);
      case recipeColumnsNames.tags:
        return tranformOCRInTags(ocr);
      case recipeColumnsNames.nutrition:
        return transformOCRInNutrition(ocr);
      case recipeColumnsNames.image:
        ocrLogger.error('Image field should not be processed through OCR', { fieldName });
        return '';
      default:
        ocrLogger.error('Unrecognized field type for OCR processing', { fieldName });
        return '';
    }
  } catch (e) {
    ocrLogger.error('OCR text recognition failed', { imageUri, fieldName, error: e });
    return '';
  }
}

/**
 * Converts OCR text blocks into a flat array of strings
 *
 * Takes an array of text blocks from ML Kit and extracts all line texts,
 * flattening the nested structure into a single array of strings.
 *
 * @param ocrBloc - Array of text blocks from ML Kit OCR result
 * @returns Flat array containing all text lines from the blocks
 */
function convertBlockOnArrayOfString(ocrBloc: TextBlock[]): string[] {
  return ocrBloc.map(block => block.lines.map(line => line.text)).flat();
}

/**
 * Transforms OCR result into a single string by replacing newlines with spaces
 *
 * @param ocr - Text recognition result from ML Kit
 * @returns Single string with newlines replaced by spaces
 * @todo Add option to convert to uppercase
 */
function tranformOCRInOneString(ocr: TextRecognitionResult): string {
  return ocr.text.replace(replaceAllBackToLine, ' ');
}

/**
 * Transforms OCR result into an array of tag objects
 *
 * Extracts individual words from OCR text and converts them into tag objects.
 * Filters out empty strings and creates tag elements with names.
 *
 * @param ocr - Text recognition result from ML Kit
 * @returns Array of tag table elements
 */
function tranformOCRInTags(ocr: TextRecognitionResult): tagTableElement[] {
  return ocr.blocks
    .map(block => block.lines.map(line => line.text).join(' '))
    .join(' ')
    .split(' ')
    .filter(tag => tag.length > 0)
    .map(tag => {
      return {
        name: tag,
      } as tagTableElement;
    });
}

/**
 * Extracts numbers from an array of strings
 *
 * @param str - Array of strings to parse
 * @returns Array of numbers extracted from the strings
 */
function retrieveNumbersFromArrayOfStrings(str: string[]): number[] {
  return str.map(element => retrieveNumberFromString(element));
}

/**
 * Extracts the first number from a string
 *
 * Takes the first word of the string and removes all non-digit characters,
 * then converts the result to a number.
 *
 * @param str - String to extract number from
 * @returns Extracted number or NaN if no valid number found
 */
function retrieveNumberFromString(str: string): number {
  return Number(str.split(' ')[0].replace(allNonDigitCharacter, ''));
}

/**
 * Extracts numbers from string array, returning single number or array based on count
 *
 * @param ocr - Array of strings to extract numbers from
 * @returns Single number if only one found, otherwise array of numbers
 */
function extractingNumberOrArray(ocr: string[]) {
  const result = retrieveNumbersFromArrayOfStrings(ocr);
  return result.length > 1 ? result : result[0];
}

/**
 * Transforms OCR result into numbers, handling person count and time data
 *
 * Analyzes OCR text to extract person counts (marked with 'p') and cooking times (marked with 'm').
 * Can return a single number, array of numbers, or array of person-time objects depending on the data found.
 *
 * @param ocr - Text recognition result from ML Kit
 * @returns Number, array of numbers, or array of person-time objects based on detected patterns
 */
function tranformOCRInOneNumber(
  ocr: TextRecognitionResult
): number | number[] | personAndTimeObject[] {
  const elementsToConvert = convertBlockOnArrayOfString(ocr.blocks);

  const personsChar = 'p';
  const timeChar = 'm';
  const personsArray = elementsToConvert.filter(element => element.includes(personsChar));
  const timeArray = elementsToConvert.filter(element => element.includes(timeChar));

  if (personsArray.length > 0) {
    if (timeArray.length > 0) {
      if (personsArray.length !== timeArray.length) {
        return extractingNumberOrArray(personsArray);
      }
      const personsAndTime = [];
      for (let i = 0; i < personsArray.length; i++) {
        personsAndTime.push({
          person: retrieveNumberFromString(personsArray[i]),
          time: retrieveNumberFromString(timeArray[i]),
        });
      }
      return personsAndTime;
    } else {
      return extractingNumberOrArray(personsArray);
    }
  } else if (timeArray.length > 0) {
    return extractingNumberOrArray(timeArray);
  }

  ocrLogger.error('Unable to convert OCR text to number', { elementsToConvert });
  return defaultValueNumber;
}

/**
 * Transforms OCR result into structured preparation steps
 *
 * Parses recipe preparation instructions from OCR text, handling various formats:
 * - Numbered steps with titles and descriptions
 * - Multi-block steps where numbers and content are separate
 * - Steps with titles in one block and descriptions in following blocks
 *
 * @param ocr - Text recognition result from ML Kit
 * @returns Array of preparation step elements sorted by step order
 */
function tranformOCRInPreparation(ocr: TextRecognitionResult): preparationStepElement[] {
  const steps: { step: preparationStepElement; order: number }[] = [];
  let currentStep: preparationStepElement | null = null;
  let currentOrder = 0;
  const pendingStepNumbers: number[] = [];

  for (let i = 0; i < ocr.blocks.length; i++) {
    const block = ocr.blocks[i];
    const text = block.text.trim();
    if (!text) {
      continue;
    }

    const stepNumber = extractStepNumber(text);

    if (stepNumber && isNumberOnlyBlock(text)) {
      pendingStepNumbers.push(stepNumber);
    } else if (!hasTextContent(text)) {
      // Skip blocks with no text content
    } else if (stepNumber && !isNumberOnlyBlock(text)) {
      if (currentStep && (currentStep.title || currentStep.description)) {
        steps.push({ step: currentStep, order: currentOrder });
      }

      currentOrder = stepNumber;
      const { title, description } = parseStepContent(text);
      currentStep = { title, description };
    } else if (pendingStepNumbers.length > 0 && looksLikeTitle(text)) {
      pendingStepNumbers.sort((a, b) => a - b);
      const nextStepNumber = pendingStepNumbers.shift()!;

      if (currentStep && (currentStep.title || currentStep.description)) {
        steps.push({ step: currentStep, order: currentOrder });
      }

      currentOrder = nextStepNumber;
      currentStep = { title: formatTitle(text), description: '' };
    } else if (currentStep) {
      const separator = currentStep.description ? '\n' : '';
      currentStep.description += separator + text;
    }
  }

  if (currentStep && (currentStep.title || currentStep.description)) {
    steps.push({ step: currentStep, order: currentOrder });
  }

  return steps.sort((a, b) => a.order - b.order).map(item => item.step);
}

/**
 * Extracts step number from text if it starts with a number
 *
 * Excludes numbers followed by time units (e.g., "10 min", "5 h") which are
 * cooking instructions, not step numbers.
 *
 * @param text - Text to extract step number from
 * @returns Step number if found, null otherwise
 */
function extractStepNumber(text: string): number | null {
  if (!numberAtFirstIndex.test(text)) {
    return null;
  }
  if (startsWithTimeValue(text)) {
    return null;
  }
  return retrieveNumberInStr(text);
}

/**
 * Checks if text starts with a time value (number followed by time unit)
 *
 * @param text - Text to check
 * @returns True if text starts with a time value like "10 min", "5 h", "30 sec"
 */
function startsWithTimeValue(text: string): boolean {
  return /^\d+\s*(min|minutes?|h|hours?|sec|seconds?|mn)\b/i.test(text);
}

/**
 * Parses step content to extract title and description from text
 *
 * Handles various formats:
 * - "1. Title" - number with title only
 * - "1. Title\nDescription" - number with title and description
 * - "Title" - standalone title text
 *
 * @param text - Raw text content of the step
 * @returns Object containing formatted title and description
 */
function parseStepContent(text: string): { title: string; description: string } {
  const lines = text.split('\n');
  const firstLine = lines[0];
  const remainingLines = lines.slice(1);

  const titleMatch = firstLine.match(/^\d+\.?\s*(.+)$/);

  if (titleMatch && remainingLines.length === 0) {
    return {
      title: formatTitle(titleMatch[1]),
      description: '',
    };
  } else if (titleMatch && remainingLines.length > 0) {
    return {
      title: formatTitle(titleMatch[1]),
      description: formatDescription(remainingLines.join('\n')),
    };
  } else {
    return {
      title: formatTitle(text),
      description: '',
    };
  }
}

/**
 * Formats a title by capitalizing only the first letter
 *
 * @param title - Raw title text
 * @returns Formatted title with proper capitalization
 */
function formatTitle(title: string): string {
  return convertToLowerCaseExceptFirstLetter(title.trim());
}

/**
 * Formats a description by normalizing the first letter to lowercase
 *
 * Preserves structure while ensuring consistent capitalization.
 * Handles accented characters and maintains non-word prefixes.
 *
 * @param description - Raw description text
 * @returns Formatted description with normalized first letter
 */
function formatDescription(description: string): string {
  return description.replace(
    /^(\W*)([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝ])/,
    (match, prefix, firstLetter) => prefix + firstLetter.toLowerCase()
  );
}

/**
 * Checks if text contains any alphabetic characters
 *
 * @param text - Text to check
 * @returns True if text contains letters
 */
function hasTextContent(text: string): boolean {
  return letterRegExp.test(text);
}

/**
 * Checks if text block contains only numbers (no letters)
 *
 * @param text - Text to check
 * @returns True if text starts with number and contains no letters
 */
function isNumberOnlyBlock(text: string): boolean {
  return numberAtFirstIndex.test(text) && !letterRegExp.test(text);
}

/**
 * Checks if text looks like a preparation step title
 *
 * Titles are typically short phrases that:
 * - Don't start with bullets (•) or periods
 * - Don't contain line breaks
 * - Don't end with a period
 * - Don't contain numbers (measurements like "12-14 min")
 * - Start with a capital letter
 *
 * @param text - Text to check
 * @returns True if text appears to be a step title
 */
function looksLikeTitle(text: string): boolean {
  return (
    text.length < 50 &&
    text.length > 3 &&
    !text.startsWith('•') &&
    !text.startsWith('.') &&
    !text.includes('\n') &&
    !text.endsWith('.') &&
    !/\d/.test(text) &&
    /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝ]/.test(text)
  );
}

type groupType = { person: string; quantity: string[] };

/** Result of separating markers from quantities in token stream */
type ParsedTokens = {
  markers: string[];
  quantities: string[];
};

/** Information about marker ordering */
type MarkerOrderInfo = {
  sortedMarkers: string[];
  isOutOfOrder: boolean;
};

/**
 * Separates person markers from quantity values in a token stream
 *
 * Person markers (e.g., "2p", "3p") indicate serving sizes, while quantities
 * are the ingredient amounts. Tokens containing spaces are split into separate values.
 *
 * @param tokens - Array of string tokens from ingredient data
 * @returns Object containing separated markers and quantities arrays
 */
function separateMarkersAndQuantities(tokens: string[]): ParsedTokens {
  const markers: string[] = [];
  const quantities: string[] = [];

  for (const token of tokens) {
    if (INGREDIENT_PARSING.PERSON_MARKER_PATTERN.test(token)) {
      markers.push(token);
    } else if (token.includes(' ')) {
      // Split space-separated values into individual quantities
      quantities.push(...token.split(' '));
    } else {
      quantities.push(token);
    }
  }

  return { markers, quantities };
}

/**
 * Analyzes the order of person markers and detects iOS out-of-order cases
 *
 * iOS OCR sometimes returns markers out of order (e.g., "5p", "3p", "2p", "4p" instead
 * of "2p", "3p", "4p", "5p"). This function detects this and provides sorted markers.
 *
 * @param markers - Array of person marker strings (e.g., ["5p", "3p", "2p", "4p"])
 * @returns Object with sorted markers and boolean indicating if reordering was needed
 */
function analyzeMarkerOrder(markers: string[]): MarkerOrderInfo {
  const sortedMarkers = [...markers].sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
    return numA - numB;
  });

  const isOutOfOrder = markers.some((m, i) => m !== sortedMarkers[i]);

  return { sortedMarkers, isOutOfOrder };
}

/**
 * Builds ingredient groups for iOS out-of-order markers case
 *
 * When iOS returns markers out of order (e.g., "5p", "3p", "2p", "4p"), the quantities
 * are still in their original positions. This function redistributes quantities to
 * match the sorted marker order by looking up each marker's original position.
 *
 * @param markers - Original markers in order they were found in OCR
 * @param sortedMarkers - Markers sorted by person count
 * @param allQuantities - All quantity values extracted from tokens
 * @param nIngredients - Expected number of quantities per group
 * @returns Array of grouped ingredient data with quantities redistributed
 */
function buildGroupsForOutOfOrderMarkers(
  markers: string[],
  sortedMarkers: string[],
  allQuantities: string[],
  nIngredients: number
): groupType[] {
  const groups: groupType[] = [];

  for (const sortedMarker of sortedMarkers) {
    const originalIndex = markers.indexOf(sortedMarker);
    const startIdx = originalIndex * nIngredients;
    const quantities = allQuantities.slice(startIdx, startIdx + nIngredients);

    while (quantities.length < nIngredients) {
      quantities.push('');
    }

    groups.push({ person: sortedMarker, quantity: quantities });
  }

  return groups;
}

/**
 * Builds ingredient groups using sequential accumulation (Android case)
 *
 * Processes tokens sequentially, accumulating quantities as they appear between
 * markers. This handles cases where quantity counts may vary due to space-split
 * tokens or OCR inconsistencies.
 *
 * @param tokens - Original token array from ingredient data
 * @param nIngredients - Expected number of quantities per group
 * @returns Array of grouped ingredient data
 */
function buildGroupsSequentially(tokens: string[], nIngredients: number): groupType[] {
  const groups: groupType[] = [];
  let group: groupType = { person: '', quantity: [] };

  for (const token of tokens) {
    if (INGREDIENT_PARSING.PERSON_MARKER_PATTERN.test(token)) {
      if (group.person.length > 0) {
        while (group.quantity.length < nIngredients) {
          group.quantity.push('');
        }
        groups.push(group);
        group = { person: '', quantity: [] };
      }
      group.person = token;
    } else {
      if (token.includes(' ')) {
        group.quantity.push(...token.split(' '));
      }
      group.quantity.push(token);
    }
  }

  if (group.person.length > 0) {
    groups.push(group);
  }

  return groups;
}

/** Result of detecting block order in ingredient data */
type BlockOrderResult = {
  ingredientNames: string[];
  dataTokens: string[];
  isReversed: boolean;
};

/**
 * Preprocesses OCR lines for ingredient parsing
 *
 * Performs several cleaning operations:
 * - Removes box header lines (e.g., "Dans votre box", "In your box")
 * - Converts person suffixes (e.g., "pers.") to "p" for marker detection
 * - Filters empty lines
 *
 * @param ocr - Text recognition result from ML Kit
 * @returns Cleaned array of text lines
 */
function preprocessIngredientLines(ocr: TextRecognitionResult): string[] {
  const lines: string[] = [];
  const ocrLines = ocr.blocks.flatMap(block => block.lines);
  const ingredientTerms = getIngredientOcrTerms(i18n.language);

  const boxHeaders = ingredientTerms?.boxHeaders ?? [];
  const personsSuffixes = ingredientTerms?.personsSuffix ?? [];

  const firstLineText = ocrLines[0]?.text.toLowerCase();
  if (firstLineText && boxHeaders.some(header => firstLineText.includes(header.toLowerCase()))) {
    ocrLines.shift();
  }

  for (const line of ocrLines) {
    const trimmed = line.text.trim();
    if (!trimmed) continue;

    const matchedSuffix = personsSuffixes.find(suffix => trimmed.includes(suffix));
    if (matchedSuffix) {
      lines[lines.length - 1] += 'p';
    } else {
      lines.push(trimmed);
    }
  }

  return lines;
}

/**
 * Detects block order and splits lines into ingredient names and data tokens
 *
 * iOS OCR sometimes returns blocks in reversed order (quantities/markers before
 * ingredient names). This function detects this by checking if the first person
 * marker appears early in the data, and if ingredient names appear after it.
 *
 * @param lines - Preprocessed OCR lines
 * @returns Object with ingredient names, data tokens, and whether order was reversed
 */
function detectBlockOrder(lines: string[]): BlockOrderResult | null {
  const headerBoundary = lines.findIndex(line =>
    INGREDIENT_PARSING.PERSON_MARKER_PATTERN.test(line)
  );

  if (headerBoundary === -1) {
    return null;
  }

  // Check if this is reversed order (quantities before names)
  // If first person marker appears early, check if ingredient names come after
  if (headerBoundary < INGREDIENT_PARSING.REVERSED_ORDER_THRESHOLD) {
    const firstIngredientNameIndex = lines.findIndex(line =>
      INGREDIENT_PARSING.INGREDIENT_WITH_UNIT_PATTERN.test(line)
    );

    if (firstIngredientNameIndex > headerBoundary) {
      return {
        ingredientNames: lines.slice(firstIngredientNameIndex),
        dataTokens: lines.slice(headerBoundary, firstIngredientNameIndex),
        isReversed: true,
      };
    }
  }

  return {
    ingredientNames: lines.slice(0, headerBoundary),
    dataTokens: lines.slice(headerBoundary),
    isReversed: false,
  };
}

/**
 * Transforms OCR results into structured ingredient objects
 *
 * Parses complex ingredient tables that include headers (ingredient names with units)
 * followed by data rows with person counts and quantities. Handles OCR inconsistencies
 * by detecting and correcting misplaced elements and merging multi-line ingredients.
 *
 * @param ocr - ML Kit text recognition result
 * @returns Array of structured ingredient objects with quantities per person count
 */
function tranformOCRInIngredients(ocr: TextRecognitionResult): ingredientObject[] {
  const lines = preprocessIngredientLines(ocr);

  ocrLogger.debug('Ingredient OCR raw blocks', {
    blockCount: ocr.blocks.length,
    blocks: ocr.blocks.map((b, i) => ({
      blockIndex: i,
      text: b.text,
      lines: b.lines.map(l => l.text),
    })),
  });
  ocrLogger.debug('Ingredient OCR preprocessed lines', { lines });

  const blockOrder = detectBlockOrder(lines);

  ocrLogger.debug('Ingredient OCR block order detection', {
    hasBlockOrder: !!blockOrder,
    isReversed: blockOrder?.isReversed,
    ingredientNames: blockOrder?.ingredientNames,
    dataTokens: blockOrder?.dataTokens,
  });

  if (!blockOrder) {
    ocrLogger.debug('Ingredient OCR: using parseIngredientsNoHeader fallback');
    return parseIngredientsNoHeader(lines);
  }

  const { ingredientNames, dataTokens } = blockOrder;

  const ingredientsOCR = parseIngredientsNamesAndUnits(ingredientNames);
  const groups = getIngredientsGroups(dataTokens, ingredientsOCR.length);

  adjustForSuspiciousData(groups, ingredientsOCR);
  assignQuantitiesToIngredients(groups, ingredientsOCR);

  return ingredientsOCR;
}

/**
 * Parses ingredient names and units from header strings
 *
 * Extracts ingredient names and units from header format like "Flour (cups)".
 * The first parenthetical is used as the unit, additional parentheticals become notes.
 * Example: "Flour (g) (organic)" → name="Flour", unit="g", note="organic"
 *
 * @param namesAndUnits - Array of header strings containing names and units
 * @returns Array of ingredient objects with parsed names, units, and optional notes
 */
function parseIngredientsNamesAndUnits(namesAndUnits: string[]): ingredientObject[] {
  return namesAndUnits.map(nameAndUnit => {
    const parentheticals = nameAndUnit.match(/\(([^)]*)\)/g);
    if (!parentheticals || parentheticals.length === 0) {
      return {
        name: nameAndUnit.trim(),
        unit: '',
        quantityPerPersons: [],
      };
    }

    const unit = parentheticals[0].slice(1, -1);
    const additionalParentheticals = parentheticals
      .slice(1)
      .map(p => p.slice(1, -1))
      .filter(p => p.trim().length > 0);
    const note =
      additionalParentheticals.length > 0 ? additionalParentheticals.join(', ') : undefined;

    let name = nameAndUnit;
    for (const p of parentheticals) {
      name = name.replace(p, '');
    }
    name = name.trim();

    return {
      name,
      unit,
      quantityPerPersons: [],
      ...(note && { note }),
    };
  });
}

/**
 * Groups ingredient tokens by person count and quantities
 *
 * Parses tokens from ingredient table data, grouping them by person markers (e.g., "2p")
 * and collecting associated quantity values. Handles iOS where markers may appear
 * out of order by detecting and redistributing quantities.
 *
 * @param tokens - Array of string tokens from ingredient data
 * @param nIngredients - Expected number of ingredients per group
 * @returns Array of grouped ingredient data
 */
function getIngredientsGroups(tokens: string[], nIngredients: number): groupType[] {
  const { markers, quantities: allQuantities } = separateMarkersAndQuantities(tokens);
  const { sortedMarkers, isOutOfOrder } = analyzeMarkerOrder(markers);

  let groups: groupType[];

  if (isOutOfOrder) {
    groups = buildGroupsForOutOfOrderMarkers(markers, sortedMarkers, allQuantities, nIngredients);
  } else {
    groups = buildGroupsSequentially(tokens, nIngredients);
  }

  return groups;
}

/**
 * Checks if an ingredient quantity seems suspicious or incorrectly parsed
 *
 * Identifies potentially problematic ingredient data:
 * - Empty quantities
 * - Large numbers (>10) without units, which might indicate parsing errors
 *
 * @param quantity - Quantity string to check
 * @param unit - Unit string associated with the quantity
 * @returns True if the ingredient data seems suspicious
 */
function isIngredientSuspicious(quantity: string, unit: string): boolean {
  if (quantity.length === 0) {
    return true;
  }
  const num = parseFloat(quantity.replace(/[^\d.]/g, ''));
  return unit === '' && num > INGREDIENT_PARSING.SUSPICIOUS_QUANTITY_THRESHOLD;
}

/**
 * Finds the first suspicious ingredient in a group
 *
 * Scans through a group's quantities to find the first ingredient that appears
 * to have suspicious or incorrectly parsed data.
 *
 * @param group - Group containing person count and quantities
 * @param ingredients - Array of ingredient objects with units
 * @returns Index of first suspicious ingredient, or -1 if none found
 */
function isSuspiciousGroup(group: groupType, ingredients: ingredientObject[]): number {
  for (let i = 0; i < ingredients.length; i++) {
    const quantityStr = group.quantity[i] || '';
    if (isIngredientSuspicious(quantityStr, ingredients[i].unit)) {
      return i;
    }
  }
  return -1;
}

/**
 * Checks if ingredients can be merged at the suspicious index
 *
 * Verifies that merging won't create additional suspicious entries
 * by checking if subsequent ingredients are valid.
 *
 * @param indexFirstSuspicious - Index of first suspicious ingredient
 * @param firstGroup - First group to check quantities against
 * @param ingredients - Array of ingredient objects
 * @returns True if merge is safe
 */
function canMergeIngredients(
  indexFirstSuspicious: number,
  firstGroup: groupType,
  ingredients: ingredientObject[]
): boolean {
  if (indexFirstSuspicious === firstGroup.quantity.length) {
    return false;
  }

  for (
    let i = indexFirstSuspicious + 1;
    i < firstGroup.quantity.length && i < ingredients.length;
    i++
  ) {
    if (isIngredientSuspicious(firstGroup.quantity[i], ingredients[i].unit)) {
      return false;
    }
  }

  return true;
}

/**
 * Merges two adjacent ingredients by combining their names and units
 *
 * Used to fix OCR errors where a single ingredient was split across
 * multiple lines.
 *
 * @param ingredients - Array of ingredients to modify (mutated in place)
 * @param index - Index of first ingredient to merge
 * @returns True if merge was successful
 */
function mergeAdjacentIngredients(ingredients: ingredientObject[], index: number): boolean {
  const current = ingredients[index];
  const next = ingredients[index + 1];

  if (!next) {
    return false;
  }

  current.name += ' ' + next.name;
  current.unit += next.unit;
  ingredients.splice(index + 1, 1);

  return true;
}

/**
 * Adjusts groups and ingredients for suspicious data patterns
 *
 * When OCR incorrectly splits ingredients across lines, this function:
 * 1. Detects suspicious quantity patterns in the first group
 * 2. Merges adjacent ingredients to fix the split
 * 3. Removes remaining suspicious groups
 *
 * @param groups - Array of groups (mutated in place - suspicious ones removed)
 * @param ingredients - Array of ingredients (mutated in place - merges applied)
 */
function adjustForSuspiciousData(groups: groupType[], ingredients: ingredientObject[]): void {
  if (groups.length === 0) {
    return;
  }

  const firstGroup = groups[0];
  let indexFirstSuspicious = isSuspiciousGroup(firstGroup, ingredients);

  while (indexFirstSuspicious > -1) {
    if (canMergeIngredients(indexFirstSuspicious, firstGroup, ingredients)) {
      if (!mergeAdjacentIngredients(ingredients, indexFirstSuspicious)) {
        break;
      }
    } else {
      ocrLogger.warn('Cannot merge ingredients - breaking loop', {
        ingredient1: ingredients[indexFirstSuspicious]?.name || 'unknown',
        ingredient2: ingredients[indexFirstSuspicious + 1]?.name || 'unknown',
      });
      break;
    }
    indexFirstSuspicious = isSuspiciousGroup(firstGroup, ingredients);
  }

  // Remove remaining suspicious groups (after index 0)
  let groupIndex = 1;
  while (groupIndex < groups.length) {
    if (isSuspiciousGroup(groups[groupIndex], ingredients) === -1) {
      groupIndex++;
    } else {
      groups.splice(groupIndex, 1);
    }
  }
}

/**
 * Assigns quantity values from groups to ingredient objects
 *
 * Maps each group's quantities to the corresponding ingredients,
 * creating the quantityPerPersons array for each ingredient.
 *
 * @param groups - Array of groups with person markers and quantities
 * @param ingredients - Array of ingredients to populate (mutated in place)
 */
function assignQuantitiesToIngredients(groups: groupType[], ingredients: ingredientObject[]): void {
  groups.forEach(g => {
    const personsMatch = g.person.match(/(\d+)\s*p\s*$/i);
    const persons = personsMatch ? parseInt(personsMatch[1]) : NaN;

    for (let i = 0; i < ingredients.length; i++) {
      ingredients[i].quantityPerPersons.push({
        persons,
        quantity: g.quantity[i] ?? '',
      });
    }
  });
}

/**
 * Converts string to lowercase except for the first letter
 *
 * Finds the first alphabetic character and capitalizes it while converting
 * the rest of the string to lowercase.
 *
 * @param str - String to convert
 * @returns String with first letter capitalized and rest lowercase
 */
function convertToLowerCaseExceptFirstLetter(str: string) {
  const firstLetterIndex = str.search(letterRegExp);
  return str.charAt(firstLetterIndex).toUpperCase() + str.slice(firstLetterIndex + 1).toLowerCase();
}

/**
 * Retrieves the first number from a string, handling decimals
 *
 * Extracts numeric value from the beginning of a string, stopping at the first letter.
 * Handles decimal numbers with both dot and comma separators.
 *
 * @param str - String to extract number from
 * @returns Extracted number or -1 if no valid number found
 */
function retrieveNumberInStr(str: string) {
  const firstLetterIndex = str.search(letterRegExp);
  const workingStr = firstLetterIndex !== -1 ? str.slice(0, firstLetterIndex) : str;

  const allNum = workingStr.match(findAllNumbers);
  if (allNum) {
    if (allNum.length < 1) {
      if (workingStr.includes('.')) {
        return Number(allNum[0] + '.' + allNum[1]);
      }
      if (workingStr.includes(',')) {
        return Number(allNum[0] + ',' + allNum[1]);
      }
    }
    return Number(allNum[0]);
  }
  return -1;
}

/**
 * Extracts and processes a specific recipe field from an image
 *
 * High-level function that combines OCR text recognition with field-specific processing
 * and validation. Handles automatic quantity scaling, state merging, and error reporting.
 *
 * @param uri - URI path to the image to process
 * @param field - Specific recipe field to extract
 * @param currentState - Current recipe state for merging and scaling
 * @param onWarn - Optional warning handler for processing issues
 * @returns Promise resolving to partial recipe object with extracted field
 *
 * @example
 * ```typescript
 * const currentState = {
 *   recipePreparation: [],
 *   recipePersons: 4,
 *   recipeTags: [],
 *   recipeIngredients: []
 * };
 *
 * const result = await extractFieldFromImage(
 *   imageUri,
 *   recipeColumnsNames.ingredients,
 *   currentState,
 *   (warning) => console.warn(warning)
 * );
 *
 * if (result.recipeIngredients) {
 *   // Ingredients extracted and scaled to current serving size
 *   console.log(`Extracted ${result.recipeIngredients.length} ingredients`);
 * }
 * ```
 */
export async function extractFieldFromImage(
  uri: string,
  field: recipeColumnsNames,
  currentState: {
    recipePreparation: preparationStepElement[];
    recipePersons: number;
    recipeTags: tagTableElement[];
    recipeIngredients: FormIngredientElement[];
  },
  onWarn: WarningHandler = msg => ocrLogger.warn('OCR extraction warning', { message: msg })
): Promise<
  Partial<{
    recipeImage: string;
    recipeTitle: string;
    recipeDescription: string;
    recipeTags: tagTableElement[];
    recipePreparation: preparationStepElement[];
    recipePersons: number;
    recipeTime: number;
    recipeIngredients: FormIngredientElement[];
    recipeNutrition: nutritionObject;
  }>
> {
  if (field === recipeColumnsNames.image) {
    return { recipeImage: uri };
  }

  const ocrResult = await recognizeText(uri, field);
  const warn = (msg: string) =>
    onWarn(msg + ` {uri: ${uri},field: ${field},ocrResult: ${ocrResult} }`);
  // TODO to implement OCR for tags ?
  switch (field) {
    case recipeColumnsNames.title:
      if (isString(ocrResult)) {
        return { recipeTitle: ocrResult as string };
      } else {
        warn('Expected string for title');
        return {};
      }
    case recipeColumnsNames.description:
      if (isString(ocrResult)) {
        return { recipeDescription: ocrResult as string };
      } else {
        warn('Expected string for description');
        return {};
      }
    case recipeColumnsNames.preparation:
      if (Array.isArray(ocrResult) && ocrResult.length > 0) {
        return {
          recipePreparation: [
            ...currentState.recipePreparation,
            ...(ocrResult as preparationStepElement[]),
          ],
        };
      } else {
        warn('Expected non empty array of preparation steps for preparation');
        return {};
      }
    case recipeColumnsNames.persons:
    case recipeColumnsNames.time:
      if (isNumber(ocrResult)) {
        return field === recipeColumnsNames.persons
          ? { recipePersons: ocrResult as number }
          : { recipeTime: ocrResult as number };
      }
      if (Array.isArray(ocrResult) && ocrResult.length > 0) {
        if (isArrayOfNumber(ocrResult)) {
          return field === recipeColumnsNames.persons
            ? { recipePersons: ocrResult[0] as number }
            : { recipeTime: ocrResult[0] as number };
        } else if (isArrayOfType(ocrResult, keysPersonsAndTimeObject) && ocrResult.length > 0) {
          const valueToTake = ocrResult[0] as personAndTimeObject;
          return {
            recipePersons: valueToTake.person as number,
            recipeTime: valueToTake.time as number,
          };
        }
      }
      warn('Could not parse persons/time field');
      return {};
    case recipeColumnsNames.ingredients:
      if (
        Array.isArray(ocrResult) &&
        ocrResult.length > 0 &&
        isArrayOfType(ocrResult, keysIngredientObject)
      ) {
        let idQuantityToSearch: number;
        let ocrPersonsCount: number;
        let targetPersonsCount = currentState.recipePersons;

        if (currentState.recipePersons > 0) {
          const foundPersonIndex = (ocrResult[0] as ingredientObject).quantityPerPersons.findIndex(
            p => Number(p.persons) === currentState.recipePersons
          );
          if (foundPersonIndex !== -1) {
            idQuantityToSearch = foundPersonIndex;
            ocrPersonsCount = currentState.recipePersons;
          } else {
            idQuantityToSearch = 0;
            ocrPersonsCount = (ocrResult[idQuantityToSearch] as ingredientObject)
              .quantityPerPersons[idQuantityToSearch].persons;
            warn(
              `Couldn't find exact match for persons (${currentState.recipePersons}) in ingredient. Using ${ocrPersonsCount} and scaling to ${targetPersonsCount}.`
            );
          }
        } else {
          idQuantityToSearch = 0;
          ocrPersonsCount = (ocrResult[idQuantityToSearch] as ingredientObject).quantityPerPersons[
            idQuantityToSearch
          ].persons;
          targetPersonsCount = ocrPersonsCount;
          warn(
            `Couldn't find exact match for persons in ingredient. Using first available : ${ocrPersonsCount}.`
          );
        }

        return {
          recipeIngredients: [
            ...currentState.recipeIngredients,
            ...(ocrResult as ingredientObject[]).map(ingredient => {
              return {
                name: ingredient.name,
                unit: ingredient.unit,
                quantity: scaleQuantityForPersons(
                  ingredient.quantityPerPersons[idQuantityToSearch].quantity,
                  ocrPersonsCount,
                  targetPersonsCount
                ),
                ...(ingredient.note && { note: ingredient.note }),
              };
            }),
          ],
        };
      }
      warn('Expected non empty array of ingredient objects');
      return {};
    case recipeColumnsNames.tags:
      if (
        Array.isArray(ocrResult) &&
        ocrResult.length > 0 &&
        isArrayOfType<tagTableElement>(ocrResult, keysTagObject)
      ) {
        return {
          recipeTags: [...currentState.recipeTags, ...(ocrResult as tagTableElement[])],
        };
      } else {
        warn('Expected non empty array of strings for tags');
        return {};
      }
    case recipeColumnsNames.nutrition:
      if (ocrResult && typeof ocrResult === 'object' && !Array.isArray(ocrResult)) {
        return {
          recipeNutrition: ocrResult as nutritionObject,
        };
      } else {
        warn('Expected nutrition object for nutrition field');
        return {};
      }
    default:
      ocrLogger.error('Unrecognized field in extractFieldFromImage', { field });
      return {};
  }
}

/**
 * Parses ingredients from OCR text when no clear header structure is detected
 *
 * Fallback parsing method that assumes ingredients are organized in two sections:
 * the first half contains ingredient names, the second half contains quantities with units.
 * This handles cases where ingredient tables don't have clear headers or person markers.
 *
 * On iOS, ML Kit may return quantity blocks before name blocks (opposite of Android).
 * This is detected by checking if the first "name" line starts with a digit, in which
 * case the two halves are swapped before pairing.
 *
 * @param lines - Array of text lines from ingredient OCR
 * @returns Array of ingredient objects with names, quantities, and units
 *
 * @example
 * ```typescript
 * // Input lines: ["Flour", "Sugar", "Salt", "2 cups", "1 tsp", "1 pinch"]
 * // Returns: [
 * //   { name: "Flour", unit: "cups", quantityPerPersons: [{ persons: -1, quantity: "2" }] },
 * //   { name: "Sugar", unit: "tsp", quantityPerPersons: [{ persons: -1, quantity: "1" }] }
 * // ]
 * ```
 */
export function parseIngredientsNoHeader(lines: string[]): ingredientObject[] {
  if (!lines.length) {
    return [];
  }

  const mid = Math.floor(lines.length / 2);

  let nameLines = lines.slice(0, mid);
  let quantityLines = lines.slice(mid);

  if (nameLines.length > 0 && numberAtFirstIndex.test(nameLines[0])) {
    [nameLines, quantityLines] = [quantityLines, nameLines];
  }

  const result: ingredientObject[] = [];

  for (let i = 0; i < Math.min(nameLines.length, quantityLines.length); i++) {
    const [quantity, unit] = quantityLines[i].split(' ');
    const quantityPerPersons: ingredientQuantityPerPersons[] = [
      {
        persons: -1,
        quantity: quantity,
      },
    ];

    result.push({
      name: nameLines[i],
      unit: unit ?? '',
      quantityPerPersons: quantityPerPersons,
    });
  }

  return result;
}

/**
 * Parses and validates nutrition values from OCR text
 *
 * Cleans OCR text and extracts numeric nutrition values with validation:
 * - Removes parentheses and normalizes whitespace
 * - Corrects common OCR errors (like 'I' instead of '1')
 * - Validates numeric ranges and format
 * - Rounds to 2 decimal places
 *
 * @param ocrText - Raw OCR text containing nutrition value
 * @returns Parsed nutrition value or undefined if invalid
 */
function parseNutritionValue(ocrText: string): number | undefined {
  const MAX_NUTRITION_VALUE = 10000;
  const DECIMAL_PRECISION = 100;

  let cleanedText = ocrText.trim();
  cleanedText = cleanedText.replace(/\([^)]*\)/g, '');
  cleanedText = cleanedText.replace(/\n/g, ' ');
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  cleanedText = cleanedText.replace(/^I(\d)/g, '1$1');

  if (startsWithLetter.test(cleanedText) || hasLettersInMiddle.test(cleanedText)) {
    return undefined;
  }

  let numericPart = cleanedText;
  if (endsWithLetters.test(cleanedText)) {
    numericPart = cleanedText.replace(endsWithLetters, '').trim();
  } else if (cleanedText.length > 1) {
    numericPart = cleanedText.substring(0, cleanedText.length - 1);
  } else {
    return undefined;
  }

  const normalizedDecimal = numericPart.replace(',', '.');

  if (!onlyDigitsDotsSpaces.test(normalizedDecimal)) {
    return undefined;
  }

  const parsedNumber = parseFloat(normalizedDecimal);
  if (isNaN(parsedNumber) || parsedNumber < 0 || parsedNumber > MAX_NUTRITION_VALUE) {
    return undefined;
  }

  return Math.round(parsedNumber * DECIMAL_PRECISION) / DECIMAL_PRECISION;
}

/** OCR terms for ingredient parsing from i18n */
type IngredientOcrTerms = {
  boxHeaders: string[];
  personsSuffix: string[];
};

/**
 * Retrieves ingredient OCR terms for the specified language from i18n
 *
 * @param language - Language code to get ingredient terms for
 * @returns Ingredient OCR terms object or undefined if not found/error
 */
function getIngredientOcrTerms(language: string): IngredientOcrTerms | undefined {
  try {
    const result = i18n.getResource(language, 'translation', 'recipe.ingredientsOcr');
    if (result && typeof result === 'object') {
      return result as IngredientOcrTerms;
    }
  } catch (error) {
    ocrLogger.error('i18n ingredient OCR terms failed', { error });
    return undefined;
  }
}

/**
 * Retrieves nutrition terms for the specified language from i18n
 *
 * @param language - Language code to get nutrition terms for
 * @returns Nutrition terms object or undefined if not found/error
 */
function getNutritionTermsForLanguage(language: string) {
  try {
    const result = i18n.getResource(language, 'translation', 'recipe.nutrition.ocr');
    if (result && typeof result === 'object') {
      return result;
    }
  } catch (error) {
    ocrLogger.error('i18n nutrition terms failed', { error });
    return undefined;
  }
}

/**
 * Normalizes common OCR errors in text
 *
 * Fixes common OCR misrecognitions:
 * - Capital O read as 0 in numbers (e.g., "10Og" -> "100g")
 * - Capital O surrounded by digits
 *
 * @param text - Raw OCR text to normalize
 * @returns Normalized text with OCR errors corrected
 */
function normalizeOcrErrors(text: string): string {
  // Replace capital O with 0 when between digits or at start/end of digit sequences
  // "10Og" -> "100g", "1O0g" -> "100g", "O0g" -> "00g"
  return text.replace(/(\d)O/g, '$10').replace(/O(\d)/g, '0$1');
}

/**
 * Finds and merges "per 100g" indicator lines in nutrition text
 *
 * Searches for nutrition table headers indicating "per 100g" values using fuzzy matching.
 * Merges consecutive lines that together form a complete "per 100g" term.
 *
 * @param lines - Array of text lines from nutrition table
 * @param nutritionTerms - Localized nutrition terminology
 * @returns Index of the merged "per 100g" line, or -1 if not found
 */
function findAndMergePer100gLines(lines: string[], nutritionTerms: NutritionTerms): number {
  const per100gTerms = nutritionTerms[per100gKey];
  const per100gFuse = new Fuse(per100gTerms, {
    threshold: FUSE_THRESHOLD,
  });

  for (let i = 0; i < lines.length; i++) {
    const normalizedLine = normalizeOcrErrors(lines[i].toLowerCase());
    if (per100gFuse.search(normalizedLine).length > 0) {
      let endIndex = i;

      while (endIndex + 1 < lines.length) {
        const currentMerged = lines.slice(i, endIndex + 2).join(' ');
        const normalizedMerged = normalizeOcrErrors(currentMerged.toLowerCase());
        if (per100gFuse.search(normalizedMerged).length > 0) {
          endIndex++;
        } else {
          break;
        }
      }

      if (endIndex > i) {
        const mergedLine = lines.slice(i, endIndex + 1).join(' ');
        lines.splice(i, endIndex - i + 1, mergedLine);
      }

      return i;
    }
  }

  return -1;
}

/**
 * Creates Fuse.js search objects for nutrition term matching
 *
 * Builds fuzzy search objects for each nutrition term type, excluding
 * special keys like "per100g" and "perPortion".
 *
 * @param nutritionTerms - Localized nutrition terminology
 * @returns Record of Fuse objects keyed by nutrition term type
 */
function createFuseObjects(nutritionTerms: NutritionTerms): Record<OcrKeys, Fuse<string>> {
  const fuseOfNutritionTerms = {} as Record<OcrKeys, Fuse<string>>;

  for (const [termKey, termValue] of Object.entries(nutritionTerms)) {
    if (termKey !== per100gKey && termKey !== perPortionKey) {
      fuseOfNutritionTerms[termKey as OcrKeys] = new Fuse(termValue, {
        threshold: FUSE_THRESHOLD,
      });
    }
  }

  return fuseOfNutritionTerms;
}

/**
 * Checks if a line matches any known nutrition term
 */
function isNutritionLabel(
  line: string,
  fuseOfNutritionTerms: Record<OcrKeys, Fuse<string>>
): boolean {
  for (const [key, fuse] of Object.entries(fuseOfNutritionTerms)) {
    if (key !== per100gKey && key !== perPortionKey && fuse.search(line.toLowerCase()).length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Filters lines to extract nutrition labels from OCR text
 *
 * Searches through lines to find lines that match known nutrition terms.
 * Handles both Android (labels before per100g) and iOS (labels after per100g) block orders.
 *
 * @param lines - Array of text lines from nutrition table
 * @param per100gIndex - Index of the "per 100g" indicator line
 * @param fuseOfNutritionTerms - Fuse objects for nutrition term matching
 * @returns Array of filtered nutrition label lines
 */
function filterNutritionLabels(
  lines: string[],
  per100gIndex: number,
  fuseOfNutritionTerms: Record<OcrKeys, Fuse<string>>
): string[] {
  // First try: search before per100g (Android case)
  const linesBeforePer100g = lines.slice(0, per100gIndex + 1);
  let filteredLines = linesBeforePer100g.filter(item =>
    isNutritionLabel(item, fuseOfNutritionTerms)
  );

  // If no labels found before per100g, search after it (iOS case)
  if (filteredLines.length === 0) {
    const linesAfterPer100g = lines.slice(per100gIndex + 1);
    filteredLines = linesAfterPer100g.filter(item => isNutritionLabel(item, fuseOfNutritionTerms));
  }

  return duplicateEnergyLabelIfNeeded(filteredLines, fuseOfNutritionTerms);
}

/**
 * Extracts nutrition values from lines following the "per 100g" indicator
 *
 * Gets the value lines that correspond to nutrition labels, stopping at
 * "per portion" indicator if found (indicating two-column format).
 * Filters out nutrition labels to handle iOS case where labels come after per100g.
 *
 * @param lines - Array of text lines from nutrition table
 * @param per100gIndex - Index of the "per 100g" indicator line
 * @param nutritionTerms - Localized nutrition terminology
 * @param fuseOfNutritionTerms - Fuse objects for nutrition term matching
 * @returns Array of nutrition value lines
 */
function extractNutritionValues(
  lines: string[],
  per100gIndex: number,
  nutritionTerms: NutritionTerms,
  fuseOfNutritionTerms: Record<OcrKeys, Fuse<string>>
): string[] {
  const linesAfterPer100g = lines.slice(per100gIndex + 1);

  const perPortionTerms = nutritionTerms['perPortion'];
  const perPortionFuse = new Fuse(perPortionTerms, {
    threshold: FUSE_THRESHOLD,
  });

  const perPortionIndex = linesAfterPer100g.findIndex(line => {
    return perPortionFuse.search(line.toLowerCase()).length > 0;
  });

  let valueCandidates: string[];
  if (perPortionIndex !== -1) {
    valueCandidates = linesAfterPer100g.slice(0, perPortionIndex);
  } else {
    valueCandidates = linesAfterPer100g;
  }

  // Filter out lines that are nutrition labels (for iOS case where labels come after per100g)
  return valueCandidates.filter(line => !isNutritionLabel(line, fuseOfNutritionTerms));
}

/**
 * Duplicates energy label if only one is found to handle both kcal and kJ values
 *
 * Nutrition tables often show energy in both kcal and kJ but may only have one
 * "Energy" label. This function duplicates the energy label when needed.
 *
 * @param nutritionLabels - Array of nutrition label strings
 * @param fuseOfNutritionTerms - Fuse objects for nutrition term matching
 * @returns Array with energy label duplicated if necessary
 */
function duplicateEnergyLabelIfNeeded(
  nutritionLabels: string[],
  fuseOfNutritionTerms: Record<OcrKeys, Fuse<string>>
): string[] {
  const labelsWithPossibleDuplicate = [...nutritionLabels];
  const energyFuse = fuseOfNutritionTerms['energyKcal'];

  let energyLabelCount = 0;
  let firstEnergyIndex = -1;

  for (let i = 0; i < labelsWithPossibleDuplicate.length; i++) {
    if (energyFuse.search(labelsWithPossibleDuplicate[i].toLowerCase()).length > 0) {
      energyLabelCount++;
      firstEnergyIndex = i;
    }
  }

  if (energyLabelCount === 1) {
    const duplicatedEnergyLabel = labelsWithPossibleDuplicate[firstEnergyIndex];
    labelsWithPossibleDuplicate.splice(firstEnergyIndex + 1, 0, duplicatedEnergyLabel);
  }

  return labelsWithPossibleDuplicate;
}

/**
 * Parses nutrition labels and values into a structured nutrition object
 *
 * Matches labels to known nutrition terms and parses corresponding values.
 * Handles special logic for energy values (kcal vs kJ) by using value magnitude
 * to distinguish between them.
 *
 * @param nutritionLabels - Array of nutrition label strings
 * @param nutritionValues - Array of nutrition value strings
 * @param fuseOfNutritionTerms - Fuse objects for nutrition term matching
 * @returns Structured nutrition object with parsed values
 */
function parseNutritionLabelsAndValues(
  nutritionLabels: string[],
  nutritionValues: string[],
  fuseOfNutritionTerms: Record<OcrKeys, Fuse<string>>
): nutritionObject {
  const parsedNutritionObject: nutritionObject = {};

  const energyCalKey: OcrKeys = 'energyKcal';
  const energyJoulKey: OcrKeys = 'energyKj';

  for (let i = 0; i < nutritionLabels.length; i++) {
    const label = nutritionLabels[i].toLowerCase();
    const value = nutritionValues[i]?.toLowerCase() || '';

    let labelKey: OcrKeys | undefined;
    for (const [key, fuse] of Object.entries(fuseOfNutritionTerms)) {
      if (fuse.search(label).length > 0) {
        labelKey = key as OcrKeys;
        break;
      }
    }

    if (!labelKey) {
      ocrLogger.info(`Label ${label} not found in nutrition terms`);
      continue;
    }

    const valueParsed = parseNutritionValue(value);
    if (!valueParsed) {
      ocrLogger.info(`Value ${value} could not be converted to number`);
      continue;
    }

    if (labelKey !== energyCalKey && labelKey !== energyJoulKey) {
      parsedNutritionObject[labelKey as keyof nutritionObject] = valueParsed;
    } else {
      if (parsedNutritionObject[energyCalKey]) {
        if (valueParsed < parsedNutritionObject[energyCalKey]) {
          parsedNutritionObject[energyJoulKey] = parsedNutritionObject[energyCalKey];
          parsedNutritionObject[energyCalKey] = valueParsed;
        } else {
          parsedNutritionObject[energyJoulKey] = valueParsed;
        }
      } else if (parsedNutritionObject[energyJoulKey]) {
        if (valueParsed > parsedNutritionObject[energyJoulKey]) {
          parsedNutritionObject[energyCalKey] = parsedNutritionObject[energyJoulKey];
          parsedNutritionObject[energyJoulKey] = valueParsed;
        } else {
          parsedNutritionObject[energyCalKey] = valueParsed;
        }
      } else {
        parsedNutritionObject[valueParsed < 1000 ? energyCalKey : energyJoulKey] = valueParsed;
      }
    }
  }

  return parsedNutritionObject;
}

/**
 * Transforms OCR result into a structured nutrition object
 *
 * Main function for processing nutrition table OCR results. Extracts nutrition
 * labels and values from structured nutrition tables, handling various formats
 * and language-specific terms.
 *
 * @param ocr - Text recognition result from ML Kit
 * @returns Structured nutrition object with parsed nutrition data
 */
function transformOCRInNutrition(ocr: TextRecognitionResult): nutritionObject {
  const originalLines = convertBlockOnArrayOfString(ocr.blocks);

  const nutritionTerms = getNutritionTermsForLanguage(i18n.language);
  if (!nutritionTerms) {
    return {};
  }

  const nutritionSearches = createFuseObjects(nutritionTerms as NutritionTerms);
  const per100gIndex = findAndMergePer100gLines(originalLines, nutritionTerms as NutritionTerms);

  if (per100gIndex === -1) {
    return {};
  }

  const extractedLabels = filterNutritionLabels(originalLines, per100gIndex, nutritionSearches);
  const extractedValues = extractNutritionValues(
    originalLines,
    per100gIndex,
    nutritionTerms as NutritionTerms,
    nutritionSearches
  );

  if (extractedValues.length < extractedLabels.length) {
    return {};
  }
  const matchingValues = extractedValues.slice(0, extractedLabels.length);

  return parseNutritionLabelsAndValues(extractedLabels, matchingValues, nutritionSearches);
}
