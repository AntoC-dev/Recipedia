import {
  ingredientTableElement,
  recipeTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { appLogger } from '@utils/logger';
import { LANGUAGE_NAMES, SupportedLanguage } from '@utils/i18n';

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

export type DatasetType = 'test' | 'production' | 'performance';

export interface DatasetCollection {
  ingredients: ingredientTableElement[];
  tags: tagTableElement[];
  recipes: recipeTableElement[];
}

function loadTestDataset(): DatasetCollection {
  return {
    ingredients: testIngredients,
    tags: testTags,
    recipes: testRecipes,
  };
}

function loadEnglishDataset(): DatasetCollection {
  return {
    ingredients: englishIngredients,
    tags: englishTags,
    recipes: englishRecipes,
  };
}

function loadFrenchDataset(): DatasetCollection {
  return {
    ingredients: frenchIngredients,
    tags: frenchTags,
    recipes: frenchRecipes,
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
  switch (language) {
    case LANGUAGE_NAMES.fr:
      return loadFrenchDataset();
    case LANGUAGE_NAMES.en:
    default:
      return loadEnglishDataset();
  }
}

/**
 * Determines the current dataset type based on EXPO_PUBLIC_DATASET_TYPE or NODE_ENV
 *
 * Priority: EXPO_PUBLIC_DATASET_TYPE takes precedence if set, otherwise falls back to NODE_ENV
 *
 * @returns 'production' if the active variable is 'production', 'performance' for performance testing, otherwise 'test'
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
