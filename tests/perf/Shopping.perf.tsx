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
import { DefaultPersonsProvider } from '@context/DefaultPersonsContext';
import { useRecipes } from '@hooks/useRecipes';
import { useMenu } from '@hooks/useMenu';
import { useShopping } from '@hooks/useShopping';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const Stack = createStackNavigator();

type ShoppingPerfContext = {
  recipes: recipeTableElement[];
  shopping: { name: string; purchased: boolean }[];
  addRecipeToMenu: (r: recipeTableElement) => Promise<void>;
  togglePurchased: (name: string) => Promise<void>;
  clearPurchased: () => Promise<void>;
  deleteRecipe: (r: recipeTableElement) => Promise<unknown>;
};
let contextRef: ShoppingPerfContext | null = null;

function ContextCapture() {
  const { recipes, deleteRecipe } = useRecipes();
  const { addRecipeToMenu, togglePurchased, clearPurchased } = useMenu();
  const { shopping } = useShopping();
  useEffect(() => {
    contextRef = {
      recipes,
      shopping,
      addRecipeToMenu,
      togglePurchased,
      clearPurchased,
      deleteRecipe,
    };
  }, [recipes, shopping, addRecipeToMenu, togglePurchased, clearPurchased, deleteRecipe]);
  return null;
}

function ShoppingWrapper() {
  return (
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
        await contextRef.addRecipeToMenu(contextRef.recipes[0]);
        await contextRef.addRecipeToMenu(contextRef.recipes[1]);
        await contextRef.addRecipeToMenu(contextRef.recipes[2]);
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after adding recipe to menu', async () => {
    const scenario = async () => {
      if (contextRef && contextRef.recipes.length > 0) {
        await contextRef.addRecipeToMenu(contextRef.recipes[0]);
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after toggling purchase status', async () => {
    if (contextRef && contextRef.recipes.length > 0) {
      await contextRef.addRecipeToMenu(contextRef.recipes[0]);
    }

    const scenario = async () => {
      if (contextRef && contextRef.shopping.length > 0) {
        const item = contextRef.shopping[0];
        await contextRef.togglePurchased(item.name);
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after clearing purchased states', async () => {
    if (contextRef && contextRef.recipes.length > 0) {
      await contextRef.addRecipeToMenu(contextRef.recipes[0]);
      await contextRef.addRecipeToMenu(contextRef.recipes[1]);
    }

    const scenario = async () => {
      if (contextRef) {
        await contextRef.clearPurchased();
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render with many items from multiple recipes', async () => {
    const scenario = async () => {
      if (contextRef && contextRef.recipes.length >= 10) {
        for (let i = 0; i < 10; i++) {
          await contextRef.addRecipeToMenu(contextRef.recipes[i]);
        }
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });

  test('re-render after pressing clear button via UI', async () => {
    if (contextRef && contextRef.recipes.length > 0) {
      await contextRef.addRecipeToMenu(contextRef.recipes[0]);
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
      await contextRef.addRecipeToMenu(contextRef.recipes[0]);
      await contextRef.addRecipeToMenu(contextRef.recipes[1]);
    }

    const scenario = async () => {
      if (contextRef && contextRef.recipes.length > 0) {
        await contextRef.deleteRecipe(contextRef.recipes[0]);
      }
    };

    await measureRenders(<ShoppingWrapper />, { runs: 10, scenario });
  });
});
