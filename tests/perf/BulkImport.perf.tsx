import React from 'react';
import { measureRenders } from 'reassure';
import { BulkImportDiscovery } from '@screens/BulkImportDiscovery';
import { BulkImportValidation } from '@screens/BulkImportValidation';
import { BulkImportSettings } from '@screens/BulkImportSettings';
import RecipeDatabase from '@utils/RecipeDatabase';
import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { performanceTags } from '@assets/datasets/performance/tags';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import { resetMockRouteParams, setMockRouteParams } from '@mocks/deps/react-navigation-mock';
import {
  resetMockDiscoveryState,
  setMockDiscoveryState,
} from '@mocks/hooks/useDiscoveryWorkflow-mock';
import {
  ConvertedImportRecipe,
  DiscoveredRecipe,
  DiscoveryProgress,
  ParsingProgress,
} from '@customTypes/BulkImportTypes';

jest.mock('@react-navigation/native', () => {
  const { reactNavigationMock } = require('@mocks/deps/react-navigation-mock');
  return reactNavigationMock();
});
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@context/DefaultPersonsContext', () =>
  require('@mocks/context/DefaultPersonsContext-mock')
);
jest.mock('@hooks/useDiscoveryWorkflow', () => {
  const { useDiscoveryWorkflowMock } = require('@mocks/hooks/useDiscoveryWorkflow-mock');
  return { useDiscoveryWorkflow: useDiscoveryWorkflowMock };
});
jest.mock('@components/molecules/ValidationProgress', () =>
  require('@mocks/components/molecules/ValidationProgress-mock')
);

function generateMockRecipes(
  count: number,
  memoryStatus: 'fresh' | 'seen' = 'fresh'
): DiscoveredRecipe[] {
  return Array.from({ length: count }, (_, i) => ({
    url: `https://example.com/${memoryStatus}-recipe-${i + 1}`,
    title: `Performance Test Recipe ${i + 1}`,
    imageUrl: `https://example.com/img${i + 1}.jpg`,
    description: `A delicious recipe for performance testing number ${i + 1}`,
    memoryStatus,
  }));
}

function generateConvertedRecipes(count: number): ConvertedImportRecipe[] {
  return Array.from({ length: count }, (_, i) => ({
    title: `Imported Recipe ${i + 1}`,
    description: `Imported recipe description ${i + 1}`,
    imageUrl: `file:///cache/recipe-${i + 1}.jpg`,
    persons: 4,
    time: 30 + (i % 60),
    ingredients: [
      { name: `Unknown Ingredient ${i * 3 + 1}`, quantity: '100', unit: 'g' },
      { name: `Unknown Ingredient ${i * 3 + 2}`, quantity: '50', unit: 'ml' },
      { name: `Unknown Ingredient ${i * 3 + 3}`, quantity: '2', unit: 'piece' },
    ],
    tags: [{ name: `Unknown Tag ${i + 1}` }],
    preparation: [
      { title: 'Prep', description: `Prepare ingredients ${i + 1}` },
      { title: '', description: `Cook everything ${i + 1}` },
    ],
    sourceUrl: `https://example.com/recipe-${i + 1}`,
    sourceProvider: 'hellofresh',
  }));
}

function BulkImportSettingsWrapper() {
  return (
    <RecipeDatabaseProvider>
      <BulkImportSettings />
    </RecipeDatabaseProvider>
  );
}

function BulkImportDiscoveryWrapper() {
  return (
    <RecipeDatabaseProvider>
      <BulkImportDiscovery />
    </RecipeDatabaseProvider>
  );
}

function BulkImportValidationWrapper() {
  return (
    <RecipeDatabaseProvider>
      <BulkImportValidation />
    </RecipeDatabaseProvider>
  );
}

describe('BulkImportSettings Performance', () => {
  beforeEach(() => {
    resetMockRouteParams();
  });

  test('initial render with provider list', async () => {
    await measureRenders(<BulkImportSettingsWrapper />, { runs: 10 });
  });
});

