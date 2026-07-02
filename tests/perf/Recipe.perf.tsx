import React from 'react';
import { measureRenders } from 'reassure';
import { RecipeView } from '@screens/recipe/RecipeView';
import { RecipeEdit } from '@screens/recipe/RecipeEdit';
import { RecipeAddManual } from '@screens/recipe/RecipeAddManual';
import { RecipeAddOcr } from '@screens/recipe/RecipeAddOcr';
import { RecipeAddScrape } from '@screens/recipe/RecipeAddScrape';
import RecipeDatabase from '@utils/RecipeDatabase';
import { performanceRecipes } from '@assets/datasets/performance/recipes';
import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { performanceTags } from '@assets/datasets/performance/tags';
import { SeasonFilterProvider } from '@context/SeasonFilterContext';
import { DefaultPersonsProvider } from '@context/DefaultPersonsContext';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { ScrapedRecipeData } from '@customTypes/RecipeNavigationTypes';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StackScreenParamList } from '@customTypes/ScreenTypes';
import { HEAVY_WARMUP } from './perfOptions';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const baseNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  setOptions: jest.fn(),
};

function navFor<R extends keyof StackScreenParamList>() {
  return baseNavigation as unknown as NativeStackNavigationProp<StackScreenParamList, R>;
}

function routeFor<R extends keyof StackScreenParamList>(
  name: R,
  params: StackScreenParamList[R]
): { key: string; name: R; params: StackScreenParamList[R] } {
  return { key: `${name}-perf`, name, params };
}

function ViewWrapper({ recipe }: { recipe: recipeTableElement }) {
  return (
    <DefaultPersonsProvider>
      <SeasonFilterProvider>
        <RecipeView
          route={routeFor('RecipeView', { recipe })}
          navigation={navFor<'RecipeView'>()}
        />
      </SeasonFilterProvider>
    </DefaultPersonsProvider>
  );
}

function EditWrapper({ recipe }: { recipe: recipeTableElement }) {
  return (
    <DefaultPersonsProvider>
      <SeasonFilterProvider>
        <RecipeEdit
          route={routeFor('RecipeEdit', { recipe })}
          navigation={navFor<'RecipeEdit'>()}
        />
      </SeasonFilterProvider>
    </DefaultPersonsProvider>
  );
}

function AddManualWrapper() {
  return (
    <DefaultPersonsProvider>
      <SeasonFilterProvider>
        <RecipeAddManual
          route={routeFor('RecipeAddManual', undefined as unknown as undefined)}
          navigation={navFor<'RecipeAddManual'>()}
        />
      </SeasonFilterProvider>
    </DefaultPersonsProvider>
  );
}

function AddOcrWrapper({ imgUri }: { imgUri: string }) {
  return (
    <DefaultPersonsProvider>
      <SeasonFilterProvider>
        <RecipeAddOcr
          route={routeFor('RecipeAddOcr', { imgUri })}
          navigation={navFor<'RecipeAddOcr'>()}
        />
      </SeasonFilterProvider>
    </DefaultPersonsProvider>
  );
}

function AddScrapeWrapper({
  scrapedData,
  sourceUrl,
}: {
  scrapedData: ScrapedRecipeData;
  sourceUrl: string;
}) {
  return (
    <DefaultPersonsProvider>
      <SeasonFilterProvider>
        <RecipeAddScrape
          route={routeFor('RecipeAddScrape', { scrapedData, sourceUrl })}
          navigation={navFor<'RecipeAddScrape'>()}
        />
      </SeasonFilterProvider>
    </DefaultPersonsProvider>
  );
}

const testRecipe: recipeTableElement = {
  id: 1,
  title: 'Performance Test Recipe',
  description: 'A test recipe for performance testing',
  ingredients: performanceIngredients.slice(0, 5).map((ing, index) => ({
    ...ing,
    id: index + 1,
    quantity: '100',
  })),
  tags: performanceTags.slice(0, 3),
  preparation: [
    { title: 'Step 1', description: 'Mix ingredients together' },
    { title: 'Step 2', description: 'Cook for 30 minutes' },
    { title: 'Step 3', description: 'Serve hot' },
  ],
  time: 30,
  persons: 4,
  season: [],
  image_Source: '',
};

