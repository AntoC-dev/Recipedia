/**
 * Watches `recipePersons` for transitions between valid servings counts and
 * rescales the ingredient array accordingly. Sentinel transitions (involving
 * `defaultValueNumber`) are skipped. While the user has an ingredient row
 * focused (tracked via `editingIngredientCountRef`), the rewrite is deferred
 * so an on-blur commit cannot silently undo the freshly-scaled quantity.
 *
 * Extracted from `RecipeFormContext` so the watcher lives at the screen
 * level where it belongs.
 *
 * @module screens/recipe/hooks/useScalingOnPersonsChange
 */

import type React from 'react';
import { useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { FormIngredientElement, ingredientTableElement } from '@customTypes/DatabaseElementTypes';
import { defaultValueNumber } from '@utils/Constants';
import { scaleQuantityForPersons } from '@utils/Quantity';
import { recipeLogger } from '@utils/logger';
import type { RecipeFormInput } from '@schemas/recipeFormSchema';

/**
 * Subscribes to `recipePersons` and rescales `recipeIngredients` on each
 * valid transition. See module header for the focus-deferral rationale.
 *
 * @param form - The recipe form instance
 * @param initialPersons - Persons count used to seed the "previous" ref so the
 *   first edit triggers scaling from the original value
 * @param editingIngredientCountRef - Shared focus-counter ref; positive values
 *   indicate a row is currently focused and scaling is deferred
 * @returns The ref tracking the previous persons value, so callers can
 *   manually reset it (e.g. after a cancel restores the original persons)
 */
export function useScalingOnPersonsChange(
  form: UseFormReturn<RecipeFormInput>,
  initialPersons: number,
  editingIngredientCountRef: React.MutableRefObject<number>
): React.MutableRefObject<number> {
  const previousPersonsRef = useRef<number>(initialPersons);

  useEffect(() => {
    const subscription = form.watch((_value, { name }) => {
      if (name !== 'recipePersons') return;
      const previousPersons = previousPersonsRef.current;
      const nextPersons = form.getValues('recipePersons');
      if (
        previousPersons === defaultValueNumber ||
        nextPersons === defaultValueNumber ||
        previousPersons === nextPersons
      ) {
        previousPersonsRef.current = nextPersons;
        return;
      }
      if (editingIngredientCountRef.current > 0) {
        recipeLogger.debug('Skipping ingredient scaling - user editing a row', {
          previousPersons,
          nextPersons,
          editingCount: editingIngredientCountRef.current,
        });
        previousPersonsRef.current = nextPersons;
        return;
      }
      const current = (form.getValues('recipeIngredients') ?? []) as (
        | ingredientTableElement
        | FormIngredientElement
      )[];
      const scaled = current.map(ing => ({
        ...ing,
        quantity: ing.quantity
          ? scaleQuantityForPersons(ing.quantity, previousPersons, nextPersons)
          : undefined,
      }));
      recipeLogger.debug('Scaling ingredient quantities for persons change', {
        previousPersons,
        nextPersons,
        ingredientCount: scaled.length,
      });
      form.setValue('recipeIngredients', scaled as RecipeFormInput['recipeIngredients'], {
        shouldValidate: true,
        shouldDirty: false,
        shouldTouch: false,
      });
      previousPersonsRef.current = nextPersons;
    });
    return () => subscription.unsubscribe();
  }, [form, editingIngredientCountRef]);

  return previousPersonsRef;
}