describe('BulkImportDiscovery Performance', () => {
  beforeEach(() => {
    resetMockRouteParams();
    resetMockDiscoveryState();
    setMockRouteParams({ providerId: 'hellofresh' });
  });

  test('initial render in discovering phase', async () => {
    setMockDiscoveryState({
      phase: 'discovering',
      isDiscovering: true,
      showSelectionUI: true,
      freshRecipes: [],
      seenRecipes: [],
    });

    await measureRenders(<BulkImportDiscoveryWrapper />, { runs: 10 });
  });

  test('initial render with small recipe list (10 fresh recipes)', async () => {
    const freshRecipes = generateMockRecipes(10, 'fresh');
    setMockDiscoveryState({
      phase: 'selecting',
      isDiscovering: false,
      showSelectionUI: true,
      freshRecipes,
      seenRecipes: [],
      selectedCount: 0,
    });

    await measureRenders(<BulkImportDiscoveryWrapper />, { runs: 10 });
  });

  test('initial render with medium recipe list (30 fresh recipes)', async () => {
    const freshRecipes = generateMockRecipes(30, 'fresh');
    setMockDiscoveryState({
      phase: 'selecting',
      isDiscovering: false,
      showSelectionUI: true,
      freshRecipes,
      seenRecipes: [],
      selectedCount: 0,
    });

    await measureRenders(<BulkImportDiscoveryWrapper />, { runs: 10 });
  });

  test('initial render with large recipe list (50 fresh recipes)', async () => {
    const freshRecipes = generateMockRecipes(50, 'fresh');
    setMockDiscoveryState({
      phase: 'selecting',
      isDiscovering: false,
      showSelectionUI: true,
      freshRecipes,
      seenRecipes: [],
      selectedCount: 0,
    });

    await measureRenders(<BulkImportDiscoveryWrapper />, { runs: 10 });
  });

  test('initial render with very large recipe list (100 fresh recipes)', async () => {
    const freshRecipes = generateMockRecipes(100, 'fresh');
    setMockDiscoveryState({
      phase: 'selecting',
      isDiscovering: false,
      showSelectionUI: true,
      freshRecipes,
      seenRecipes: [],
      selectedCount: 0,
    });

    await measureRenders(<BulkImportDiscoveryWrapper />, { runs: 10 });
  });

  test('initial render with mixed fresh and seen recipes (30 fresh + 20 seen)', async () => {
    const freshRecipes = generateMockRecipes(30, 'fresh');
    const seenRecipes = generateMockRecipes(20, 'seen');
    setMockDiscoveryState({
      phase: 'selecting',
      isDiscovering: false,
      showSelectionUI: true,
      freshRecipes,
      seenRecipes,
      selectedCount: 0,
    });

    await measureRenders(<BulkImportDiscoveryWrapper />, { runs: 10 });
  });

  test('initial render with only seen recipes (50 seen)', async () => {
    const seenRecipes = generateMockRecipes(50, 'seen');
    setMockDiscoveryState({
      phase: 'selecting',
      isDiscovering: false,
      showSelectionUI: true,
      freshRecipes: [],
      seenRecipes,
      selectedCount: 0,
    });

    await measureRenders(<BulkImportDiscoveryWrapper />, { runs: 10 });
  });

  test('initial render with large mixed list (70 fresh + 30 seen)', async () => {
    const freshRecipes = generateMockRecipes(70, 'fresh');
    const seenRecipes = generateMockRecipes(30, 'seen');
    setMockDiscoveryState({
      phase: 'selecting',
      isDiscovering: false,
      showSelectionUI: true,
      freshRecipes,
      seenRecipes,
      selectedCount: 0,
    });

    await measureRenders(<BulkImportDiscoveryWrapper />, { runs: 10 });
  });

  test('initial render with all recipes selected', async () => {
    const freshRecipes = generateMockRecipes(50, 'fresh');
    setMockDiscoveryState({
      phase: 'selecting',
      isDiscovering: false,
      showSelectionUI: true,
      freshRecipes,
      seenRecipes: [],
      selectedCount: 50,
      allSelected: true,
    });

    await measureRenders(<BulkImportDiscoveryWrapper />, { runs: 10 });
  });

  test('initial render during discovery with progress', async () => {
    const freshRecipes = generateMockRecipes(20, 'fresh');
    const discoveryProgress: DiscoveryProgress = {
      phase: 'discovering',
      recipesFound: 20,
      categoriesScanned: 3,
      totalCategories: 10,
      isComplete: false,
      recipes: freshRecipes,
    };

    setMockDiscoveryState({
      phase: 'discovering',
      isDiscovering: true,
      showSelectionUI: true,
      freshRecipes,
      seenRecipes: [],
      discoveryProgress,
    });

    await measureRenders(<BulkImportDiscoveryWrapper />, { runs: 10 });
  });

  test('initial render in parsing phase with progress', async () => {
    const parsingProgress: ParsingProgress = {
      phase: 'parsing',
      current: 5,
      total: 20,
      currentRecipeTitle: 'Recipe 5',
      parsedRecipes: [],
      failedRecipes: [],
    };

    setMockDiscoveryState({
      phase: 'parsing',
      isDiscovering: false,
      showSelectionUI: false,
      freshRecipes: generateMockRecipes(20, 'fresh'),
      seenRecipes: [],
      parsingProgress,
    });

    await measureRenders(<BulkImportDiscoveryWrapper />, { runs: 10 });
  });

  test('initial render with discovery error', async () => {
    setMockDiscoveryState({
      phase: 'selecting',
      isDiscovering: false,
      showSelectionUI: true,
      freshRecipes: generateMockRecipes(5, 'fresh'),
      seenRecipes: [],
      error: 'Network error: Unable to fetch recipes',
    });

    await measureRenders(<BulkImportDiscoveryWrapper />, { runs: 10 });
  });
});

