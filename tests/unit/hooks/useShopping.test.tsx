import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useShopping } from '@hooks/useShopping';
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

describe('useShopping', () => {
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

  test('returns an empty shopping list when the menu is empty', () => {
    const { result } = renderHook(() => useShopping());
    expect(result.current.shopping).toEqual([]);
  });

  test('derives one aggregated item per ingredient of the menu recipes', async () => {
    const { result } = renderHook(() => useShopping());

    await act(async () => {
      await database.addRecipeToMenu(addedRecipe());
    });

    await waitFor(() => {
      expect(result.current.shopping).toHaveLength(2);
    });
    const names = result.current.shopping.map(item => item.name);
    expect(names).toEqual(expect.arrayContaining(['Pasta', 'Tomato']));
  });

  test('reflects purchased state on the derived item', async () => {
    const { result } = renderHook(() => useShopping());

    await act(async () => {
      await database.addRecipeToMenu(addedRecipe());
    });
    await waitFor(() => {
      expect(result.current.shopping).toHaveLength(2);
    });

    await act(async () => {
      await database.setPurchased('Tomato', true);
    });

    await waitFor(() => {
      expect(result.current.shopping.find(item => item.name === 'Tomato')?.purchased).toBe(true);
    });
  });

  test('excludes ingredients of a recipe once it is marked cooked', async () => {
    const { result } = renderHook(() => useShopping());

    await act(async () => {
      await database.addRecipeToMenu(addedRecipe());
    });
    await waitFor(() => {
      expect(result.current.shopping).toHaveLength(2);
    });

    const menuId = database.get_menu()[0]!.id!;
    await act(async () => {
      await database.toggleMenuItemCooked(menuId);
    });

    await waitFor(() => {
      expect(result.current.shopping).toHaveLength(0);
    });
  });
});
