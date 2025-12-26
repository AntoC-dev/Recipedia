/**
 * Typography System - Comprehensive text styling and font management
 *
 * This module provides the complete typography system for the Recipedia app.
 * Includes font loading, text styling, regular expressions for text processing,
 * and specialized layouts for different text rendering contexts.
 *
 * Key Features:
 * - Custom Lora font family loading and configuration
 * - Comprehensive text styling with consistent hierarchy
 * - Text processing utilities and regular expressions
 * - Specialized layouts for different text rendering modes
 * - Search bar and modal text styling
 * - Responsive typography with device scaling
 * - Internationalization support with text separators
 *
 * Typography Hierarchy:
 * - **Title**: Large, bold text for main headings
 * - **Header**: Medium, bold text for section headers
 * - **Paragraph**: Standard body text for content
 * - **Element**: Small, subtle text for metadata
 * - **Modal**: High-contrast text for modal dialogs
 *
 * Text Processing:
 * - Regular expressions for ingredient parsing
 * - Number extraction and manipulation
 * - Text encoding and separator handling
 * - Multi-language character support
 *
 * Rendering Modes:
 * - **ARRAY**: List-style text rendering
 * - **SECTION**: Section-based text layout
 * - **LIST**: Simple list text display
 * - **CLICK_LIST**: Interactive list text styling
 *
 * @example
 * ```typescript
 * import {
 *   typoStyles,
 *   useFetchFonts,
 *   findAllNumbers,
 *   searchBarStyle,
 *   typoRender
 * } from '@styles/typography';
 *
 * // Loading fonts in app component
 * const [fontsLoaded] = useFetchFonts();
 * if (!fontsLoaded) return <LoadingScreen />;
 *
 * // Using typography styles
 * <Text style={typoStyles.title}>Recipe Title</Text>
 * <Text style={typoStyles.paragraph}>Recipe description</Text>
 * <Text style={typoStyles.element}>Prep time: 30 min</Text>
 *
 * // Search bar layout
 * <View style={searchBarStyle.searchBarView}>
 *   <View style={searchBarStyle.searchBarComponent}>
 *     <TextInput style={typoStyles.searchBar} />
 *   </View>
 * </View>
 *
 * // Text processing
 * const numbers = ingredientText.match(findAllNumbers);
 * const cleanText = text.replace(exceptLettersRegExp, '');
 * ```
 */

import { palette } from './colors';
import { padding } from './spacing';
import { useFonts } from 'expo-font';
import { StyleSheet } from 'react-native';
import { VariantProp } from 'react-native-paper/lib/typescript/components/Typography/types';

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

/** Regular expression to check if text contains numbers */
export const containNumbers = /\d/;

/** Regular expression to separate numbers from text */
export const separateNumbersFromStr = /\d+|\D+/g;

/** Regular expression to match letters only */
export const letterRegExp = /[a-zA-z]/;

/** Regular expression to match everything except letters (including accented) */
export const exceptLettersRegExp = /[^a-zA-ZÀ-ÖØ-öø-ÿ]/g;

/** Regular expression to match everything except letters and spaces */
export const exceptLettersAndSpacesRegExp = /[^a-zA-ZÀ-ÖØ-öø-ÿ\s]/g;

/** Regular expression to extract text between parentheses */
export const extractBetweenParenthesis = /\((.*?)\)/;

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

/**
 * Font family definitions for consistent typography
 * Maps semantic names to actual font file names
 */
const typoFamily = {
  normal: 'Lora-VariableFont_wght',
  italic: 'Lora-Italic-VariableFont_wght',
};

/** Standard variant for bottom sheet screen titles */
export const BottomScreenTitle: VariantProp<never> = 'headlineMedium';

/**
 * Typography size scale for consistent text sizing
 * All values in pixels for standard text elements
 */
export const typoSize = {
  element: 10,
  paragraphSize: 14,
  headerSize: 18,
  titleSize: 22,
};

/**
 * Text rendering mode enumeration
 * Defines different layout contexts for text display
 */