describe('BulkImportValidation Performance', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    resetMockRouteParams();
    await database.init();
    await database.addMultipleIngredients(performanceIngredients);
    await database.addMultipleTags(performanceTags);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render with single recipe to validate', async () => {
    const recipes = generateConvertedRecipes(1);
    setMockRouteParams({ providerId: 'hellofresh', selectedRecipes: recipes });

    await measureRenders(<BulkImportValidationWrapper />, { runs: 10 });
  });

  test('initial render with multiple recipes (5) to validate', async () => {
    const recipes = generateConvertedRecipes(5);
    setMockRouteParams({ providerId: 'hellofresh', selectedRecipes: recipes });

    await measureRenders(<BulkImportValidationWrapper />, { runs: 10 });
  });

  test('initial render with many recipes (10) to validate', async () => {
    const recipes = generateConvertedRecipes(10);
    setMockRouteParams({ providerId: 'hellofresh', selectedRecipes: recipes });

    await measureRenders(<BulkImportValidationWrapper />, { runs: 10 });
  });

  test('initial render with many unknown tags (15+)', async () => {
    const recipes: ConvertedImportRecipe[] = [
      {
        title: 'Recipe with Many Tags',
        description: 'Test recipe',
        imageUrl: 'file:///cache/recipe.jpg',
        persons: 4,
        time: 30,
        ingredients: [{ name: performanceIngredients[0].name, quantity: '100', unit: 'g' }],
        tags: Array.from({ length: 20 }, (_, i) => ({
          name: `Completely Unknown Tag ${i + 1}`,
        })),
        preparation: [{ title: '', description: 'Cook' }],
        sourceUrl: 'https://example.com/recipe',
        sourceProvider: 'hellofresh',
      },
    ];
    setMockRouteParams({ providerId: 'hellofresh', selectedRecipes: recipes });

    await measureRenders(<BulkImportValidationWrapper />, { runs: 10 });
  });

  test('initial render with many unknown ingredients (25+)', async () => {
    const recipes: ConvertedImportRecipe[] = [
      {
        title: 'Recipe with Many Ingredients',
        description: 'Test recipe',
        imageUrl: 'file:///cache/recipe.jpg',
        persons: 4,
        time: 30,
        ingredients: Array.from({ length: 30 }, (_, i) => ({
          name: `Completely Unknown Ingredient ${i + 1}`,
          quantity: String(50 + i * 5),
          unit: ['g', 'ml', 'piece', 'tbsp', 'tsp'][i % 5],
        })),
        tags: [],
        preparation: [{ title: '', description: 'Cook' }],
        sourceUrl: 'https://example.com/recipe',
        sourceProvider: 'hellofresh',
      },
    ];
    setMockRouteParams({ providerId: 'hellofresh', selectedRecipes: recipes });

    await measureRenders(<BulkImportValidationWrapper />, { runs: 10 });
  });

  test('initial render with recipes having similar ingredient names', async () => {
    const existingIngNames = performanceIngredients.slice(0, 10).map(i => i.name);
    const recipes: ConvertedImportRecipe[] = [
      {
        title: 'Recipe with Similar Ingredients',
        description: 'Test recipe',
        imageUrl: 'file:///cache/recipe.jpg',
        persons: 4,
        time: 30,
        ingredients: existingIngNames.map(name => ({
          name: name.substring(0, 4) + ' fresh organic',
          quantity: '100',
          unit: 'g',
        })),
        tags: [],
        preparation: [{ title: '', description: 'Cook' }],
        sourceUrl: 'https://example.com/recipe',
        sourceProvider: 'hellofresh',
      },
    ];
    setMockRouteParams({ providerId: 'hellofresh', selectedRecipes: recipes });

    await measureRenders(<BulkImportValidationWrapper />, { runs: 10 });
  });

  test('initial render with recipes having similar tag names', async () => {
    const existingTagNames = performanceTags.slice(0, 10).map(t => t.name);
    const recipes: ConvertedImportRecipe[] = [
      {
        title: 'Recipe with Similar Tags',
        description: 'Test recipe',
        imageUrl: 'file:///cache/recipe.jpg',
        persons: 4,
        time: 30,
        ingredients: [{ name: performanceIngredients[0].name, quantity: '100', unit: 'g' }],
        tags: existingTagNames.map(name => ({
          name: name.substring(0, 4) + ' variation',
        })),
        preparation: [{ title: '', description: 'Cook' }],
        sourceUrl: 'https://example.com/recipe',
        sourceProvider: 'hellofresh',
      },
    ];
    setMockRouteParams({ providerId: 'hellofresh', selectedRecipes: recipes });

    await measureRenders(<BulkImportValidationWrapper />, { runs: 10 });
  });

  test('initial render with large batch (15 recipes, many items)', async () => {
    const recipes = generateConvertedRecipes(15);
    setMockRouteParams({ providerId: 'hellofresh', selectedRecipes: recipes });

    await measureRenders(<BulkImportValidationWrapper />, { runs: 10 });
  });

  test('initial render with recipes containing nutrition data', async () => {
    const recipes: ConvertedImportRecipe[] = Array.from({ length: 5 }, (_, i) => ({
      title: `Recipe with Nutrition ${i + 1}`,
      description: `Test recipe ${i + 1}`,
      imageUrl: `file:///cache/recipe-${i}.jpg`,
      persons: 4,
      time: 30,
      ingredients: [{ name: `Unknown Nutrition Ingredient ${i}`, quantity: '100', unit: 'g' }],
      tags: [],
      preparation: [{ title: '', description: 'Cook' }],
      sourceUrl: `https://example.com/recipe-${i}`,
      sourceProvider: 'hellofresh',
      nutrition: {
        energyKcal: 450 + i * 50,
        energyKj: 1880 + i * 200,
        fat: 22 + i,
        saturatedFat: 8 + i,
        carbohydrates: 45 + i * 5,
        sugars: 12 + i,
        fiber: 5 + i,
        protein: 18 + i * 2,
        salt: 1.2 + i * 0.1,
        portionWeight: 100 + i * 10,
      },
    }));
    setMockRouteParams({ providerId: 'hellofresh', selectedRecipes: recipes });

    await measureRenders(<BulkImportValidationWrapper />, { runs: 10 });
  });

  test('initial render with mixed known and unknown items', async () => {
    const knownIngNames = performanceIngredients.slice(0, 5).map(i => i.name);
    const knownTagNames = performanceTags.slice(0, 3).map(t => t.name);

    const recipes: ConvertedImportRecipe[] = [
      {
        title: 'Recipe with Mixed Items',
        description: 'Test recipe',
        imageUrl: 'file:///cache/recipe.jpg',
        persons: 4,
        time: 30,
        ingredients: [
          ...knownIngNames.map(name => ({ name, quantity: '100', unit: 'g' })),
          ...Array.from({ length: 10 }, (_, i) => ({
            name: `Brand New Ingredient ${i + 1}`,
            quantity: '50',
            unit: 'g',
          })),
        ],
        tags: [
          ...knownTagNames.map(name => ({ name })),
          ...Array.from({ length: 5 }, (_, i) => ({
            name: `Brand New Tag ${i + 1}`,
          })),
        ],
        preparation: [{ title: '', description: 'Cook' }],
        sourceUrl: 'https://example.com/recipe',
        sourceProvider: 'hellofresh',
      },
    ];
    setMockRouteParams({ providerId: 'hellofresh', selectedRecipes: recipes });

    await measureRenders(<BulkImportValidationWrapper />, { runs: 10 });
  });
});
