/**
 * ShoppingComputation - Pure shopping list aggregation for Recipedia
 *
 * Provides a single pure function that derives a flat shopping list from the
 * current menu, recipe catalogue and purchased-ingredient state. Extracted
 * from RecipeDatabaseContext so it can be used by `useShopping` without any
 * React dependency and tested in isolation.
 *
 * @module ShoppingComputation
 */

import {
  ComputedShoppingItem,
  menuTableElement,
  recipeTableElement,
} from '@customTypes/DatabaseElementTypes';
import { parseQuantity } from '@utils/Quantity';

type ShoppingAggregate = {
  item: ComputedShoppingItem;
  total: number;
  hasQuantity: boolean;
};

/**
 * Computes a flat shopping list from the current menu, recipes and purchase state.
 *
 * Iterates over non-cooked menu items, looks up each recipe and accumulates
 * ingredient quantities (multiplied by the menu item count). Duplicate
 * ingredient names across recipes are merged into a single entry. Quantities
 * are parsed to numbers via `parseQuantity`, summed numerically and formatted
 * once at the end (rounded to six decimals to avoid binary floating point
 * artifacts). Ingredients that never carry a quantity keep an empty string
 * rather than `"0"`.
 *
 * @param menu - All current menu items (cooked items are excluded)
 * @param recipes - Full recipe catalogue used to resolve `menu[].recipeId`
 * @param purchasedIngredients - Map of ingredient name → purchased state
 * @returns Flat array of aggregated shopping items, one per unique ingredient name
 */
export function computeShoppingList(
  menu: menuTableElement[],
  recipes: recipeTableElement[],
  purchasedIngredients: Map<string, boolean>
): ComputedShoppingItem[] {
  const toCookItems = menu.filter(item => !item.isCooked);
  const aggregates = new Map<string, ShoppingAggregate>();
  const recipeById = new Map(recipes.map(r => [r.id, r]));

  for (const menuItem of toCookItems) {
    const recipe = recipeById.get(menuItem.recipeId);
    if (!recipe) {
      continue;
    }

    const count = menuItem.count ?? 1;
    for (const ingredient of recipe.ingredients) {
      const parsed = parseQuantity(ingredient.quantity);
      const hasQuantity = parsed !== '';
      const quantityToAdd = hasQuantity ? Number(parsed) * count : 0;

      const existing = aggregates.get(ingredient.name);
      if (existing) {
        existing.total += quantityToAdd;
        existing.hasQuantity = existing.hasQuantity || hasQuantity;
        if (!existing.item.recipeTitles.includes(recipe.title)) {
          existing.item.recipeTitles.push(recipe.title);
        }
      } else {
        aggregates.set(ingredient.name, {
          item: {
            name: ingredient.name,
            type: ingredient.type,
            quantity: '',
            unit: ingredient.unit ?? '',
            recipeTitles: [recipe.title],
            purchased: purchasedIngredients.get(ingredient.name) ?? false,
          },
          total: quantityToAdd,
          hasQuantity,
        });
      }
    }
  }

  return Array.from(aggregates.values()).map(({ item, total, hasQuantity }) => ({
    ...item,
    quantity: hasQuantity ? (Math.round(total * 1e6) / 1e6).toString() : '',
  }));
}
