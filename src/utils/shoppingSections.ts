import { ComputedShoppingItem } from '@customTypes/DatabaseElementTypes';
import { TIngredientCategories } from '@customTypes/RecipeFiltersTypes';

/** A category group of items still to buy. Never empty. */
export type ShoppingSection = {
  /** Translation key of the ingredient category grouping the items. */
  title: TIngredientCategories;
  /** Items of this category, none of them purchased. */
  data: ComputedShoppingItem[];
};

/** The shopping list split into what is left to buy and what is already bought. */
export type ShoppingListView = {
  /**
   * Non-empty category sections, one per displayed category. Items whose
   * category is absent from `categories` are dropped rather than bucketed.
   */
  sections: ShoppingSection[];
  /** Purchased items, in list order, shown apart from the working list. */
  purchased: ComputedShoppingItem[];
};

/**
 * Splits a shopping list into the categories still to buy and a flat list of
 * purchased items.
 *
 * Purchased items are kept out of the category sections entirely so the working
 * list only ever shows what is left: the screen renders them in a collapsed
 * block at the end, where they stay reachable to undo a mistaken tap. Sections
 * follow the supplied `categories` order and empty ones are dropped.
 *
 * @param categories - Ingredient categories in display order.
 * @param items - The full shopping list, mixing purchased and unpurchased items.
 * @returns The sections to render and the purchased items to collapse away.
 */
export function buildShoppingSections(
  categories: TIngredientCategories[],
  items: ComputedShoppingItem[]
): ShoppingListView {
  const toBuy = items.filter(item => !item.purchased);

  const sections = categories
    .map(category => ({
      title: category,
      data: toBuy.filter(item => item.type === category),
    }))
    .filter(section => section.data.length > 0);

  return { sections, purchased: items.filter(item => item.purchased) };
}
