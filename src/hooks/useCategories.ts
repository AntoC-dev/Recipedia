/**
 * Hooks that derive sorted, locale-aware category lists from the ingredient
 * type enum and the non-ingredient filter constants.
 *
 * @module useCategories
 */

import { ingredientType } from '@customTypes/DatabaseElementTypes';
import {
  nonIngredientFilters,
  TIngredientCategories,
  TListFilter,
} from '@customTypes/RecipeFiltersTypes';
import { useI18n } from '@utils/i18n';

/**
 * Returns all ingredient categories sorted by their translated display name.
 *
 * The sort is locale-sensitive and re-runs whenever the active language changes,
 * so the list is always correctly ordered for the current locale without manual
 * invalidation.
 *
 * @returns Array of every {@link TIngredientCategories} value in ascending
 *   translated order for the current locale.
 *
 * @example
 * ```tsx
 * function ShoppingCategoryPicker() {
 *   const categories = useShoppingCategories();
 *   return categories.map(cat => <Text key={cat}>{t(cat)}</Text>);
 * }
 * ```
 */
export function useShoppingCategories(): TIngredientCategories[] {
  const { t, getLocale } = useI18n();
  return (Object.values(ingredientType) as TIngredientCategories[]).sort((a, b) =>
    t(a).localeCompare(t(b), getLocale())
  );
}

/**
 * Returns the full list of recipe-list filter categories, combining
 * non-ingredient filters (e.g. season, tags) with all ingredient type
 * categories, both sorted by their translated display name.
 *
 * Delegates to {@link useShoppingCategories} for the ingredient portion,
 * so the sort is always locale-sensitive and reactive to language changes.
 *
 * @returns Array of every {@link TListFilter} value — non-ingredient filters
 *   first, then ingredient categories — all in ascending translated order.
 *
 * @example
 * ```tsx
 * function FilterChipRow() {
 *   const filters = useFiltersCategories();
 *   return filters.map(f => <Chip key={f}>{t(f)}</Chip>);
 * }
 * ```
 */
export function useFiltersCategories(): TListFilter[] {
  const shoppingCategories = useShoppingCategories();

  return [...Object.values(nonIngredientFilters), ...shoppingCategories];
}
