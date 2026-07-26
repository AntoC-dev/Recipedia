import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useMenu } from '@hooks/useMenu';
import RecipeDatabase from '@utils/RecipeDatabase';
import { ingredientType, RecipeDraft } from '@customTypes/DatabaseElementTypes';

const catalogIngredients = [
  { name: 'Pasta', unit: 'g', type: ingredientType.cereal, season: [] },
  { name: 'Tomato', unit: 'g', type: ingredientType.vegetable, season: [] },
];

const pastaRecipe: RecipeDraft = {
  title: 'Pasta Primavera',
  image_Source: '',
  description: '',
  tags: [],
  persons: 2,
  ingredients: [
    { name: 'Pasta', unit: 'g', quantity: '200', type: ingredientType.cereal, season: [] },
    { name: 'Tomato', unit: 'g', quantity: '150', type: ingredientType.vegetable, season: [] },
  ],
  season: [],
  preparation: [],
  time: 20,
};

describe('useMenu', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    database = RecipeDatabase.getInstance();
    await database.init();
    await database.addMultipleIngredients(catalogIngredients);
    await database.addRecipe(pastaRecipe);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  function addedRecipe() {
    return database.get_recipes()[0]!;
  }

  test('menu starts empty', () => {
    const { result } = renderHook(() => useMenu());
    expect(result.current.menu).toEqual([]);
  });

  test('addRecipeToMenu inserts a menu entry for the recipe', async () => {
    const { result } = renderHook(() => useMenu());

    await act(async () => {
      await result.current.addRecipeToMenu(addedRecipe());
    });

    await waitFor(() => {
      expect(result.current.menu).toHaveLength(1);
    });
    expect(result.current.menu[0]!.recipeId).toBe(addedRecipe().id);
  });

  test('isRecipeInMenu tracks presence before and after adding', async () => {
    const { result } = renderHook(() => useMenu());
    expect(result.current.isRecipeInMenu(addedRecipe().id)).toBe(false);

    await act(async () => {
      await result.current.addRecipeToMenu(addedRecipe());
    });
    await waitFor(() => {
      expect(result.current.menu).toHaveLength(1);
    });

    expect(result.current.isRecipeInMenu(addedRecipe().id)).toBe(true);
  });

  test('toggleMenuItemCooked flips the cooked flag on the menu item', async () => {
    const { result } = renderHook(() => useMenu());
    await act(async () => {
      await result.current.addRecipeToMenu(addedRecipe());
    });
    await waitFor(() => {
      expect(result.current.menu).toHaveLength(1);
    });

    const menuId = result.current.menu[0]!.id!;
    await act(async () => {
      await result.current.toggleMenuItemCooked(menuId);
    });

    await waitFor(() => {
      expect(result.current.menu[0]!.isCooked).toBe(true);
    });
  });

  test('removeFromMenu deletes the menu entry', async () => {
    const { result } = renderHook(() => useMenu());
    await act(async () => {
      await result.current.addRecipeToMenu(addedRecipe());
    });
    await waitFor(() => {
      expect(result.current.menu).toHaveLength(1);
    });

    const menuId = result.current.menu[0]!.id!;
    await act(async () => {
      await result.current.removeFromMenu(menuId);
    });

    await waitFor(() => {
      expect(result.current.menu).toHaveLength(0);
    });
  });

  test('togglePurchased sets a false ingredient to purchased then back to unpurchased', async () => {
    const { result } = renderHook(() => useMenu());
    await act(async () => {
      await result.current.addRecipeToMenu(addedRecipe());
    });
    await waitFor(() => {
      expect(result.current.menu).toHaveLength(1);
    });

    await act(async () => {
      await result.current.togglePurchased('Tomato');
    });
    await waitFor(() => {
      expect(database.get_purchasedIngredients().get('Tomato')).toBe(true);
    });

    await act(async () => {
      await result.current.togglePurchased('Tomato');
    });
    await waitFor(() => {
      expect(database.get_purchasedIngredients().get('Tomato')).toBe(false);
    });
  });

  test('clearPurchased resets every purchased flag', async () => {
    const { result } = renderHook(() => useMenu());
    await act(async () => {
      await result.current.addRecipeToMenu(addedRecipe());
      await result.current.togglePurchased('Tomato');
      await result.current.togglePurchased('Pasta');
    });
    await waitFor(() => {
      expect(database.get_purchasedIngredients().get('Tomato')).toBe(true);
    });

    await act(async () => {
      await result.current.clearPurchased();
    });

    await waitFor(() => {
      const purchased = database.get_purchasedIngredients();
      expect(purchased.get('Tomato')).toBeFalsy();
      expect(purchased.get('Pasta')).toBeFalsy();
    });
  });

  test('clearMenu empties the menu and clears purchased state', async () => {
    const { result } = renderHook(() => useMenu());
    await act(async () => {
      await result.current.addRecipeToMenu(addedRecipe());
      await result.current.togglePurchased('Tomato');
    });
    await waitFor(() => {
      expect(database.get_purchasedIngredients().get('Tomato')).toBe(true);
    });

    await act(async () => {
      await result.current.clearMenu();
    });

    await waitFor(() => {
      expect(result.current.menu).toHaveLength(0);
    });
    expect(database.get_purchasedIngredients().get('Tomato')).toBeFalsy();
  });
});
