import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useMenu } from '@hooks/useMenu';
import { useShopping } from '@hooks/useShopping';
import RecipeDatabase from '@utils/RecipeDatabase';
import { ingredientType, recipeTableElement } from '@customTypes/DatabaseElementTypes';

const catalogIngredients = [
  { name: 'Pasta', unit: 'g', type: ingredientType.cereal, season: [] },
  { name: 'Tomato', unit: 'g', type: ingredientType.vegetable, season: [] },
  { name: 'Olive Oil', unit: 'ml', type: ingredientType.oilAndFat, season: [] },
  { name: 'Lettuce', unit: 'g', type: ingredientType.vegetable, season: [] },
  { name: 'Onion', unit: 'g', type: ingredientType.vegetable, season: [] },
];

const pastaRecipe: recipeTableElement = {
  title: 'Pasta Primavera',
  image_Source: '',
  description: '',
  tags: [],
  persons: 2,
  ingredients: [
    { name: 'Pasta', unit: 'g', quantity: '200', type: ingredientType.cereal, season: [] },
    { name: 'Tomato', unit: 'g', quantity: '150', type: ingredientType.vegetable, season: [] },
    { name: 'Olive Oil', unit: 'ml', quantity: '30', type: ingredientType.oilAndFat, season: [] },
  ],
  season: [],
  preparation: [],
  time: 20,
};

const saladRecipe: recipeTableElement = {
  title: 'Garden Salad',
  image_Source: '',
  description: '',
  tags: [],
  persons: 2,
  ingredients: [
    { name: 'Lettuce', unit: 'g', quantity: '100', type: ingredientType.vegetable, season: [] },
    { name: 'Tomato', unit: 'g', quantity: '100', type: ingredientType.vegetable, season: [] },
    { name: 'Olive Oil', unit: 'ml', quantity: '20', type: ingredientType.oilAndFat, season: [] },
  ],
  season: [],
  preparation: [],
  time: 10,
};

const soupRecipe: recipeTableElement = {
  title: 'Tomato Soup',
  image_Source: '',
  description: '',
  tags: [],
  persons: 4,
  ingredients: [
    { name: 'Tomato', unit: 'g', quantity: '500', type: ingredientType.vegetable, season: [] },
    { name: 'Onion', unit: 'g', quantity: '80', type: ingredientType.vegetable, season: [] },
  ],
  season: [],
  preparation: [],
  time: 30,
};

function renderMenuAndShopping() {
  return renderHook(() => ({
    menu: useMenu(),
    shopping: useShopping(),
  }));
}

