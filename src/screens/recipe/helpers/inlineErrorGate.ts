/**
 * Inline error gating helper for recipe-form fields.
 *
 * Reads RHF's own `formState.touchedFields[name]` and `formState.isSubmitted`
 * via a scoped `useFormState` subscription and resolves the translated inline
 * error message when either gate is open. The gate auto-clears on
 * `form.reset()` (which wipes `touchedFields` and `isSubmitted`).
 *
 * RHF's `mode: 'onTouched'` flips `touchedFields[name]` on the first blur and
 * then re-validates the field on every subsequent change. Consumers wire
 * `useController`'s `field.onChange` directly — no wrapped writer is needed.
 *
 * @module screens/recipe/helpers/inlineErrorGate
 */

import { useState } from 'react';
import { FieldPath, useFormContext, useFormState } from 'react-hook-form';

import { RecipeFormInput } from '@schemas/recipeFormSchema';
import { inlineMessage } from '@utils/recipeFormErrors';

type T = (key: string) => string;

export interface InlineErrorState {
  error: string | undefined;
  isTouched: boolean;
  showInlineError: boolean;
  hasBeenEdited: boolean;
}

/**
 * Subscribes to the field's touched/error state and the form's `isSubmitted`
 * flag. Returns the translated inline message once either gate has opened.
 *
 * Named with the `use` prefix so the React Hooks lint rules treat it as a
 * custom hook — it composes `useFormContext` + `useFormState` and obeys the
 * same call-order constraints as any other hook.
 *
 * @param name - RHF field path to gate.
 * @param t - i18n translation function.
 * @returns `{ error, isTouched, showInlineError, hasBeenEdited }`. `error` is
 *          `undefined` until the user has touched the field or attempted a
 *          submit. `hasBeenEdited` latches `true` on the first edit and stays
 *          `true` even after the field is cleared back to its default.
 */
export function useInlineErrorFor<TName extends FieldPath<RecipeFormInput>>(
  name: TName,
  t: T
): InlineErrorState {
  const form = useFormContext<RecipeFormInput>();
  const formState = useFormState({ control: form.control, name, exact: true });
  const { isTouched, isDirty, error } = form.getFieldState(name, formState);
  // RHF's `isDirty` reverts to `false` once a field is cleared back to its
  // default (e.g. type then erase), so it can't tell "never edited" from
  // "edited then emptied". Latch the first edit to keep them apart: a bare
  // focus/blur stays silent, but an edited-then-emptied field still surfaces.
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  if (isDirty && !hasBeenEdited) setHasBeenEdited(true);
  const showInlineError = (isTouched && hasBeenEdited) || formState.isSubmitted;
  return {
    error: showInlineError ? inlineMessage(error?.message, t) : undefined,
    isTouched,
    showInlineError,
    hasBeenEdited,
  };
}
