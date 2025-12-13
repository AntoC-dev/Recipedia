import React, { useEffect } from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { measureRenders } from 'reassure';
import Home from '@screens/Home';
import { RefreshControl } from 'react-native';
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
import {
  RecipeDatabaseContextType,
  RecipeDatabaseProvider,
  useRecipeDatabase,
} from '@context/RecipeDatabaseContext';
import { DefaultPersonsProvider } from '@context/DefaultPersonsContext';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const Stack = createStackNavigator();

let contextRef: RecipeDatabaseContextType | null = null;
let seasonContextRef: SeasonFilterContextType | null = null;

function ContextCapture() {
  const context = useRecipeDatabase();
  const seasonContext = useSeasonFilter();
  useEffect(() => {
    contextRef = context;
    seasonContextRef = seasonContext;
  }, [context, seasonContext]);
  return null;
}

function HomeWrapper() {
  return (
    <RecipeDatabaseProvider>
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
    </RecipeDatabaseProvider>
  );
}

const testRecipe: recipeTableElement = {
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
    contextRef = null;
    seasonContextRef = null;
    await database.init();
    await database.addMultipleIngredients(performanceIngredients);
    await database.addMultipleTags(performanceTags);
    await database.addMultipleRecipes(performanceRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render with 150 recipes', async () => {
    await measureRenders(<HomeWrapper />, { runs: 10 });
  });

  test('re-render after adding recipe via hook', async () => {
    const scenario = async () => {
      if (contextRef) {
        await contextRef.addRecipe({ ...testRecipe, title: `New Recipe ${Date.now()}` });
      }
    };

    await measureRenders(<HomeWrapper />, { runs: 10, scenario });
  });

  test('re-render after deleting recipe via hook', async () => {
    const scenario = async () => {
      if (contextRef && contextRef.recipes.length > 0) {
        await contextRef.deleteRecipe(contextRef.recipes[0]);
      }
    };

    await measureRenders(<HomeWrapper />, { runs: 10, scenario });
  });

  test('re-render after pull-to-refresh', async () => {
    const scenario = async () => {
      const refreshControl = screen.UNSAFE_getByType(RefreshControl);
      fireEvent(refreshControl, 'refresh');
    };

    await measureRenders(<HomeWrapper />, { runs: 10, scenario });
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
      if (contextRef) {
        await contextRef.addRecipe({ ...testRecipe, title: `Rapid Recipe 1` });
        await contextRef.addRecipe({ ...testRecipe, title: `Rapid Recipe 2` });
        await contextRef.addRecipe({ ...testRecipe, title: `Rapid Recipe 3` });
      }
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
      if (contextRef) {
        await contextRef.addRecipe(seasonalRecipe);
      }
      if (seasonContextRef) {
        seasonContextRef.setSeasonFilter();
      }
    };

    await measureRenders(<HomeWrapper />, { runs: 10, scenario });
  });
});
