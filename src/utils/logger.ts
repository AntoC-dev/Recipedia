/**
 * Logger - Centralized logging system with category-specific loggers
 *
 * This module provides a comprehensive logging system built on react-native-logs
 * with different log levels, colored output, and category-specific loggers for
 * better debugging and monitoring of different app modules.
 *
 * Key Features:
 * - Development vs Production logging levels
 * - Color-coded log levels for better readability
 * - Category-specific loggers for organized debugging
 * - Async logging for better performance
 * - Timestamped log entries
 * - Centralized configuration
 *
 * Log Levels:
 * - debug: Detailed information for debugging (dev only)
 * - info: General information about app operation
 * - warn: Warning messages for potential issues
 * - error: Error messages for actual problems
 *
 * @example
 * ```typescript
 * import { databaseLogger, uiLogger } from '@utils/logger';
 *
 * // Database operations
 * databaseLogger.info('Recipe added successfully', { recipeId: 123 });
 * databaseLogger.error('Database connection failed', { error });
 *
 * // UI interactions
 * uiLogger.debug('User pressed button', { buttonId: 'save-recipe' });
 * uiLogger.warn('Form validation failed', { errors });
 * ```
 */

import { consoleTransport, logger } from 'react-native-logs';

/**
 * Main logger configuration
 *
 * Configures different behavior for development and production:
 * - Development: debug level, console output, colored logs
 * - Production: error level only, no console output
 */
const log = logger.createLogger({
  severity: __DEV__ ? 'debug' : 'error',
  transport: __DEV__ ? consoleTransport : undefined,
  transportOptions: {
    colors: {
      info: 'blueBright',
      warn: 'yellowBright',
      error: 'redBright',
      debug: 'cyan',
    },
  },
  async: true,
  dateFormat: 'time',
  printLevel: true,
  printDate: true,
  enabled: true,
  enabledExtensions: [
    'Database',
    'FileSystem',
    'OCR',
    'Scraper',
    'ScrapedRecipe',
    'UI',
    'Home',
    'Recipe',
    'Search',
    'Shopping',
    'Parameters',
    'IngredientsSettings',
    'TagsSettings',
    'LanguageSettings',
    'DefaultPersonsSettings',
    'Settings',
    'Validation',
    'Navigation',
    'App',
    'Tutorial',
    'BulkImport',
    'Ads',
  ],
});

/* UTILITY LOGGERS - For backend services and utilities */

/** Logger for database operations, queries, and data management */
export const databaseLogger = log.extend('Database');

/** Logger for file system operations, image storage, and asset management */
export const fileSystemLogger = log.extend('FileSystem');

/** Logger for OCR text recognition and image processing */
export const ocrLogger = log.extend('OCR');

/** Logger for recipe scraper operations */
export const scraperLogger = log.extend('Scraper');

/** Logger for scraped recipe validation and processing */
export const scrapedRecipeLogger = log.extend('ScrapedRecipe');

/** Logger for general UI interactions and component behavior */
export const uiLogger = log.extend('UI');

/* SCREEN LOGGERS - For specific app screens and their functionality */

/** Logger for Home screen activities and recipe recommendations */
export const homeLogger = log.extend('Home');

/** Logger for Recipe screen, recipe creation, editing, and viewing */
export const recipeLogger = log.extend('Recipe');

/** Logger for Search screen, filtering, and recipe discovery */
export const searchLogger = log.extend('Search');

/** Logger for Shopping list functionality and ingredient management */
export const shoppingLogger = log.extend('Shopping');

/** Logger for main Parameters/Settings screen */
export const parametersLogger = log.extend('Parameters');

/* SETTINGS LOGGERS - For specific settings screens */

/** Logger for ingredients settings management */
export const ingredientsSettingsLogger = log.extend('IngredientsSettings');

/** Logger for tags settings management */
export const tagsSettingsLogger = log.extend('TagsSettings');

/** Logger for language settings and internationalization */
export const languageSettingsLogger = log.extend('LanguageSettings');

/** Logger for default persons count settings */
export const defaultPersonsSettingsLogger = log.extend('DefaultPersonsSettings');

/** Logger for general settings operations */
export const settingsLogger = log.extend('Settings');

/* SYSTEM LOGGERS - For app-wide concerns */

/** Logger for data validation and type checking */
export const validationLogger = log.extend('Validation');

/** Logger for navigation events and routing */
export const navigationLogger = log.extend('Navigation');

/** Logger for app-level events, startup, and lifecycle */
export const appLogger = log.extend('App');

/** Logger for tutorial system events and step management */
export const tutorialLogger = log.extend('Tutorial');

/** Logger for bulk recipe import operations */
export const bulkImportLogger = log.extend('BulkImport');

/** Logger for ad-related operations and consent management */
export const adLogger = log.extend('Ads');

/**
 * Default export providing organized access to all loggers
 *
 * @example
 * ```typescript
 * import loggers from '@utils/logger';
 *
 * loggers.database.info('Database initialized');
 * loggers.ui.debug('Button clicked');
 * ```
 */
export default {
  database: databaseLogger,
  filesystem: fileSystemLogger,
  ocr: ocrLogger,
  scraper: scraperLogger,
  scrapedRecipe: scrapedRecipeLogger,
  ui: uiLogger,
  home: homeLogger,
  recipe: recipeLogger,
  search: searchLogger,
  shopping: shoppingLogger,
  parameters: parametersLogger,
  ingredientsSettings: ingredientsSettingsLogger,
  tagsSettings: tagsSettingsLogger,
  languageSettings: languageSettingsLogger,
  defaultPersonsSettings: defaultPersonsSettingsLogger,
  settings: settingsLogger,
  validation: validationLogger,
  navigation: navigationLogger,
  app: appLogger,
  tutorial: tutorialLogger,
  bulkImport: bulkImportLogger,
  ads: adLogger,
};
