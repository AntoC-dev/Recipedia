/**
 * Shared constants for the recipe screen family (the read-only view and the
 * editable routes). Hoisted to module scope so they are allocated once instead
 * of per render, and shared so the `'Recipe'` test-id prefix is defined in a
 * single place rather than duplicated per screen.
 *
 * @module screens/recipe/constants
 */

/**
 * Test-ID prefix shared by every recipe screen. Used as the root namespace for
 * the AppBar, dialogs, and each field organism's `testID`, so e2e / unit
 * selectors stay identical across the read-only view and the editable routes.
 */
export const RECIPE_TEST_ID = 'Recipe';

/**
 * Root testID for the ingredients field (read-only + editable variants).
 * Derived from {@link RECIPE_TEST_ID} so the prefix stays single-sourced.
 */
export const RECIPE_INGREDIENTS_TEST_ID = `${RECIPE_TEST_ID}Ingredients`;

/**
 * Shared no-op callback for read-only recipe rendering.
 *
 * `RecipeView` reuses the same `build*Props` helpers as the editable routes.
 * Those helpers type their setter / `openModal` callbacks as required (the
 * editable modes need them), but every helper returns on the read-only branch
 * before invoking any of them. Passing this single shared no-op satisfies the
 * required-callback contract without allocating a fresh closure per field on
 * every render.
 */
export const noop = (): void => {};
