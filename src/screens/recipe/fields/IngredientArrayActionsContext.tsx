/**
 * IngredientArrayActionsContext - Shares the field-array `applyPatch` callback
 * across the screen.
 *
 * Feature hooks that mutate `recipeIngredients` outside of the user-typing
 * path (`useRecipeScraperValidation`, `useRecipeOCR`) need to apply changes
 * via the same patch shape as `useIngredientArray.applyEditPatch` so unchanged
 * sibling rows retain object identity. They cannot reach the field-array hook
 * directly because it lives inside the ingredients field subtree.
 *
 * The provider creates a single ref + a stable `register` callback that
 * captures the ref in closure. `EditableIngredientsField` registers its
 * `applyEditPatch` on mount via `useIngredientArrayActionsRegister`;
 * consumers read via `useIngredientArrayActions()`. When no provider or no
 * registrant is mounted the consumer hook falls back to a no-op so unit
 * tests rendering hooks in isolation still work.
 *
 * Only one registrant is supported at a time — the editable ingredients
 * field tree mounts at most once per screen.
 *
 * @module screens/recipe/fields/IngredientArrayActionsContext
 */

import React, { createContext, ReactNode, useContext, useEffect, useRef } from 'react';

import { ApplyIngredientEditPatch } from '@hooks/useRecipeIngredients';
import { noop } from '@screens/recipe/constants';

interface IngredientArrayActionsContextValue {
  register: (applyPatch: ApplyIngredientEditPatch) => () => void;
  apply: ApplyIngredientEditPatch;
}

const IngredientArrayActionsContext = createContext<IngredientArrayActionsContextValue | undefined>(
  undefined
);

const noopApplyPatch: ApplyIngredientEditPatch = noop;

/**
 * Provides the shared `applyPatch` channel. Wrap the recipe form body with
 * this provider so the ingredients field can register its `applyEditPatch`
 * and the OCR / scraper hooks (mounted via the FeatureHookSlot) can read it.
 */
export function IngredientArrayActionsProvider({ children }: { children: ReactNode }) {
  const valueRef = useRef<IngredientArrayActionsContextValue | null>(null);
  if (valueRef.current === null) {
    const applyPatchHolder: { current: ApplyIngredientEditPatch | null } = { current: null };
    valueRef.current = {
      register: applyPatch => {
        applyPatchHolder.current = applyPatch;
        return () => {
          if (applyPatchHolder.current === applyPatch) {
            applyPatchHolder.current = null;
          }
        };
      },
      apply: patch => {
        const current = applyPatchHolder.current;
        if (current) {
          current(patch);
          return;
        }
        noopApplyPatch(patch);
      },
    };
  }
  return (
    <IngredientArrayActionsContext.Provider value={valueRef.current}>
      {children}
    </IngredientArrayActionsContext.Provider>
  );
}

/**
 * Registers an `applyPatch` implementation with the surrounding provider.
 * Last write wins — the editable ingredients field is the only intended
 * registrant per screen. Unregisters on unmount so a later remount in a
 * different mode picks up the fresh registrant.
 */
export function useIngredientArrayActionsRegister(applyPatch: ApplyIngredientEditPatch): void {
  const ctx = useContext(IngredientArrayActionsContext);
  useEffect(() => {
    if (!ctx) return;
    return ctx.register(applyPatch);
  }, [ctx, applyPatch]);
}

/**
 * Returns an `applyPatch` callback that forwards to the currently registered
 * implementation. Falls back to a no-op when no provider is mounted or no
 * registrant has registered yet (e.g., unit tests rendering a hook in
 * isolation, or feature hooks that fire before the ingredients field has
 * mounted).
 *
 * The returned callback is referentially stable across renders so consumers
 * can safely close over it.
 */
export function useIngredientArrayActions(): { applyPatch: ApplyIngredientEditPatch } {
  const ctx = useContext(IngredientArrayActionsContext);
  if (ctx) {
    return { applyPatch: ctx.apply };
  }
  return { applyPatch: noopApplyPatch };
}