describe('Recipe Screen Performance', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    await database.init();
    await database.addMultipleIngredients(performanceIngredients);
    await database.addMultipleTags(performanceTags);
    await database.addMultipleRecipes(performanceRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render in read-only mode', async () => {
    await measureRenders(<ViewWrapper recipe={testRecipe} />, { runs: 10 });
  });

  test('initial render in edit mode', async () => {
    await measureRenders(<EditWrapper recipe={testRecipe} />, { runs: 10, ...HEAVY_WARMUP });
  });

  test('initial render in add manually mode', async () => {
    await measureRenders(<AddManualWrapper />, { runs: 10 });
  });

  test('re-render after adding recipe to menu', async () => {
    const scenario = async () => {
      await database.addRecipeToMenu(testRecipe);
    };
    await measureRenders(<ViewWrapper recipe={testRecipe} />, { runs: 10, scenario });
  });

  test('re-render with recipe having many ingredients', async () => {
    const recipeWithManyIngredients: recipeTableElement = {
      ...testRecipe,
      ingredients: performanceIngredients.slice(0, 30).map((ing, index) => ({
        ...ing,
        id: index + 1,
        quantity: '100',
      })),
    };
    await measureRenders(<ViewWrapper recipe={recipeWithManyIngredients} />, { runs: 10 });
  });

  test('re-render with recipe having many preparation steps', async () => {
    const recipeWithManySteps: recipeTableElement = {
      ...testRecipe,
      preparation: Array.from({ length: 20 }, (_, i) => ({
        title: `Step ${i + 1}`,
        description: `Description for step ${i + 1} with detailed instructions`,
      })),
    };
    await measureRenders(<ViewWrapper recipe={recipeWithManySteps} />, { runs: 10 });
  });

  test('initial render in addFromScrape mode with large scraped data', async () => {
    const scrapedData: ScrapedRecipeData = {
      title: 'Scraped Recipe with Many Ingredients',
      description: 'A complex recipe scraped from the web with lots of data',
      image_Source: 'https://example.com/recipe-image.jpg',
      persons: 6,
      time: 90,
      ingredients: performanceIngredients.slice(0, 25).map(ing => ({
        name: ing.name,
        quantity: '150',
        unit: ing.unit,
      })),
      preparation: Array.from({ length: 15 }, (_, i) => ({
        title: i === 0 ? 'Preparation' : i === 5 ? 'Cooking' : i === 10 ? 'Assembly' : '',
        description: `Step ${i + 1}: Detailed instruction for this step of the recipe preparation.`,
      })),
      tags: performanceTags.slice(0, 8),
      nutrition: {
        energyKcal: 450,
        energyKj: 1880,
        fat: 22,
        saturatedFat: 8,
        carbohydrates: 45,
        sugars: 12,
        fiber: 5,
        protein: 18,
        salt: 1.2,
        portionWeight: 100,
      },
    };
    await measureRenders(
      <AddScrapeWrapper scrapedData={scrapedData} sourceUrl='https://example.com/recipe' />,
      { runs: 10, ...HEAVY_WARMUP }
    );
  }, 30000);

  test('initial render in addFromPic (OCR) mode', async () => {
    await measureRenders(<AddOcrWrapper imgUri='file:///mock/path/to/recipe-image.jpg' />, {
      runs: 10,
    });
  });

  test('re-render with full nutrition data', async () => {
    const recipeWithNutrition: recipeTableElement = {
      ...testRecipe,
      nutrition: {
        energyKcal: 350,
        energyKj: 1465,
        fat: 15,
        saturatedFat: 5,
        carbohydrates: 40,
        sugars: 8,
        fiber: 6,
        protein: 12,
        salt: 0.8,
        portionWeight: 150,
      },
    };
    await measureRenders(<ViewWrapper recipe={recipeWithNutrition} />, { runs: 10 });
  });

  test('re-render with recipe containing all optional fields', async () => {
    const fullRecipe: recipeTableElement = {
      id: 999,
      title: 'Complete Recipe with All Fields',
      description: 'A comprehensive recipe with every possible field populated for stress testing',
      image_Source: 'https://example.com/full-recipe.jpg',
      persons: 6,
      time: 120,
      ingredients: performanceIngredients.slice(0, 20).map((ing, index) => ({
        ...ing,
        id: index + 1,
        quantity: String(50 + index * 10),
        season: ['1', '2', '3', '4'],
      })),
      tags: performanceTags.slice(0, 10),
      preparation: Array.from({ length: 12 }, (_, i) => ({
        title: i % 4 === 0 ? `Section ${Math.floor(i / 4) + 1}` : '',
        description: `Step ${i + 1}: Detailed instructions with multiple sentences. This step requires careful attention to detail and proper technique.`,
      })),
      season: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      nutrition: {
        energyKcal: 520,
        energyKj: 2175,
        fat: 28,
        saturatedFat: 12,
        carbohydrates: 55,
        sugars: 15,
        fiber: 8,
        protein: 22,
        salt: 1.5,
        portionWeight: 200,
      },
    };
    await measureRenders(<ViewWrapper recipe={fullRecipe} />, { runs: 10 });
  });
});
