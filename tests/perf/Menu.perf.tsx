import React from 'react';
import { measureRenders } from 'reassure';
import { Menu } from '@screens/Menu';
import RecipeDatabase from '@utils/RecipeDatabase';
import { performanceRecipes } from '@assets/datasets/performance/recipes';
import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { performanceTags } from '@assets/datasets/performance/tags';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { SeasonFilterProvider } from '@context/SeasonFilterContext';
import { DefaultPersonsProvider } from '@context/DefaultPersonsContext';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@hooks/useSafeCopilot', () =>
  require('@mocks/hooks/useSafeCopilot-mock').useSafeCopilotMock()
);

const Stack = createStackNavigator();

function MenuWrapper() {
  return (
    <DefaultPersonsProvider>
      <SeasonFilterProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name='Menu' component={Menu} />
          </Stack.Navigator>
        </NavigationContainer>
      </SeasonFilterProvider>
    </DefaultPersonsProvider>
  );
}

describe('Menu Screen Performance', () => {
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

  test('initial render with empty menu', async () => {
    await measureRenders(<MenuWrapper />, { runs: 10 });
  });

  test('initial render with populated menu', async () => {
    const scenario = async () => {
      const recipes = database.get_recipes();
      if (recipes.length >= 3) {
        await database.addRecipeToMenu(recipes[0]!);
        await database.addRecipeToMenu(recipes[1]!);
        await database.addRecipeToMenu(recipes[2]!);
      }
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });

  test('re-render after adding recipe to menu', async () => {
    const scenario = async () => {
      const recipes = database.get_recipes();
      if (recipes.length > 0) {
        await database.addRecipeToMenu(recipes[0]!);
      }
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });

  test('re-render after toggling cooked status', async () => {
    const recipes = database.get_recipes();
    if (recipes.length > 0) {
      await database.addRecipeToMenu(recipes[0]!);
    }

    const scenario = async () => {
      const menu = database.get_menu();
      if (menu.length > 0) {
        const menuItem = menu[0];
        if (menuItem!.id) {
          await database.toggleMenuItemCooked(menuItem!.id);
        }
      }
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });

  test('re-render after removing item from menu', async () => {
    const recipes = database.get_recipes();
    if (recipes.length >= 2) {
      await database.addRecipeToMenu(recipes[0]!);
      await database.addRecipeToMenu(recipes[1]!);
    }

    const scenario = async () => {
      const menu = database.get_menu();
      if (menu.length > 0) {
        const menuItem = menu[0];
        if (menuItem!.id) {
          await database.removeFromMenu(menuItem!.id);
        }
      }
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });

  test('re-render with many menu items', async () => {
    const scenario = async () => {
      const recipes = database.get_recipes();
      if (recipes.length >= 10) {
        for (let i = 0; i < 10; i++) {
          await database.addRecipeToMenu(recipes[i]!);
        }
      }
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });

  test('re-render with mixed cooked and uncooked items', async () => {
    const recipes = database.get_recipes();
    if (recipes.length >= 4) {
      await database.addRecipeToMenu(recipes[0]!);
      await database.addRecipeToMenu(recipes[1]!);
      await database.addRecipeToMenu(recipes[2]!);
      await database.addRecipeToMenu(recipes[3]!);

      const menu = database.get_menu();
      if (menu[0]?.id) await database.toggleMenuItemCooked(menu[0].id);
      if (menu[1]?.id) await database.toggleMenuItemCooked(menu[1].id);
    }

    const scenario = async () => {
      const menu = database.get_menu();
      const uncookedItem = menu.find((item: { isCooked: boolean }) => !item.isCooked);
      if (uncookedItem?.id) {
        await database.toggleMenuItemCooked(uncookedItem.id);
      }
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });

  test('re-render after clearing menu', async () => {
    const recipes = database.get_recipes();
    if (recipes.length >= 3) {
      await database.addRecipeToMenu(recipes[0]!);
      await database.addRecipeToMenu(recipes[1]!);
      await database.addRecipeToMenu(recipes[2]!);
    }

    const scenario = async () => {
      await database.clearMenu();
    };

    await measureRenders(<MenuWrapper />, { runs: 10, scenario });
  });
});
