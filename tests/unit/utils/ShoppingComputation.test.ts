import { computeShoppingList } from '@utils/ShoppingComputation';
import {
  ingredientType,
  menuTableElement,
  recipeTableElement,
} from '@customTypes/DatabaseElementTypes';

const makeIngredient = (
  name: string,
  quantity: string,
  unit: string,
  type = ingredientType.vegetable
) => ({
  name,
  quantity,
  unit,
  type,
  season: [],
});

const makeRecipe = (
  id: number,
  title: string,
  ingredients: ReturnType<typeof makeIngredient>[]
): recipeTableElement => ({
  id,
  title,
  image_Source: '',
  description: '',
  tags: [],
  persons: 2,
  ingredients,
  season: [],
  preparation: [],
  time: 0,
});

const makeMenuItem = (
  recipeId: number,
  options: { count?: number; isCooked?: boolean } = {}
): menuTableElement => ({
  recipeId,
  recipeTitle: '',
  imageSource: '',
  isCooked: options.isCooked ?? false,
  count: options.count ?? 1,
});

const noPurchased = new Map<string, boolean>();

describe('computeShoppingList', () => {
  test('returns empty array for empty menu', () => {
    const result = computeShoppingList([], [], noPurchased);
    expect(result).toEqual([]);
  });

  test('returns empty array when all menu items are cooked', () => {
    const recipe = makeRecipe(1, 'Pasta', [makeIngredient('flour', '200', 'g')]);
    const result = computeShoppingList(
      [makeMenuItem(1, { isCooked: true })],
      [recipe],
      noPurchased
    );
    expect(result).toEqual([]);
  });

  test('returns empty array when menu item has no matching recipe', () => {
    const recipe = makeRecipe(1, 'Pasta', [makeIngredient('flour', '200', 'g')]);
    const result = computeShoppingList([makeMenuItem(99)], [recipe], noPurchased);
    expect(result).toEqual([]);
  });

  test('returns ingredient from single uncoooked menu item', () => {
    const recipe = makeRecipe(1, 'Pasta', [makeIngredient('flour', '200', 'g')]);
    const result = computeShoppingList([makeMenuItem(1)], [recipe], noPurchased);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'flour',
      quantity: '200',
      unit: 'g',
      type: ingredientType.vegetable,
      recipeTitles: ['Pasta'],
      purchased: false,
    });
  });

  test('returns all ingredients from a recipe', () => {
    const recipe = makeRecipe(1, 'Salad', [
      makeIngredient('lettuce', '1', 'head'),
      makeIngredient('tomato', '2', 'pcs'),
    ]);
    const result = computeShoppingList([makeMenuItem(1)], [recipe], noPurchased);

    expect(result).toHaveLength(2);
    expect(result.map(i => i.name)).toContain('lettuce');
    expect(result.map(i => i.name)).toContain('tomato');
  });

  test('multiplies quantity by count when count > 1', () => {
    const recipe = makeRecipe(1, 'Pasta', [makeIngredient('flour', '200', 'g')]);
    const result = computeShoppingList([makeMenuItem(1, { count: 3 })], [recipe], noPurchased);

    expect(result[0]!.quantity).toBe('600');
  });

  test('sums same ingredient quantity across two recipes', () => {
    const recipe1 = makeRecipe(1, 'Pasta', [makeIngredient('flour', '200', 'g')]);
    const recipe2 = makeRecipe(2, 'Cake', [makeIngredient('flour', '150', 'g')]);
    const result = computeShoppingList(
      [makeMenuItem(1), makeMenuItem(2)],
      [recipe1, recipe2],
      noPurchased
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.quantity).toBe('350');
  });

  test('sums same ingredient across recipes when quantity formats are mixed', () => {
    const recipe1 = makeRecipe(1, 'Pasta', [makeIngredient('flour', '100', 'g')]);
    const recipe2 = makeRecipe(2, 'Cake', [makeIngredient('flour', '200 g', 'g')]);
    const result = computeShoppingList(
      [makeMenuItem(1), makeMenuItem(2)],
      [recipe1, recipe2],
      noPurchased
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.quantity).toBe('300');
    expect(result[0]!.unit).toBe('g');
  });

  test('multiplies a numeric quantity parsed from mixed input by count', () => {
    const recipe = makeRecipe(1, 'Pasta', [makeIngredient('flour', '100 g', 'g')]);
    const result = computeShoppingList([makeMenuItem(1, { count: 3 })], [recipe], noPurchased);

    expect(result[0]!.quantity).toBe('300');
  });

  test('keeps quantity empty when same ingredient lacks quantity in two recipes', () => {
    const recipe1 = makeRecipe(1, 'Soup', [makeIngredient('salt', '', 'pinch')]);
    const recipe2 = makeRecipe(2, 'Stew', [makeIngredient('salt', '', 'pinch')]);
    const result = computeShoppingList(
      [makeMenuItem(1), makeMenuItem(2)],
      [recipe1, recipe2],
      noPurchased
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.quantity).toBe('');
  });

  test('keeps quantity empty when an unquantified ingredient has count greater than one', () => {
    const recipe = makeRecipe(1, 'Soup', [makeIngredient('salt', '', 'pinch')]);
    const result = computeShoppingList([makeMenuItem(1, { count: 3 })], [recipe], noPurchased);

    expect(result[0]!.quantity).toBe('');
  });

  test('sums decimal quantities without floating point artifacts', () => {
    const recipe1 = makeRecipe(1, 'Cake', [makeIngredient('oil', '0.1', 'l')]);
    const recipe2 = makeRecipe(2, 'Bread', [makeIngredient('oil', '0.2', 'l')]);
    const result = computeShoppingList(
      [makeMenuItem(1), makeMenuItem(2)],
      [recipe1, recipe2],
      noPurchased
    );

    expect(result[0]!.quantity).toBe('0.3');
  });

  test('accumulates both recipe titles when ingredient appears in two recipes', () => {
    const recipe1 = makeRecipe(1, 'Pasta', [makeIngredient('flour', '200', 'g')]);
    const recipe2 = makeRecipe(2, 'Cake', [makeIngredient('flour', '150', 'g')]);
    const result = computeShoppingList(
      [makeMenuItem(1), makeMenuItem(2)],
      [recipe1, recipe2],
      noPurchased
    );

    expect(result[0]!.recipeTitles).toEqual(['Pasta', 'Cake']);
  });

  test('does not duplicate recipe title when same recipe appears twice', () => {
    const recipe = makeRecipe(1, 'Pasta', [makeIngredient('flour', '200', 'g')]);
    const result = computeShoppingList([makeMenuItem(1), makeMenuItem(1)], [recipe], noPurchased);

    expect(result[0]!.recipeTitles).toEqual(['Pasta']);
  });

  test('marks ingredient as purchased when present in purchased map', () => {
    const recipe = makeRecipe(1, 'Pasta', [makeIngredient('flour', '200', 'g')]);
    const purchased = new Map([['flour', true]]);
    const result = computeShoppingList([makeMenuItem(1)], [recipe], purchased);

    expect(result[0]!.purchased).toBe(true);
  });

  test('marks ingredient as not purchased when absent from purchased map', () => {
    const recipe = makeRecipe(1, 'Pasta', [makeIngredient('flour', '200', 'g')]);
    const result = computeShoppingList([makeMenuItem(1)], [recipe], noPurchased);

    expect(result[0]!.purchased).toBe(false);
  });

  test('handles ingredient without quantity', () => {
    const ingredient = {
      ...makeIngredient('salt', '', 'pinch'),
      quantity: undefined as unknown as string,
    };
    const recipe = makeRecipe(1, 'Soup', [ingredient as any]);
    const result = computeShoppingList([makeMenuItem(1)], [recipe], noPurchased);

    expect(result[0]!.quantity).toBe('');
  });

  test('excludes cooked items while including uncoooked items in mixed menu', () => {
    const recipe1 = makeRecipe(1, 'Pasta', [makeIngredient('flour', '200', 'g')]);
    const recipe2 = makeRecipe(2, 'Soup', [makeIngredient('carrot', '3', 'pcs')]);
    const result = computeShoppingList(
      [makeMenuItem(1, { isCooked: true }), makeMenuItem(2)],
      [recipe1, recipe2],
      noPurchased
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('carrot');
  });

  test('returned items are independent objects - mutations do not cross calls', () => {
    const recipe = makeRecipe(1, 'Pasta', [makeIngredient('flour', '200', 'g')]);
    const firstResult = computeShoppingList([makeMenuItem(1)], [recipe], noPurchased);
    firstResult[0]!.recipeTitles.push('mutated');

    const secondResult = computeShoppingList([makeMenuItem(1)], [recipe], noPurchased);
    expect(secondResult[0]!.recipeTitles).toEqual(['Pasta']);
  });

  test('uses count of 1 when menu item count is undefined', () => {
    const recipe = makeRecipe(1, 'Pasta', [makeIngredient('flour', '200', 'g')]);
    const menuItemWithoutCount = { ...makeMenuItem(1), count: undefined } as any;
    const result = computeShoppingList([menuItemWithoutCount], [recipe], noPurchased);

    expect(result[0]!.quantity).toBe('200');
  });

  test('uses empty string for unit when ingredient unit is undefined', () => {
    const ingredient = { ...makeIngredient('salt', '1', 'tsp') };
    delete (ingredient as any).unit;
    const recipe = makeRecipe(1, 'Soup', [ingredient as any]);
    const result = computeShoppingList([makeMenuItem(1)], [recipe], noPurchased);

    expect(result[0]!.unit).toBe('');
  });
});
