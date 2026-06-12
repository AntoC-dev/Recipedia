/**
 * IngredientRowField - single editable ingredient row bound to per-column form
 * controllers.
 *
 * Each editable column (quantity, unit, name) subscribes to its own field
 * path:
 *
 *     useController({ name: `recipeIngredients.${index}.quantity` })
 *     useController({ name: `recipeIngredients.${index}.unit` })
 *     useController({ name: `recipeIngredients.${index}.name` })
 *
 * A keystroke commit in one column only re-renders that column's controller —
 * sibling columns in the same row and sibling rows in the array never wake up.
 * This is the structural change that kills the row-level cascade the previous
 * whole-row `useController({ name: \`recipeIngredients.${index}\` })` produced.
 *
 * Name changes route through the parent's `editIngredients` callback so the
 * validation-queue flow (fuzzy DB matching + replace-on-match) stays
 * centralized in `useRecipeIngredients`. Quantity / unit / note commits write
 * straight to their column controller, skipping the bulk-array re-render.
 *
 * @module screens/recipe/fields/IngredientRow
 */

import React, { useEffect, useRef } from 'react';
import { useController, UseFormReturn } from 'react-hook-form';

import { IngredientRow } from '@components/organisms/RecipeIngredients';
import { parseIngredientString } from '@hooks/useRecipeIngredients';
import { formatIngredientForCallback, parseIngredientQuantity } from '@utils/Quantity';
import { RecipeFormInput } from '@schemas/recipeFormSchema';

import { IngredientRowValue } from './useIngredientArray';

type Form = UseFormReturn<RecipeFormInput>;

export interface IngredientRowFieldProps {
  form: Form;
  index: number;
  availableIngredients: string[];
  hideDropdown?: boolean;
  rowError?: string;
  editIngredients: (index: number, formatted: string) => void;
  removeIngredient: (index: number) => void;
  openNoteDialog: (index: number) => void;
  testID: string;
  editingIngredientCountRef: React.MutableRefObject<number>;
}

export function IngredientRowField({
  form,
  index,
  availableIngredients,
  hideDropdown,
  rowError,
  editIngredients,
  removeIngredient,
  openNoteDialog,
  testID,
  editingIngredientCountRef,
}: IngredientRowFieldProps) {
  const quantityCtrl = useController({
    control: form.control,
    name: `recipeIngredients.${index}.quantity` as const,
  });
  const unitCtrl = useController({
    control: form.control,
    name: `recipeIngredients.${index}.unit` as const,
  });
  const nameCtrl = useController({
    control: form.control,
    name: `recipeIngredients.${index}.name` as const,
  });
  const noteCtrl = useController({
    control: form.control,
    name: `recipeIngredients.${index}.note` as const,
  });

  // Composed view passed to the presentational row. Each value comes from its
  // own controller — the row body never reads from `form.getValues`, so the
  // input shows what RHF holds.
  const ingredient: IngredientRowValue = {
    name: nameCtrl.field.value ?? '',
    quantity: quantityCtrl.field.value ?? '',
    unit: unitCtrl.field.value ?? '',
    note: noteCtrl.field.value,
  } as IngredientRowValue;

  /**
   * Handles an explicit dropdown pick. Always re-resolves the row against the
   * database, even when live-commit already wrote the selected name (so the
   * name-changed comparison in `handleCommit` would otherwise short-circuit and
   * leave the row without its DB id / type / season). Builds the formatted
   * string from the selected name plus the row's current quantity / unit / note
   * and hands it to `editIngredients`, which runs the fuzzy match and applies
   * the resolved metadata.
   */
  const handleSelectName = (name: string) => {
    const formatted = formatIngredientForCallback(
      parseIngredientQuantity(quantityCtrl.field.value ?? ''),
      unitCtrl.field.value ?? '',
      name,
      noteCtrl.field.value
    );
    editIngredients(index, formatted);
  };

  /**
   * Handles a blur-commit of the row's formatted string. Routes a name commit
   * through `editIngredients` (fuzzy DB match) whenever the name changed *or*
   * the row is not yet DB-resolved; otherwise writes only the changed quantity
   * / unit / name / note straight to their column controllers.
   *
   * The unresolved check matters because `onLiveNameChange` already wrote the
   * typed name into the name controller on each keystroke, so by commit time
   * the name equals what the user typed. Without it a freshly typed ingredient
   * would never run fuzzy matching, leaving the row without its DB `type` /
   * `season` and failing form validation.
   */
  const handleCommit = (formatted: string) => {
    const parsed = parseIngredientString(formatted);
    const currentName = (nameCtrl.field.value ?? '').trim();
    const nextName = (parsed.name ?? '').trim();
    const isResolved = !!form.getValues(`recipeIngredients.${index}.type`);
    if (nextName && (nextName !== currentName || !isResolved)) {
      editIngredients(index, formatted);
      return;
    }
    if (parsed.quantity !== (quantityCtrl.field.value ?? '')) {
      quantityCtrl.field.onChange(parsed.quantity || '');
    }
    if (parsed.unit && parsed.unit !== (unitCtrl.field.value ?? '')) {
      unitCtrl.field.onChange(parsed.unit);
    }
    if (parsed.name && parsed.name !== (nameCtrl.field.value ?? '')) {
      nameCtrl.field.onChange(parsed.name);
    }
    if (parsed.note !== (noteCtrl.field.value ?? '')) {
      noteCtrl.field.onChange(parsed.note);
    }
  };

  // Tracks whether this row currently holds a slot in the shared focus counter.
  // The boolean makes focus/blur idempotent per row and lets the unmount
  // cleanup release a still-held slot — without it, a row removed while one of
  // its inputs is focused (e.g. a validation-queue/OCR patch dropping the
  // focused row) never fires `onBlur`, leaking the increment and leaving the
  // scaling watcher permanently deferred.
  const isRowFocusedRef = useRef(false);
  const acquireFocusSlot = () => {
    if (isRowFocusedRef.current) return;
    isRowFocusedRef.current = true;
    editingIngredientCountRef.current += 1;
  };
  const releaseFocusSlot = () => {
    if (!isRowFocusedRef.current) return;
    isRowFocusedRef.current = false;
    // eslint-disable-next-line react-compiler/react-compiler -- ref mutation is the intended escape hatch for cross-component focus tracking
    editingIngredientCountRef.current = Math.max(0, editingIngredientCountRef.current - 1);
  };
  useEffect(() => releaseFocusSlot, [editingIngredientCountRef]);

  return (
    <IngredientRow
      testID={testID}
      index={index}
      ingredient={ingredient}
      availableIngredients={availableIngredients}
      hideDropdown={hideDropdown}
      rowError={rowError}
      onCommit={handleCommit}
      onLiveNameChange={value => nameCtrl.field.onChange(value)}
      onSelectName={handleSelectName}
      onRemove={() => removeIngredient(index)}
      onOpenNote={() => openNoteDialog(index)}
      onFocus={acquireFocusSlot}
      onBlur={() => {
        releaseFocusSlot();
        nameCtrl.field.onBlur();
        quantityCtrl.field.onBlur();
        unitCtrl.field.onBlur();
      }}
    />
  );
}
