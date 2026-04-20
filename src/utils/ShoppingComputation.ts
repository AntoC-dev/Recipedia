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
import { sumNumberInString } from '@utils/TypeCheckingFunctions';

/**
 * Computes a flat shopping list from the current menu, recipes and purchase state.
 *
 * Iterates over non-cooked menu items, looks up each recipe and accumulates
 * ingredient quantities (multiplied by the menu item count). Duplicate
 * ingredient names across recipes are merged into a single entry. Quantities
 * are summed using `sumNumberInString` to preserve locale-aware decimal
 * separators.
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
  const shoppingIngredientMap = new Map<string, ComputedShoppingItem>();
  const recipeById = new Map(recipes.map(r => [r.id, r]));

  for (const menuItem of toCookItems) {
    const recipe = recipeById.get(menuItem.recipeId);
    if (!recipe) {
      continue;
    }

    const count = menuItem.count ?? 1;
    for (const ingredient of recipe.ingredients) {
      const existing = shoppingIngredientMap.get(ingredient.name);
      const ingredientQuantity = ingredient.quantity ?? '';

      let quantityToAdd = ingredientQuantity;
      for (let i = 1; i < count; i++) {
        quantityToAdd = sumNumberInString(quantityToAdd, ingredientQuantity);
      }

      if (existing) {
        shoppingIngredientMap.set(ingredient.name, {
          ...existing,
          quantity: sumNumberInString(existing.quantity, quantityToAdd),
          recipeTitles: existing.recipeTitles.includes(recipe.title)
            ? existing.recipeTitles
            : [...existing.recipeTitles, recipe.title],
        });
      } else {
        shoppingIngredientMap.set(ingredient.name, {
          name: ingredient.name,
          type: ingredient.type,
          quantity: quantityToAdd,
          unit: ingredient.unit ?? '',
          recipeTitles: [recipe.title],
          purchased: purchasedIngredients.get(ingredient.name) ?? false,
        });
      }
    }
  }

  return Array.from(shoppingIngredientMap.values());
}
