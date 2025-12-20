import { getDataset, getDatasetType } from '@utils/DatasetLoader';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@utils/i18n';
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
      const result = getDataset('en');

      expect(result.ingredients).toEqual(testIngredients);
      expect(result.tags).toEqual(testTags);
      expect(result.recipes).toEqual(testRecipes);
    });

    test('loads test dataset for French in development', () => {
      const result = getDataset('fr');

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
      const result = getDataset('en');

      expect(result.ingredients).toEqual(englishIngredients);
      expect(result.tags).toEqual(englishTags);
      expect(result.recipes).toEqual(englishRecipes);
    });

    test('loads French production dataset', () => {
      const result = getDataset('fr');

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
      const devResult = getDataset('en');

      expect(devResult.ingredients).toEqual(testIngredients);
      expect(devResult.tags).toEqual(testTags);
      expect(devResult.recipes).toEqual(testRecipes);

      (process.env as any).NODE_ENV = 'production';
      const prodResult = getDataset('en');

      expect(prodResult.ingredients).toEqual(englishIngredients);
      expect(prodResult.tags).toEqual(englishTags);
      expect(prodResult.recipes).toEqual(englishRecipes);
    });

    test('different languages in production return different content', () => {
      (process.env as any).NODE_ENV = 'production';
      const enResult = getDataset('en');

      expect(enResult.ingredients).toEqual(englishIngredients);
      expect(enResult.tags).toEqual(englishTags);
      expect(enResult.recipes).toEqual(englishRecipes);

      const frResult = getDataset('fr');

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

      const result = getDataset('en');
      expect(result.ingredients).toEqual(englishIngredients);
    });

    test('EXPO_PUBLIC_DATASET_TYPE=test overrides NODE_ENV', () => {
      (process.env as any).NODE_ENV = 'production';
      (process.env as any).EXPO_PUBLIC_DATASET_TYPE = 'test';

      expect(getDatasetType()).toBe('test');

      const result = getDataset('en');
      expect(result.ingredients).toEqual(testIngredients);
    });

    test('EXPO_PUBLIC_DATASET_TYPE=performance loads performance dataset', () => {
      (process.env as any).EXPO_PUBLIC_DATASET_TYPE = 'performance';

      expect(getDatasetType()).toBe('performance');

      const result = getDataset('en');
      expect(result.ingredients).toEqual(performanceIngredients);
      expect(result.tags).toEqual(performanceTags);
      expect(result.recipes).toEqual(performanceRecipes);
    });

    test('unknown EXPO_PUBLIC_DATASET_TYPE defaults to test', () => {
      (process.env as any).EXPO_PUBLIC_DATASET_TYPE = 'unknown';

      expect(getDatasetType()).toBe('test');

      const result = getDataset('en');
      expect(result.ingredients).toEqual(testIngredients);
    });
  });

  describe('performance dataset', () => {
    beforeEach(() => {
      (process.env as any).EXPO_PUBLIC_DATASET_TYPE = 'performance';
    });

    test('loads performance dataset regardless of language', () => {
      const enResult = getDataset('en');
      const frResult = getDataset('fr');

      expect(enResult.ingredients).toEqual(performanceIngredients);
      expect(frResult.ingredients).toEqual(performanceIngredients);
      expect(enResult).toEqual(frResult);
    });
  });

  describe('regression tests', () => {
    test('language code fr loads French dataset, not English (bug fix: was comparing against display names)', () => {
      (process.env as any).NODE_ENV = 'production';

      const frResult = getDataset('fr');

      expect(frResult.ingredients).not.toEqual(englishIngredients);
      expect(frResult.ingredients).toEqual(frenchIngredients);
      expect(frResult.tags).toEqual(frenchTags);
      expect(frResult.recipes).toEqual(frenchRecipes);
    });

    test('language code en loads English dataset correctly', () => {
      (process.env as any).NODE_ENV = 'production';

      const enResult = getDataset('en');

      expect(enResult.ingredients).not.toEqual(frenchIngredients);
      expect(enResult.ingredients).toEqual(englishIngredients);
      expect(enResult.tags).toEqual(englishTags);
      expect(enResult.recipes).toEqual(englishRecipes);
    });
  });

  describe('language configuration sync', () => {
    test('every SUPPORTED_LANGUAGES key has a working dataset loader', () => {
      (process.env as any).NODE_ENV = 'production';

      const languageCodes = Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[];

      languageCodes.forEach(code => {
        const dataset = getDataset(code);

        expect(dataset).toBeDefined();
        expect(dataset.ingredients).toBeDefined();
        expect(dataset.tags).toBeDefined();
        expect(dataset.recipes).toBeDefined();
        expect(Array.isArray(dataset.ingredients)).toBe(true);
        expect(Array.isArray(dataset.tags)).toBe(true);
        expect(Array.isArray(dataset.recipes)).toBe(true);
      });
    });

    test('every SUPPORTED_LANGUAGES entry has a name property', () => {
      const languageCodes = Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[];

      languageCodes.forEach(code => {
        expect(SUPPORTED_LANGUAGES[code].name).toBeDefined();
        expect(typeof SUPPORTED_LANGUAGES[code].name).toBe('string');
        expect(SUPPORTED_LANGUAGES[code].name.length).toBeGreaterThan(0);
      });
    });

    test('dataset returns valid structure with non-empty arrays in production', () => {
      (process.env as any).NODE_ENV = 'production';

      const languageCodes = Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[];

      languageCodes.forEach(code => {
        const dataset = getDataset(code);

        expect(dataset.ingredients.length).toBeGreaterThan(0);
        expect(dataset.tags.length).toBeGreaterThan(0);
        expect(dataset.recipes.length).toBeGreaterThan(0);
      });
    });
  });
});
