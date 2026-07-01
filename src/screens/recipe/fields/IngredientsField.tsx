/**
 * RecipeIngredientsField - entry export for the ingredients field tree.
 *
 * Dispatches to a read-only renderer for the `readOnly` stack mode and to the
 * editable variant for every other mode. The editable variant mounts the
 * `useIngredientArray` hook for field-array ops, derives `availableIngredients`
 * for the per-row dropdown, and renders the OCR scan affordance in the addOCR
 * empty / tail states.
 *
 * Per-row "edited" gating is read directly from `formState.dirtyFields` — the
 * row surfaces an inline error once it has been dirtied (any column has
 * diverged from its default) or once the form has been submitted. The
 * top-level "ingredients required" message follows the same shape on the
 * array as a whole.
 *
 * @module screens/recipe/fields/IngredientsField
 */

import React, { useState } from 'react';
import { useController, useFormState, UseFormReturn } from 'react-hook-form';

import { ingredientTableElement } from '@customTypes/DatabaseElementTypes';
import { recipeStateType } from '@customTypes/ScreenTypes';
import { OcrModalTarget } from '@utils/OCR';
import {
  IngredientsAddEmpty,
  IngredientsAddTail,
  IngredientsTable,
  RecipeIngredients,
} from '@components/organisms/RecipeIngredients';
import { NoteEditDialog } from '@components/dialogs/NoteEditDialog';
import { formatIngredientForCallback, parseIngredientQuantity } from '@utils/Quantity';
import { hasErrorMessage, inlineMessage, isNestedDirty } from '@utils/recipeFormErrors';
import { RecipeFormInput } from '@schemas/recipeFormSchema';
import { useIngredientFocusRef } from '@screens/recipe/IngredientFocusContext';
import { RECIPE_INGREDIENTS_TEST_ID } from '@screens/recipe/constants';

import { IngredientRowField } from './IngredientRow';
import { IngredientRowValue, useIngredientArray } from './useIngredientArray';

type Form = UseFormReturn<RecipeFormInput>;
type T = (key: string) => string;

export interface IngredientsFieldProps {
  form: Form;
  stackMode: recipeStateType;
  openModalForField: (field: OcrModalTarget) => void;
  t: T;
  hideDropdown?: boolean;
}

/** Read-only renderer: lists the ingredient array with no editing affordances. */
function ReadOnlyIngredientsField({ form, testID }: { form: Form; testID: string }) {
  const { field } = useController({ control: form.control, name: 'recipeIngredients' });
  const ingredients = (field.value ?? []) as ingredientTableElement[];
  return <RecipeIngredients testID={testID} ingredients={ingredients} />;
}

/**
 * Editable renderer: mounts the field-array hook, derives per-row error gating
 * from `dirtyFields` / `isSubmitted`, and renders the addOCR scan affordances.
 */
