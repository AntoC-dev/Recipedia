import { ingredientType } from '@customTypes/DatabaseElementTypes';
import {
  nonIngredientFilters,
  TIngredientCategories,
  TListFilter,
} from '@customTypes/RecipeFiltersTypes';
import { useI18n } from '@utils/i18n';

/**
 * Returns all ingredient categories sorted by their translated display name.
 * Re-sorts automatically when the language changes.
 */
export function useShoppingCategories(): TIngredientCategories[] {
  const { t, getLocale } = useI18n();
  return (Object.values(ingredientType) as TIngredientCategories[]).sort((a, b) =>
    t(a).localeCompare(t(b), getLocale())
  );
}

/**
 * Returns all filter categories sorted by their translated display name.
 * Re-sorts automatically when the language changes.
 */
export function useFiltersCategories(): TListFilter[] {
  const shoppingCategories = useShoppingCategories();

  return [...Object.values(nonIngredientFilters), ...shoppingCategories];
}
