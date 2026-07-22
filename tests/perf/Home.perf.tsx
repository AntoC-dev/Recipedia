import React, { useEffect } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { measureRenders } from 'reassure';
import Home from '@screens/Home';
import { RefreshControl } from 'react-native';
import { ingredientType, recipeTableElement } from '@customTypes/DatabaseElementTypes';
import RecipeDatabase from '@utils/RecipeDatabase';
import { performanceRecipes } from '@assets/datasets/performance/recipes';
import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { performanceTags } from '@assets/datasets/performance/tags';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import {
  SeasonFilterContextType,
  SeasonFilterProvider,
  useSeasonFilter,
} from '@context/SeasonFilterContext';
import { DefaultPersonsProvider } from '@context/DefaultPersonsContext';
import { HEAVY_WARMUP } from './perfOptions';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const Stack = createStackNavigator();

let seasonContextRef: SeasonFilterContextType | null = null;

function ContextCapture() {
  const seasonContext = useSeasonFilter();
  useEffect(() => {
    seasonContextRef = seasonContext;
  }, [seasonContext]);
  return null;
}

function HomeWrapper() {
  return (
    <DefaultPersonsProvider>
      <SeasonFilterProvider>
        <ContextCapture />
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name='Home' component={Home} />
          </Stack.Navigator>
        </NavigationContainer>
      </SeasonFilterProvider>
    </DefaultPersonsProvider>
  );
}

const testRecipe: recipeTableElement = {
  id: 1,
  title: 'Performance Test Recipe',
  description: 'A test recipe for performance testing',
  ingredients: [],
  tags: [],
  preparation: [{ title: 'Step 1', description: 'Do something' }],
  time: 30,
  persons: 4,
  season: [],
  image_Source: '',
};

describe('Home Screen Performance', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    seasonContextRef = null;
    await database.init();
    await database.addMultipleIngredients(performanceIngredients);
    await database.addMultipleTags(performanceTags);
    await database.addMultipleRecipes(performanceRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render with 1200 recipes', async () => {
    await measureRenders(<HomeWrapper />, { runs: 10 });
  });

  test('re-render after adding recipe via hook', async () => {
    const scenario = async () => {
      await database.addRecipe({ ...testRecipe, title: `New Recipe ${Date.now()}` });
    };

    await measureRenders(<HomeWrapper />, { runs: 10, scenario });
  });

  test('re-render after deleting recipe via hook', async () => {
    const scenario = async () => {
      const recipes = database.get_recipes();
      if (recipes.length > 0) {
        await database.deleteRecipe(recipes[0]!);
      }
    };

    await measureRenders(<HomeWrapper />, { runs: 10, scenario });
  });

  test('re-render after pull-to-refresh', async () => {
    const scenario = async () => {
      const refreshControl = await waitFor(() => screen.UNSAFE_getByType(RefreshControl));
      fireEvent(refreshControl, 'refresh');
    };

    await measureRenders(<HomeWrapper />, { runs: 10, ...HEAVY_WARMUP, scenario });
  });

  test('re-render after toggling season filter on', async () => {
    const scenario = async () => {
      if (seasonContextRef) {
        seasonContextRef.setSeasonFilter();
      }
    };

    await measureRenders(<HomeWrapper />, { runs: 10, scenario });
  });

  test('re-render after toggling season filter off', async () => {
    if (seasonContextRef) {
      seasonContextRef.setSeasonFilter();
    }

    const scenario = async () => {
      if (seasonContextRef) {
        seasonContextRef.setSeasonFilter();
      }
    };

    await measureRenders(<HomeWrapper />, { runs: 10, scenario });
  });

  test('re-render after adding multiple recipes rapidly', async () => {
    const scenario = async () => {
      await database.addRecipe({ ...testRecipe, title: `Rapid Recipe 1` });
      await database.addRecipe({ ...testRecipe, title: `Rapid Recipe 2` });
      await database.addRecipe({ ...testRecipe, title: `Rapid Recipe 3` });
    };

    await measureRenders(<HomeWrapper />, { runs: 10, scenario });
  });

  test('re-render with seasonal recipes in carousel', async () => {
    const seasonalRecipe: recipeTableElement = {
      ...testRecipe,
      title: 'Seasonal Test Recipe',
      season: ['1', '2', '3'],
      ingredients: performanceIngredients.slice(0, 5).map((ing, idx) => ({
        ...ing,
        id: idx + 1,
        quantity: '100',
        season: ['1', '2', '3'],
      })),
    };

    const scenario = async () => {
      await database.addRecipe(seasonalRecipe);
      if (seasonContextRef) {
        seasonContextRef.setSeasonFilter();
      }
    };

    await measureRenders(<HomeWrapper />, { runs: 10, scenario });
  });
});

const largeIngredients = Array.from({ length: 1200 }, (_, i) => ({
  id: i + 1,
  name: `LargeIngredient${i + 1}`,
  unit: 'g',
  type: ingredientType.vegetable,
  season: [] as string[],
}));

const largeRecipes: recipeTableElement[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  title: `LargeDatasetRecipe${i + 1}`,
  description: 'Generated for large-scale performance testing',
  ingredients: largeIngredients.slice(i % 10, (i % 10) + 5),
  tags: [],
  preparation: [],
  time: 30,
  persons: 4,
  season: [],
  image_Source: '',
}));

describe('Home Screen Performance - Large Dataset', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    seasonContextRef = null;
    await database.init();
    await database.addMultipleIngredients(largeIngredients);
    await database.addMultipleRecipes(largeRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render with 1000 recipes', async () => {
    await measureRenders(<HomeWrapper />, { runs: 5 });
  });

  test('re-render after adding recipe with 1000 recipes', async () => {
    const scenario = async () => {
      await database.addRecipe({ ...testRecipe, title: `ExtraRecipe${Date.now()}` });
    };

    await measureRenders(<HomeWrapper />, { runs: 5, scenario });
  });

  test('re-render after toggling season filter with 1000 recipes', async () => {
    const scenario = async () => {
      if (seasonContextRef) {
        seasonContextRef.setSeasonFilter();
      }
    };

    await measureRenders(<HomeWrapper />, { runs: 5, scenario });
  });
});
