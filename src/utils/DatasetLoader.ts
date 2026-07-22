/**
 * Utilities for loading the appropriate seed dataset based on the runtime environment.
 *
 * Supports three dataset types — `production`, `performance`, and `test` — selected
 * via `EXPO_PUBLIC_DATASET_TYPE` or `NODE_ENV`. Production datasets are
 * language-specific; performance and test datasets are language-agnostic.
 *
 * @module DatasetLoader
 */

import { IngredientDraft, RecipeDraft, TagDraft } from '@customTypes/DatabaseElementTypes';
import { appLogger } from '@utils/logger';
import { DEFAULT_LANGUAGE, SupportedLanguage } from '@utils/i18n';

import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';

import { englishIngredients } from '@assets/datasets/en/ingredients';
import { englishTags } from '@assets/datasets/en/tags';
import { englishRecipes } from '@assets/datasets/en/recipes';
import { frenchIngredients } from '@assets/datasets/fr/ingredients';
import { frenchTags } from '@assets/datasets/fr/tags';
import { frenchRecipes } from '@assets/datasets/fr/recipes';
import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { performanceTags } from '@assets/datasets/performance/tags';
import { performanceRecipes } from '@assets/datasets/performance/recipes';

/**
 * A complete set of seed data for one dataset variant.
 */
export interface DatasetCollection {
  ingredients: IngredientDraft[];
  tags: TagDraft[];
  recipes: RecipeDraft[];
}

/**
 * Identifies which seed dataset is active.
 *
 * - `production` — localised real-world data, language-specific
 * - `performance` — large synthetic dataset for render benchmarks
 * - `test` — minimal fixture data used in unit and integration tests
 */
export type DatasetType = 'test' | 'production' | 'performance';

/**
 * Dataset loaders for each supported language.
 *
 * This record maps each language code to a function that loads its dataset.
 * TypeScript ensures this stays in sync with SupportedLanguage - if a new
 * language is added to SUPPORTED_LANGUAGES in i18n.ts, TypeScript will
 * error here until a loader is added.
 *
 * @example
 * // Adding a new language requires:
 * // 1. Add to SUPPORTED_LANGUAGES in i18n.ts
 * // 2. Add dataset files in @assets/datasets/{code}/
 * // 3. Add loader here - TypeScript will enforce this
 */
const datasetLoaders: Record<SupportedLanguage, () => DatasetCollection> = {
  en: () => ({
    ingredients: englishIngredients,
    tags: englishTags,
    recipes: englishRecipes,
  }),
  fr: () => ({
    ingredients: frenchIngredients,
    tags: frenchTags,
    recipes: frenchRecipes,
  }),
};

function loadTestDataset(): DatasetCollection {
  return {
    ingredients: testIngredients,
    tags: testTags,
    recipes: testRecipes,
  };
}

function loadPerformanceDataset(): DatasetCollection {
  return {
    ingredients: performanceIngredients,
    tags: performanceTags,
    recipes: performanceRecipes,
  };
}

function loadProductionDataset(language: SupportedLanguage): DatasetCollection {
  const loader = datasetLoaders[language] ?? datasetLoaders[DEFAULT_LANGUAGE];
  return loader();
}

/**
 * Determines the active dataset type from environment variables.
 *
 * `EXPO_PUBLIC_DATASET_TYPE` takes precedence over `NODE_ENV`. When neither
 * variable resolves to `'production'` or `'performance'`, returns `'test'`.
 *
 * @returns The resolved {@link DatasetType} for the current environment.
 *
 * @example
 * ```typescript
 * // EXPO_PUBLIC_DATASET_TYPE=production → 'production'
 * // NODE_ENV=production               → 'production'
 * // NODE_ENV=test                     → 'test'
 * const type = getDatasetType();
 * ```
 */
export function getDatasetType(): DatasetType {
  if (process.env.EXPO_PUBLIC_DATASET_TYPE !== undefined) {
    switch (process.env.EXPO_PUBLIC_DATASET_TYPE) {
      case 'production':
        return 'production';
      case 'performance':
        return 'performance';
      default:
        return 'test';
    }
  }
  return process.env.NODE_ENV === 'production' ? 'production' : 'test';
}

/**
 * Loads the seed dataset appropriate for the current environment and language.
 *
 * Resolves the dataset type via {@link getDatasetType}, then returns the
 * matching collection. On any load error, falls back to the test dataset and
 * logs the failure.
 *
 * @param language - The active app language; used to select the correct
 *   production dataset. Ignored for `test` and `performance` types.
 * @returns The resolved {@link DatasetCollection}.
 *
 * @example
 * ```typescript
 * const { ingredients, tags, recipes } = getDataset('fr');
 * await db.seedDatabase(ingredients, tags, recipes);
 * ```
 */
export function getDataset(language: SupportedLanguage): DatasetCollection {
  try {
    const datasetType = getDatasetType();
    let dataset: DatasetCollection;

    switch (datasetType) {
      case 'production':
        dataset = loadProductionDataset(language);
        break;
      case 'performance':
        dataset = loadPerformanceDataset();
        break;
      case 'test':
      default:
        dataset = loadTestDataset();
        break;
    }

    appLogger.info('Loaded dataset', {
      datasetType,
      expoPublicDatasetType: process.env.EXPO_PUBLIC_DATASET_TYPE,
      nodeEnv: process.env.NODE_ENV,
      language,
      ingredientsCount: dataset.ingredients.length,
      tagsCount: dataset.tags.length,
      recipesCount: dataset.recipes.length,
    });

    return dataset;
  } catch (error) {
    appLogger.error('Failed to load dataset, falling back to test data', {
      expoPublicDatasetType: process.env.EXPO_PUBLIC_DATASET_TYPE,
      nodeEnv: process.env.NODE_ENV,
      language,
      error,
    });
    return loadTestDataset();
  }
}
