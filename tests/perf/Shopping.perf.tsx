import React, { useEffect } from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { measureRenders } from 'reassure';
import { Shopping } from '@screens/Shopping';
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

const Stack = createStackNavigator();

let contextRef: RecipeDatabaseContextType | null = null;

function ContextCapture() {
  const context = useRecipeDatabase();
  useEffect(() => {
    contextRef = context;
  }, [context]);
  return null;
}

function ShoppingWrapper() {
  return (
    <RecipeDatabaseProvider>
      <DefaultPersonsProvider>
        <SeasonFilterProvider>
          <ContextCapture />
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name='Shopping' component={Shopping} />
            </Stack.Navigator>
          </NavigationContainer>
        </SeasonFilterProvider>
      </DefaultPersonsProvider>
    </RecipeDatabaseProvider>
  );
}

describe('Shopping Screen Performance', () => {
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

  test('initial render with empty shopping list', async () => {
    await measureRenders(<ShoppingWrapper />, { runs: 10 });
  });

  test('initial render with populated shopping list', async () => {
    const scenario = async () => {
      if (contextRef && contextRef.recipes.length > 0) {
        await contextRef.addRecipeToShopping(contextRef.recipes[0]);
        await contextRef.addRecipeToShopping(contextRef.recipes[1]);
        await contextRef.addRecipeToShopping(contextRef.recipes[2]);
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after adding recipe to shopping list', async () => {
    const scenario = async () => {
      if (contextRef && contextRef.recipes.length > 0) {
        await contextRef.addRecipeToShopping(contextRef.recipes[0]);
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after toggling purchase status', async () => {
    if (contextRef && contextRef.recipes.length > 0) {
      await contextRef.addRecipeToShopping(contextRef.recipes[0]);
    }

    const scenario = async () => {
      if (contextRef && contextRef.shopping.length > 0) {
        const item = contextRef.shopping[0];
        if (item.id !== undefined) {
          await contextRef.purchaseIngredientInShoppingList(item.id, !item.purchased);
        }
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after clearing shopping list', async () => {
    if (contextRef && contextRef.recipes.length > 0) {
      await contextRef.addRecipeToShopping(contextRef.recipes[0]);
      await contextRef.addRecipeToShopping(contextRef.recipes[1]);
    }

    const scenario = async () => {
      if (contextRef) {
        await contextRef.clearShoppingList();
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render with many items from multiple recipes', async () => {
    const scenario = async () => {
      if (contextRef && contextRef.recipes.length >= 10) {
        for (let i = 0; i < 10; i++) {
          await contextRef.addRecipeToShopping(contextRef.recipes[i]);
        }
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after pressing clear button via UI', async () => {
    if (contextRef && contextRef.recipes.length > 0) {
      await contextRef.addRecipeToShopping(contextRef.recipes[0]);
    }

    const scenario = async () => {
      const clearButton = screen.queryByTestId('ShoppingScreen::ClearShoppingListButton');
      if (clearButton) {
        fireEvent.press(clearButton);
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after deleting recipe that was in shopping list', async () => {
    if (contextRef && contextRef.recipes.length > 0) {
      await contextRef.addRecipeToShopping(contextRef.recipes[0]);
      await contextRef.addRecipeToShopping(contextRef.recipes[1]);
    }

    const scenario = async () => {
      if (contextRef && contextRef.recipes.length > 0) {
        await contextRef.deleteRecipe(contextRef.recipes[0]);
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });
});
