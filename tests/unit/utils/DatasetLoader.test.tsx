import { getDataset, getDatasetType } from '@utils/DatasetLoader';
import { LANGUAGE_NAMES } from '@utils/i18n';
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

describe('DatasetLoader Utility', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalExpoDatasetType = process.env.EXPO_PUBLIC_DATASET_TYPE;

  beforeEach(() => {
    jest.clearAllMocks();
    delete (process.env as any).EXPO_PUBLIC_DATASET_TYPE;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      (process.env as any).NODE_ENV = originalEnv;
    } else {
      delete (process.env as any).NODE_ENV;
    }
    if (originalExpoDatasetType !== undefined) {
      (process.env as any).EXPO_PUBLIC_DATASET_TYPE = originalExpoDatasetType;
    } else {
      delete (process.env as any).EXPO_PUBLIC_DATASET_TYPE;
    }
  });

  describe('development environment', () => {
    beforeEach(() => {
      (process.env as any).NODE_ENV = 'development';
    });

    test('loads test dataset for English in development', () => {
      const result = getDataset(LANGUAGE_NAMES.en);

      expect(result.ingredients).toEqual(testIngredients);
      expect(result.tags).toEqual(testTags);
      expect(result.recipes).toEqual(testRecipes);
    });

    test('loads test dataset for French in development', () => {
      const result = getDataset(LANGUAGE_NAMES.fr);

      expect(result.ingredients).toEqual(testIngredients);
      expect(result.tags).toEqual(testTags);
      expect(result.recipes).toEqual(testRecipes);
    });

    test('loads test dataset for any language in development', () => {
      const result = getDataset('unknown' as any);

      expect(result.ingredients).toEqual(testIngredients);
      expect(result.tags).toEqual(testTags);
      expect(result.recipes).toEqual(testRecipes);
    });
  });

  describe('production environment', () => {
    beforeEach(() => {
      (process.env as any).NODE_ENV = 'production';
    });

    test('loads English production dataset', () => {
      const result = getDataset(LANGUAGE_NAMES.en);

      expect(result.ingredients).toEqual(englishIngredients);
      expect(result.tags).toEqual(englishTags);
      expect(result.recipes).toEqual(englishRecipes);
    });

    test('loads French production dataset', () => {
      const result = getDataset(LANGUAGE_NAMES.fr);

      expect(result.ingredients).toEqual(frenchIngredients);
      expect(result.tags).toEqual(frenchTags);
      expect(result.recipes).toEqual(frenchRecipes);
    });

    test('defaults to English dataset for unknown language', () => {
      const result = getDataset('unknown' as any);

      expect(result.ingredients).toEqual(englishIngredients);
      expect(result.tags).toEqual(englishTags);
      expect(result.recipes).toEqual(englishRecipes);
    });
  });

  describe('dataset content verification', () => {
    test('different environments return appropriate datasets', () => {
      (process.env as any).NODE_ENV = 'development';
      const devResult = getDataset(LANGUAGE_NAMES.en);

      expect(devResult.ingredients).toEqual(testIngredients);
      expect(devResult.tags).toEqual(testTags);
      expect(devResult.recipes).toEqual(testRecipes);

      (process.env as any).NODE_ENV = 'production';
      const prodResult = getDataset(LANGUAGE_NAMES.en);

      expect(prodResult.ingredients).toEqual(englishIngredients);
      expect(prodResult.tags).toEqual(englishTags);
      expect(prodResult.recipes).toEqual(englishRecipes);
    });

    test('different languages in production return different content', () => {
      (process.env as any).NODE_ENV = 'production';
      const enResult = getDataset(LANGUAGE_NAMES.en);

      expect(enResult.ingredients).toEqual(englishIngredients);
      expect(enResult.tags).toEqual(englishTags);
      expect(enResult.recipes).toEqual(englishRecipes);

      const frResult = getDataset(LANGUAGE_NAMES.fr);

      expect(frResult.ingredients).toEqual(frenchIngredients);
      expect(frResult.tags).toEqual(frenchTags);
      expect(frResult.recipes).toEqual(frenchRecipes);
    });
  });

  describe('getDatasetType', () => {
    test('returns test when NODE_ENV is development', () => {
      (process.env as any).NODE_ENV = 'development';

      expect(getDatasetType()).toBe('test');
    });

    test('returns production when NODE_ENV is production', () => {
      (process.env as any).NODE_ENV = 'production';

      expect(getDatasetType()).toBe('production');
    });

    test('returns test when NODE_ENV is test', () => {
      (process.env as any).NODE_ENV = 'test';

      expect(getDatasetType()).toBe('test');
    });
  });

  describe('EXPO_PUBLIC_DATASET_TYPE override', () => {
    test('EXPO_PUBLIC_DATASET_TYPE=production overrides NODE_ENV', () => {
      (process.env as any).NODE_ENV = 'development';
      (process.env as any).EXPO_PUBLIC_DATASET_TYPE = 'production';

      expect(getDatasetType()).toBe('production');

      const result = getDataset(LANGUAGE_NAMES.en);
      expect(result.ingredients).toEqual(englishIngredients);
    });

    test('EXPO_PUBLIC_DATASET_TYPE=test overrides NODE_ENV', () => {
      (process.env as any).NODE_ENV = 'production';
      (process.env as any).EXPO_PUBLIC_DATASET_TYPE = 'test';

      expect(getDatasetType()).toBe('test');

      const result = getDataset(LANGUAGE_NAMES.en);
      expect(result.ingredients).toEqual(testIngredients);
    });

    test('EXPO_PUBLIC_DATASET_TYPE=performance loads performance dataset', () => {
      (process.env as any).EXPO_PUBLIC_DATASET_TYPE = 'performance';

      expect(getDatasetType()).toBe('performance');

      const result = getDataset(LANGUAGE_NAMES.en);
      expect(result.ingredients).toEqual(performanceIngredients);
      expect(result.tags).toEqual(performanceTags);
      expect(result.recipes).toEqual(performanceRecipes);
    });

    test('unknown EXPO_PUBLIC_DATASET_TYPE defaults to test', () => {
      (process.env as any).EXPO_PUBLIC_DATASET_TYPE = 'unknown';

      expect(getDatasetType()).toBe('test');

      const result = getDataset(LANGUAGE_NAMES.en);
      expect(result.ingredients).toEqual(testIngredients);
    });
  });

  describe('performance dataset', () => {
    beforeEach(() => {
      (process.env as any).EXPO_PUBLIC_DATASET_TYPE = 'performance';
    });

    test('loads performance dataset regardless of language', () => {
      const enResult = getDataset(LANGUAGE_NAMES.en);
      const frResult = getDataset(LANGUAGE_NAMES.fr);

      expect(enResult.ingredients).toEqual(performanceIngredients);
      expect(frResult.ingredients).toEqual(performanceIngredients);
      expect(enResult).toEqual(frResult);
    });
  });
});