export enum typoRender {
  ARRAY = 'ARRAY',
  SECTION = 'SECTION',
  LIST = 'LIST',
  CLICK_LIST = 'CLICK_LIST',
}

/**
 * Data structure for bullet list text rendering
 * Supports both single and multiple data display modes
 */
export type bulletListDataType = {
  /** Whether to display multiple data items */
  multiplesData: boolean;
  /** Array of text items for bullet list display */
  bulletListData: string[];
  /** Single text item for simple display */
  shortData: string;
};

/**
 * Configuration for editable text components
 * Defines styling and callback behavior for text editing
 */
export type editableText = {
  /** Whether to display border around editable text */
  withBorder: boolean;
  /** Callback function for text changes */
  onChangeFunction(oldValueId: number, newParam: string): void;
  /** Optional callback for preparation step title changes */
  onTitleChangeFunction?(stepIndex: number, newTitle: string): void;
  /** Optional callback for preparation step description changes */
  onDescriptionChangeFunction?(stepIndex: number, newDescription: string): void;
};

/**
 * Core typography styles for all text elements
 * Provides consistent styling across the application
 */
export const typoStyles = StyleSheet.create({
  element: {
    color: palette.textGrey,
    fontFamily: typoFamily.normal,
    fontSize: typoSize.element,
    fontWeight: 'normal',
    textAlign: 'left',
  },
  paragraph: {
    color: palette.textPrimary,
    fontFamily: typoFamily.normal,
    fontSize: typoSize.paragraphSize,
    fontWeight: 'normal',
    textAlign: 'left',
  },
  header: {
    color: palette.textPrimary,
    fontFamily: typoFamily.normal,
    fontSize: typoSize.headerSize,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  title: {
    color: palette.textPrimary,
    fontFamily: typoFamily.normal,
    fontSize: typoSize.titleSize,
    fontWeight: 'bold',
    textAlign: 'left',
    padding: padding.small,
  },
  searchBar: {
    color: palette.textPrimary,
    fontFamily: typoFamily.normal,
    fontSize: typoSize.headerSize,
    marginHorizontal: padding.large,
    width: '75%',
  },
  modal: {
    color: palette.white,
    fontFamily: typoFamily.normal,
    fontSize: typoSize.headerSize,
    fontWeight: 'bold',
    textAlign: 'left',
    padding: padding.medium,
    marginTop: padding.medium,
  },
});

/**
 * Dynamic carousel title styling with responsive margins
 *
 * @param length - Length value for calculating horizontal margins
 * @returns StyleSheet object with carousel title styling
 */
export const carouselStyle = (length: number) =>
  StyleSheet.create({
    carouselTitle: {
      color: palette.textPrimary,
      fontFamily: typoFamily.normal,
      fontSize: typoSize.paragraphSize,
      fontWeight: 'bold',
      textAlign: 'left',
      marginHorizontal: length / 2,
    },
  });

/**
 * Search bar component styling and layout
 * Provides consistent search interface across screens
 */
export const searchBarStyle = StyleSheet.create({
  searchBarView: {
    marginTop: padding.extraLarge,
    marginHorizontal: padding.medium,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    width: '95%',
  },
  searchBarComponent: {
    padding: padding.small,
    flexDirection: 'row',
    flex: 1,
    // width: "80%",
    backgroundColor: palette.textBackground,
    borderRadius: '20rem',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
});

/**
 * Text styling for row-based layouts
 * Provides left and right aligned text in two-column layouts
 */
export const rowTextStyle = StyleSheet.create({
  leftText: {
    textAlign: 'left',
    flex: 2,
    color: palette.textPrimary,
    fontFamily: typoFamily.normal,
    fontSize: typoSize.paragraphSize,
    fontWeight: 'normal',
  },
  rightText: {
    textAlign: 'right',
    flex: 1,
    color: palette.textPrimary,
    fontFamily: typoFamily.normal,
    fontSize: typoSize.paragraphSize,
    fontWeight: 'normal',
  },
});