function EditableIngredientsField({
  form,
  stackMode,
  openModalForField,
  t,
  hideDropdown,
}: IngredientsFieldProps) {
  const testID = RECIPE_INGREDIENTS_TEST_ID;
  const editingIngredientCountRef = useIngredientFocusRef();
  const [noteDialogIndex, setNoteDialogIndex] = useState<number | null>(null);
  const {
    fieldArray,
    availableIngredients,
    handleAddIngredient,
    handleRemoveIngredient,
    handleEditIngredient,
    rowCount,
  } = useIngredientArray({ form });
  const { dirtyFields, isSubmitted, errors } = useFormState({
    control: form.control,
    name: 'recipeIngredients',
  });
  const rowDirtyFlags = (dirtyFields.recipeIngredients ?? []) as (
    Record<string, unknown> | boolean | undefined
  )[];
  const arrayDirty = rowDirtyFlags.length > 0;
  // Single source for both the array-root `.min` message and the per-row item
  // errors. The array-root controller's `fieldState.error` only carries the
  // `.min` error and never the nested per-row errors, so the whole field reads
  // from the `useFormState` errors tree: `.message` for the root, indexed
  // entries for each row.
  const arrayErrors = errors.recipeIngredients as unknown as
    (Record<number, unknown> & { message?: string }) | undefined;
  const rowErrors = arrayErrors;

  const rootErrorMessage =
    rowCount === 0 && arrayErrors?.message && (arrayDirty || isSubmitted)
      ? inlineMessage(arrayErrors.message, t)
      : undefined;

  const noteDialogIngredient =
    noteDialogIndex !== null
      ? ((form.getValues(`recipeIngredients.${noteDialogIndex}`) ??
          null) as IngredientRowValue | null)
      : null;
  /** Commits the note dialog's text back onto the focused ingredient row. */
  const handleNoteDialogSave = (note: string) => {
    if (noteDialogIndex === null || !noteDialogIngredient) return;
    handleEditIngredient(
      noteDialogIndex,
      formatIngredientForCallback(
        parseIngredientQuantity(noteDialogIngredient.quantity),
        noteDialogIngredient.unit ?? '',
        noteDialogIngredient.name ?? '',
        note || undefined
      )
    );
  };

  const prefixText = t('ingredients') + ': ';

  if (stackMode === recipeStateType.addOCR && rowCount === 0) {
    return (
      <IngredientsAddEmpty
        testID={testID}
        prefixText={prefixText}
        scanLabel={t('recipe.ingredientsScanNames')}
        manualLabel={t('recipe.ingredientsAddManually')}
        openOcrModal={() => openModalForField('ingredientNames')}
        onAddIngredient={handleAddIngredient}
        error={rootErrorMessage}
      />
    );
  }

  /** Renders one ingredient row, gating its inline error on dirty / submitted. */
  const renderRow = (key: string, index: number) => {
    const rowDirty = isNestedDirty(rowDirtyFlags[index]);
    const rowError =
      hasErrorMessage(rowErrors?.[index]) && (isSubmitted || rowDirty)
        ? t('alerts.inlineErrors.ingredientRow')
        : undefined;
    return (
      <IngredientRowField
        key={key}
        form={form}
        index={index}
        testID={testID}
        availableIngredients={availableIngredients}
        hideDropdown={hideDropdown}
        rowError={rowError}
        editIngredients={handleEditIngredient}
        removeIngredient={handleRemoveIngredient}
        openNoteDialog={setNoteDialogIndex}
        editingIngredientCountRef={editingIngredientCountRef}
      />
    );
  };

  const tableChildren = fieldArray.fields.map((field, index) => renderRow(field.id, index));
  const isAddOCR = stackMode === recipeStateType.addOCR;

  return (
    <React.Fragment>
      <IngredientsTable
        testID={testID}
        prefixText={prefixText}
        columnTitles={{
          column1: t('quantity'),
          column2: t('unit'),
          column3: t('ingredientName'),
        }}
        hideAddButton={isAddOCR}
        onAddIngredient={handleAddIngredient}
        error={rootErrorMessage}
      >
        {tableChildren}
      </IngredientsTable>
      {isAddOCR && (
        <IngredientsAddTail
          testID={testID}
          scanLabel={t('recipe.ingredientsScanQuantities')}
          manualLabel={t('recipe.ingredientsAddManually')}
          openOcrModal={() => openModalForField('ingredientQuantities')}
          onAddIngredient={handleAddIngredient}
        />
      )}
      <NoteEditDialog
        testId={testID}
        isVisible={noteDialogIndex !== null}
        ingredientName={noteDialogIngredient?.name ?? ''}
        initialNote={noteDialogIngredient?.note ?? ''}
        placeholder={t('ingredientNotePlaceholder')}
        onClose={() => setNoteDialogIndex(null)}
        onSave={handleNoteDialogSave}
      />
    </React.Fragment>
  );
}

/** Dispatches to the read-only or editable ingredients renderer by stack mode. */
export function RecipeIngredientsField(props: IngredientsFieldProps) {
  if (props.stackMode === recipeStateType.readOnly) {
    return <ReadOnlyIngredientsField form={props.form} testID={RECIPE_INGREDIENTS_TEST_ID} />;
  }
  return <EditableIngredientsField {...props} />;
}
