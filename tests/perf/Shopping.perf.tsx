import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { measureRenders } from 'reassure';
import { Shopping } from '@screens/Shopping';
import { RecipeDatabase } from '@utils/RecipeDatabase';
import { performanceRecipes } from '@assets/datasets/performance/recipes';
import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { performanceTags } from '@assets/datasets/performance/tags';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { SeasonFilterProvider } from '@context/SeasonFilterContext';
import { DefaultPersonsProvider } from '@context/DefaultPersonsContext';
import { computeShoppingList } from '@utils/ShoppingComputation';
import { HEAVY_WARMUP } from './perfOptions';
import { settle } from './settle';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('react-native-paper', () =>
  require('@mocks/deps/react-native-paper-collapsible-accordion-mock').collapsibleAccordionPaperMock()
);

const Stack = createNativeStackNavigator();

function ShoppingWrapper() {
  return (
    <DefaultPersonsProvider>
      <SeasonFilterProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name='Shopping' component={Shopping} />
          </Stack.Navigator>
        </NavigationContainer>
      </SeasonFilterProvider>
    </DefaultPersonsProvider>
  );
}

describe('Shopping Screen Performance', () => {
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

  test('initial render with empty shopping list', async () => {
    await measureRenders(<ShoppingWrapper />, { runs: 10 });
  });

  test('initial render with populated shopping list', async () => {
    const scenario = async () => {
      const recipes = database.get_recipes();
      if (recipes.length > 0) {
        await database.addRecipeToMenu(recipes[0]!);
        await database.addRecipeToMenu(recipes[1]!);
        await database.addRecipeToMenu(recipes[2]!);
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after adding recipe to menu', async () => {
    const scenario = async () => {
      const recipes = database.get_recipes();
      if (recipes.length > 0) {
        await database.addRecipeToMenu(recipes[0]!);
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after toggling purchase status', async () => {
    const recipes = database.get_recipes();
    if (recipes.length > 0) {
      await database.addRecipeToMenu(recipes[0]!);
    }

    const scenario = async () => {
      const shopping = computeShoppingList(
        database.get_menu(),
        database.get_recipes(),
        database.get_purchasedIngredients()
      );
      if (shopping.length > 0) {
        const item = shopping[0];
        const purchased = database.get_purchasedIngredients();
        await database.setPurchased(item!.name, !purchased.get(item!.name));
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after clearing purchased states', async () => {
    const recipes = database.get_recipes();
    if (recipes.length > 0) {
      await database.addRecipeToMenu(recipes[0]!);
      await database.addRecipeToMenu(recipes[1]!);
    }

    const scenario = async () => {
      await database.clearPurchasedIngredients();
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render with many items from multiple recipes', async () => {
    const scenario = async () => {
      const recipes = database.get_recipes();
      if (recipes.length >= 10) {
        for (let i = 0; i < 10; i++) {
          await database.addRecipeToMenu(recipes[i]!);
        }
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after opening recipe usage dialog via long press', async () => {
    const recipes = database.get_recipes();
    if (recipes.length > 0) {
      await database.addRecipeToMenu(recipes[0]!);
    }

    const scenario = async () => {
      const shopping = computeShoppingList(
        database.get_menu(),
        database.get_recipes(),
        database.get_purchasedIngredients()
      );
      if (shopping.length > 0) {
        const item = shopping[0];
        const listItem = screen.queryByTestId(`ShoppingScreen::SectionList::${item!.name}`);
        if (listItem) {
          await fireEvent(listItem, 'longPress');
        }
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after deleting recipe that was in shopping list', async () => {
    const recipes = database.get_recipes();
    if (recipes.length > 0) {
      await database.addRecipeToMenu(recipes[0]!);
      await database.addRecipeToMenu(recipes[1]!);
    }

    const scenario = async () => {
      const currentRecipes = database.get_recipes();
      if (currentRecipes.length > 0) {
        await database.deleteRecipe(currentRecipes[0]!);
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after expanding a large purchased section', async () => {
    const purchasedCount = 50;
    const recipes = database.get_recipes();
    for (const recipe of recipes) {
      const shopping = computeShoppingList(
        database.get_menu(),
        database.get_recipes(),
        database.get_purchasedIngredients()
      );
      if (shopping.length > purchasedCount) {
        break;
      }
      await database.addRecipeToMenu(recipe);
    }
    const shopping = computeShoppingList(
      database.get_menu(),
      database.get_recipes(),
      database.get_purchasedIngredients()
    );
    expect(shopping.length).toBeGreaterThan(purchasedCount);
    for (const item of shopping.slice(0, purchasedCount)) {
      await database.setPurchased(item.name, true);
    }

    const scenario = async () => {
      await fireEvent.press(screen.getByTestId('ShoppingScreen::SectionList::Purchased::Header'));
      await settle();
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, ...HEAVY_WARMUP, scenario });
  });
});
