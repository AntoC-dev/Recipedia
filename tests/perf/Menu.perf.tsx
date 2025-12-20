/**
 * Menu Screen Performance Tests
 *
 * Measures render performance for the Menu screen using Reassure.
 * Tests cover initial render, adding items, toggling cooked status,
 * and removing items with varying data sizes.
 */

import React, { useEffect } from 'react';
import { measureRenders } from 'reassure';
import { Menu } from '@screens/Menu';
import RecipeDatabase from '@utils/RecipeDatabase';
import { performanceRecipes } from '@assets/datasets/performance/recipes';
import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { performanceTags } from '@assets/datasets/performance/tags';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { SeasonFilterProvider } from '@context/SeasonFilterContext';
import {
  RecipeDatabaseContextType,
  RecipeDatabaseProvider,
  useRecipeDatabase,
} from '@context/RecipeDatabaseContext';
import { DefaultPersonsProvider } from '@context/DefaultPersonsContext';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@hooks/useSafeCopilot', () =>
  require('@mocks/hooks/useSafeCopilot-mock').useSafeCopilotMock()
);

const Stack = createStackNavigator();

let contextRef: RecipeDatabaseContextType | null = null;

function ContextCapture() {
  const context = useRecipeDatabase();
  useEffect(() => {
    contextRef = context;
  }, [context]);
  return null;
}

function MenuWrapper() {
  return (
    <RecipeDatabaseProvider>
      <DefaultPersonsProvider>
        <SeasonFilterProvider>
          <ContextCapture />
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name='Menu' component={Menu} />
            </Stack.Navigator>
          </NavigationContainer>
        </SeasonFilterProvider>
      </DefaultPersonsProvider>
    </RecipeDatabaseProvider>
  );
}

describe('Menu Screen Performance', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    contextRef = null;
    await database.init();
    await database.addMultipleIngredients(performanceIngredients);
    await database.addMultipleTags(performanceTags);
    await database.addMultipleRecipes(performanceRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render with empty menu', async () => {
    await measureRenders(<MenuWrapper />, { runs: 10 });
  });

  test('initial render with populated menu', async () => {
    const scenario = async () => {
      if (contextRef && contextRef.recipes.length >= 3) {
        await contextRef.addRecipeToMenu(contextRef.recipes[0]);
        await contextRef.addRecipeToMenu(contextRef.recipes[1]);
        await contextRef.addRecipeToMenu(contextRef.recipes[2]);
      }
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });

  test('re-render after adding recipe to menu', async () => {
    const scenario = async () => {
      if (contextRef && contextRef.recipes.length > 0) {
        await contextRef.addRecipeToMenu(contextRef.recipes[0]);
      }
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });

  test('re-render after toggling cooked status', async () => {
    if (contextRef && contextRef.recipes.length > 0) {
      await contextRef.addRecipeToMenu(contextRef.recipes[0]);
    }

    const scenario = async () => {
      if (contextRef && contextRef.menu.length > 0) {
        const menuItem = contextRef.menu[0];
        if (menuItem.id) {
          await contextRef.toggleMenuItemCooked(menuItem.id);
        }
      }
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });

  test('re-render after removing item from menu', async () => {
    if (contextRef && contextRef.recipes.length >= 2) {
      await contextRef.addRecipeToMenu(contextRef.recipes[0]);
      await contextRef.addRecipeToMenu(contextRef.recipes[1]);
    }

    const scenario = async () => {
      if (contextRef && contextRef.menu.length > 0) {
        const menuItem = contextRef.menu[0];
        if (menuItem.id) {
          await contextRef.removeFromMenu(menuItem.id);
        }
      }
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });

  test('re-render with many menu items', async () => {
    const scenario = async () => {
      if (contextRef && contextRef.recipes.length >= 10) {
        for (let i = 0; i < 10; i++) {
          await contextRef.addRecipeToMenu(contextRef.recipes[i]);
        }
      }
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });

  test('re-render with mixed cooked and uncooked items', async () => {
    if (contextRef && contextRef.recipes.length >= 4) {
      await contextRef.addRecipeToMenu(contextRef.recipes[0]);
      await contextRef.addRecipeToMenu(contextRef.recipes[1]);
      await contextRef.addRecipeToMenu(contextRef.recipes[2]);
      await contextRef.addRecipeToMenu(contextRef.recipes[3]);

      const menu = contextRef.menu;
      if (menu[0]?.id) await contextRef.toggleMenuItemCooked(menu[0].id);
      if (menu[1]?.id) await contextRef.toggleMenuItemCooked(menu[1].id);
    }

    const scenario = async () => {
      if (contextRef && contextRef.menu.length > 0) {
        const uncookedItem = contextRef.menu.find(item => !item.isCooked);
        if (uncookedItem?.id) {
          await contextRef.toggleMenuItemCooked(uncookedItem.id);
        }
      }
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });

  test('re-render after clearing menu', async () => {
    if (contextRef && contextRef.recipes.length >= 3) {
      await contextRef.addRecipeToMenu(contextRef.recipes[0]);
      await contextRef.addRecipeToMenu(contextRef.recipes[1]);
      await contextRef.addRecipeToMenu(contextRef.recipes[2]);
    }

    const scenario = async () => {
      if (contextRef) {
        await contextRef.clearMenu();
      }
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });
});