describe('Menu and Shopping Pipeline', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    database = RecipeDatabase.getInstance();
    await database.init();
    await database.addMultipleIngredients(catalogIngredients);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  describe('addRecipeToMenu', () => {
    test('shopping list is empty when menu is empty', () => {
      const { result } = renderMenuAndShopping();

      expect(result.current.shopping.shopping).toEqual([]);
    });

    test('adding a recipe populates the shopping list with its ingredients', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });

      const names = result.current.shopping.shopping.map(item => item.name);
      expect(names).toContain('Pasta');
      expect(names).toContain('Tomato');
      expect(names).toContain('Olive Oil');
    });

    test('shopping item carries correct quantity and unit', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });

      const pastaItem = result.current.shopping.shopping.find(item => item.name === 'Pasta');
      expect(pastaItem?.quantity).toBe('200');
      expect(pastaItem?.unit).toBe('g');
    });

    test('shopping item lists the source recipe title', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });

      const pastaItem = result.current.shopping.shopping.find(item => item.name === 'Pasta');
      expect(pastaItem?.recipeTitles).toContain('Pasta Primavera');
    });

    test('adding a recipe twice increments its count and doubles quantities', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        const menuItem = result.current.menu.menu[0];
        expect(menuItem.count).toBe(2);
      });

      const pastaItem = result.current.shopping.shopping.find(item => item.name === 'Pasta');
      expect(pastaItem?.quantity).toBe('400');
    });
  });

  describe('isRecipeInMenu', () => {
    test('returns false for a recipe not in menu', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      expect(result.current.menu.isRecipeInMenu(addedRecipe.id!)).toBe(false);
    });

    test('returns true after the recipe is added', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.menu.menu).toHaveLength(1);
      });

      expect(result.current.menu.isRecipeInMenu(addedRecipe.id!)).toBe(true);
    });

    test('returns false after the recipe is removed', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.menu.menu).toHaveLength(1);
      });

      const menuId = result.current.menu.menu[0].id!;

      await act(async () => {
        await result.current.menu.removeFromMenu(menuId);
      });

      await waitFor(() => {
        expect(result.current.menu.menu).toHaveLength(0);
      });

      expect(result.current.menu.isRecipeInMenu(addedRecipe.id!)).toBe(false);
    });
  });

  describe('removeFromMenu', () => {
    test('removing a recipe empties the shopping list', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });

      const menuId = result.current.menu.menu[0].id!;

      await act(async () => {
        await result.current.menu.removeFromMenu(menuId);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(0);
      });
    });

    test('removing one of two menu items leaves only the remaining recipe ingredients', async () => {
      await database.addMultipleRecipes([pastaRecipe, saladRecipe]);
      const recipes = database.get_recipes();
      const pasta = recipes.find(r => r.title === 'Pasta Primavera')!;
      const salad = recipes.find(r => r.title === 'Garden Salad')!;

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(pasta);
        await result.current.menu.addRecipeToMenu(salad);
      });

      await waitFor(() => {
        expect(result.current.menu.menu).toHaveLength(2);
      });

      const saladMenuId = result.current.menu.menu.find(m => m.recipeId === salad.id)!.id!;

      await act(async () => {
        await result.current.menu.removeFromMenu(saladMenuId);
      });

      await waitFor(() => {
        const names = result.current.shopping.shopping.map(item => item.name);
        expect(names).not.toContain('Lettuce');
      });

      const names = result.current.shopping.shopping.map(item => item.name);
      expect(names).toContain('Pasta');
    });
  });

  describe('toggleMenuItemCooked', () => {
    test('cooked recipe is excluded from shopping list', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });

      const menuId = result.current.menu.menu[0].id!;

      await act(async () => {
        await result.current.menu.toggleMenuItemCooked(menuId);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(0);
      });
    });

    test('uncooking a cooked recipe restores its ingredients to the shopping list', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.menu.menu).toHaveLength(1);
      });

      const menuId = result.current.menu.menu[0].id!;

      await act(async () => {
        await result.current.menu.toggleMenuItemCooked(menuId);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(0);
      });

      await act(async () => {
        await result.current.menu.toggleMenuItemCooked(menuId);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });
    });

    test('only non-cooked recipes in a mixed menu contribute to shopping list', async () => {
      await database.addMultipleRecipes([pastaRecipe, saladRecipe]);
      const recipes = database.get_recipes();
      const pasta = recipes.find(r => r.title === 'Pasta Primavera')!;
      const salad = recipes.find(r => r.title === 'Garden Salad')!;

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(pasta);
        await result.current.menu.addRecipeToMenu(salad);
      });

      await waitFor(() => {
        expect(result.current.menu.menu).toHaveLength(2);
      });

      const pastaMenuId = result.current.menu.menu.find(m => m.recipeId === pasta.id)!.id!;

      await act(async () => {
        await result.current.menu.toggleMenuItemCooked(pastaMenuId);
      });

      await waitFor(() => {
        const names = result.current.shopping.shopping.map(item => item.name);
        expect(names).not.toContain('Pasta');
      });

      const names = result.current.shopping.shopping.map(item => item.name);
      expect(names).toContain('Lettuce');
    });
  });

  describe('overlapping ingredients across recipes', () => {
    test('shared ingredient quantities are summed across menu recipes', async () => {
      await database.addMultipleRecipes([pastaRecipe, saladRecipe]);
      const recipes = database.get_recipes();
      const pasta = recipes.find(r => r.title === 'Pasta Primavera')!;
      const salad = recipes.find(r => r.title === 'Garden Salad')!;

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(pasta);
        await result.current.menu.addRecipeToMenu(salad);
      });

      await waitFor(() => {
        expect(result.current.menu.menu).toHaveLength(2);
      });

      const tomatoItem = result.current.shopping.shopping.find(item => item.name === 'Tomato');
      expect(tomatoItem?.quantity).toBe('250');
    });

    test('shared ingredient appears only once in the shopping list', async () => {
      await database.addMultipleRecipes([pastaRecipe, saladRecipe]);
      const recipes = database.get_recipes();
      const pasta = recipes.find(r => r.title === 'Pasta Primavera')!;
      const salad = recipes.find(r => r.title === 'Garden Salad')!;

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(pasta);
        await result.current.menu.addRecipeToMenu(salad);
      });

      await waitFor(() => {
        expect(result.current.menu.menu).toHaveLength(2);
      });

      const tomatoEntries = result.current.shopping.shopping.filter(item => item.name === 'Tomato');
      expect(tomatoEntries).toHaveLength(1);
    });

    test('merged ingredient lists both source recipe titles', async () => {
      await database.addMultipleRecipes([pastaRecipe, saladRecipe]);
      const recipes = database.get_recipes();
      const pasta = recipes.find(r => r.title === 'Pasta Primavera')!;
      const salad = recipes.find(r => r.title === 'Garden Salad')!;

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(pasta);
        await result.current.menu.addRecipeToMenu(salad);
      });

      await waitFor(() => {
        expect(result.current.menu.menu).toHaveLength(2);
      });

      const tomatoItem = result.current.shopping.shopping.find(item => item.name === 'Tomato');
      expect(tomatoItem?.recipeTitles).toContain('Pasta Primavera');
      expect(tomatoItem?.recipeTitles).toContain('Garden Salad');
    });

    test('three recipes with overlapping ingredient: quantities are fully accumulated', async () => {
      await database.addMultipleRecipes([pastaRecipe, saladRecipe, soupRecipe]);
      const recipes = database.get_recipes();
      const pasta = recipes.find(r => r.title === 'Pasta Primavera')!;
      const salad = recipes.find(r => r.title === 'Garden Salad')!;
      const soup = recipes.find(r => r.title === 'Tomato Soup')!;

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(pasta);
        await result.current.menu.addRecipeToMenu(salad);
        await result.current.menu.addRecipeToMenu(soup);
      });

      await waitFor(() => {
        expect(result.current.menu.menu).toHaveLength(3);
      });

      const tomatoItem = result.current.shopping.shopping.find(item => item.name === 'Tomato');
      expect(tomatoItem?.quantity).toBe('750');
    });
  });

  describe('count multiplier', () => {
    test('adding a recipe twice multiplies all its ingredient quantities by 2', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        const menuItem = result.current.menu.menu[0];
        expect(menuItem.count).toBe(2);
      });

      const oliveOilItem = result.current.shopping.shopping.find(item => item.name === 'Olive Oil');
      expect(oliveOilItem?.quantity).toBe('60');
    });

    test('adding a recipe three times triples all its ingredient quantities', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
        await result.current.menu.addRecipeToMenu(addedRecipe);
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        const menuItem = result.current.menu.menu[0];
        expect(menuItem.count).toBe(3);
      });

      const tomatoItem = result.current.shopping.shopping.find(item => item.name === 'Tomato');
      expect(tomatoItem?.quantity).toBe('450');
    });
  });

  describe('togglePurchased', () => {
    test('toggling purchased sets purchased flag to true on the shopping item', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });

      await act(async () => {
        await result.current.menu.togglePurchased('Tomato');
      });

      await waitFor(() => {
        const tomatoItem = result.current.shopping.shopping.find(item => item.name === 'Tomato');
        expect(tomatoItem?.purchased).toBe(true);
      });
    });

    test('toggling purchased twice resets purchased flag to false', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });

      await act(async () => {
        await result.current.menu.togglePurchased('Tomato');
      });

      await waitFor(() => {
        const tomatoItem = result.current.shopping.shopping.find(item => item.name === 'Tomato');
        expect(tomatoItem?.purchased).toBe(true);
      });

      await act(async () => {
        await result.current.menu.togglePurchased('Tomato');
      });

      await waitFor(() => {
        const tomatoItem = result.current.shopping.shopping.find(item => item.name === 'Tomato');
        expect(tomatoItem?.purchased).toBe(false);
      });
    });

    test('purchasing one item does not affect other items purchased state', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });

      await act(async () => {
        await result.current.menu.togglePurchased('Tomato');
      });

      await waitFor(() => {
        const tomatoItem = result.current.shopping.shopping.find(item => item.name === 'Tomato');
        expect(tomatoItem?.purchased).toBe(true);
      });

      const pastaItem = result.current.shopping.shopping.find(item => item.name === 'Pasta');
      const oliveOilItem = result.current.shopping.shopping.find(item => item.name === 'Olive Oil');
      expect(pastaItem?.purchased).toBe(false);
      expect(oliveOilItem?.purchased).toBe(false);
    });
  });

  describe('clearPurchased', () => {
    test('clearPurchased resets all purchased flags to false', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });

      await act(async () => {
        await result.current.menu.togglePurchased('Tomato');
        await result.current.menu.togglePurchased('Pasta');
      });

      await waitFor(() => {
        const purchased = result.current.shopping.shopping.filter(item => item.purchased);
        expect(purchased).toHaveLength(2);
      });

      await act(async () => {
        await result.current.menu.clearPurchased();
      });

      await waitFor(() => {
        const purchased = result.current.shopping.shopping.filter(item => item.purchased);
        expect(purchased).toHaveLength(0);
      });
    });

    test('clearPurchased does not remove items from the shopping list', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });

      await act(async () => {
        await result.current.menu.togglePurchased('Tomato');
      });

      await act(async () => {
        await result.current.menu.clearPurchased();
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });
    });
  });

  describe('clearMenu', () => {
    test('clearMenu empties the menu', async () => {
      await database.addMultipleRecipes([pastaRecipe, saladRecipe]);
      const recipes = database.get_recipes();
      const pasta = recipes.find(r => r.title === 'Pasta Primavera')!;
      const salad = recipes.find(r => r.title === 'Garden Salad')!;

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(pasta);
        await result.current.menu.addRecipeToMenu(salad);
      });

      await waitFor(() => {
        expect(result.current.menu.menu).toHaveLength(2);
      });

      await act(async () => {
        await result.current.menu.clearMenu();
      });

      await waitFor(() => {
        expect(result.current.menu.menu).toHaveLength(0);
      });
    });

    test('clearMenu empties the shopping list', async () => {
      await database.addMultipleRecipes([pastaRecipe, saladRecipe]);
      const recipes = database.get_recipes();
      const pasta = recipes.find(r => r.title === 'Pasta Primavera')!;
      const salad = recipes.find(r => r.title === 'Garden Salad')!;

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(pasta);
        await result.current.menu.addRecipeToMenu(salad);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.menu.clearMenu();
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(0);
      });
    });

    test('clearMenu also clears purchased state', async () => {
      await database.addRecipe(pastaRecipe);
      const addedRecipe = database.get_recipes()[0];

      const { result } = renderMenuAndShopping();

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });

      await act(async () => {
        await result.current.menu.togglePurchased('Tomato');
      });

      await waitFor(() => {
        const tomatoItem = result.current.shopping.shopping.find(item => item.name === 'Tomato');
        expect(tomatoItem?.purchased).toBe(true);
      });

      await act(async () => {
        await result.current.menu.clearMenu();
      });

      await act(async () => {
        await result.current.menu.addRecipeToMenu(addedRecipe);
      });

      await waitFor(() => {
        expect(result.current.shopping.shopping).toHaveLength(3);
      });

      const tomatoItem = result.current.shopping.shopping.find(item => item.name === 'Tomato');
      expect(tomatoItem?.purchased).toBe(false);
    });
  });
});
