/**
 * IngredientFocusContext - Tracks how many ingredient inputs the user is
 * currently editing.
 *
 * The screen-level scaling watcher (`useScalingOnPersonsChange`) reads this
 * counter to decide whether a persons-count change should immediately rewrite
 * ingredient quantities. While the user has a row focused, scaling is
 * deferred to avoid the race where the on-blur commit overwrites the
 * freshly-scaled quantity with the user's pre-scale typed value.
 *
 * Each `IngredientRowField` increments the ref on focus and decrements it on
 * blur. The provider owns the ref; unit tests rendering the row in isolation
 * fall back to a local ref via `useIngredientFocusRef` so the rows still work
 * without a provider mounted.
 *
 * @module screens/recipe/IngredientFocusContext
 */

import React, { createContext, ReactNode, useContext, useRef } from 'react';

const IngredientFocusContext = createContext<React.MutableRefObject<number> | undefined>(undefined);

/**
 * Provides the shared ingredient-focus counter ref. Wrap the recipe form body
 * (or anything that mounts ingredient rows + the scaling watcher) with this
 * provider so both sides see the same ref instance.
 */
export function IngredientFocusProvider({ children }: { children: ReactNode }) {
  const ref = useRef<number>(0);
  return <IngredientFocusContext.Provider value={ref}>{children}</IngredientFocusContext.Provider>;
}

/**
 * Returns the focus-counter ref from the surrounding `IngredientFocusProvider`,
 * or a brand-new local ref when no provider is mounted. The latter case is
 * intentional: unit tests rendering an `IngredientRowField` in isolation do
 * not mount the scaling watcher, so writes to a fallback ref are harmless
 * no-ops while the row still increments / decrements correctly.
 */
export function useIngredientFocusRef(): React.MutableRefObject<number> {
  const ctx = useContext(IngredientFocusContext);
  // Always call useRef to satisfy hook rules; the value is only used when the
  // provider is absent.
  const fallback = useRef<number>(0);
  return ctx ?? fallback;
}
