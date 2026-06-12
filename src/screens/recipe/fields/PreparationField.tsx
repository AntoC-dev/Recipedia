/**
 * RecipePreparationField - entry export for the preparation field tree.
 *
 * Dispatches to a read-only renderer for the `readOnly` stack mode and to the
 * editable variant for every other mode. The editable variant mounts the
 * `useStepArray` hook for field-array ops and renders the OCR scan affordance
 * in the addOCR empty state.
 *
 * @module screens/recipe/fields/PreparationField
 */

import React from 'react';
import { useController, UseFormReturn } from 'react-hook-form';

import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import { recipeStateType } from '@customTypes/ScreenTypes';
import { OcrModalTarget } from '@utils/OCR';
import {
  PreparationEmptyAdd,
  PreparationSection,
  RecipePreparation,
} from '@components/organisms/RecipePreparation';
import { RecipeFormInput } from '@schemas/recipeFormSchema';

import { PreparationStepField } from './PreparationStep';
import { useStepArray } from './useStepArray';

type Form = UseFormReturn<RecipeFormInput>;
type T = (key: string) => string;

export interface PreparationFieldProps {
  form: Form;
  stackMode: recipeStateType;
  openModalForField: (field: OcrModalTarget) => void;
  t: T;
}

/** Read-only renderer: lists the preparation steps with no editing affordances. */
function ReadOnlyPreparationField({ form }: { form: Form }) {
  const { field } = useController({ control: form.control, name: 'recipePreparation' });
  return <RecipePreparation steps={field.value ?? []} />;
}

/** Editable renderer: mounts the step field-array and renders the addOCR empty state. */
function EditablePreparationField({
  form,
  stackMode,
  openModalForField,
  t,
}: PreparationFieldProps) {
  const { fields, addStep, length } = useStepArray(form);

  if (stackMode === recipeStateType.addOCR && length === 0) {
    return (
      <PreparationEmptyAdd
        prefixText={t('preparationReadOnly')}
        openModal={() => openModalForField(recipeColumnsNames.preparation)}
        onAddStep={addStep}
      />
    );
  }

  return (
    <PreparationSection prefixText={t('preparationReadOnly')} onAddStep={addStep}>
      {fields.map((field, index) => (
        <PreparationStepField key={field.id} form={form} index={index} t={t} />
      ))}
    </PreparationSection>
  );
}

/** Dispatches to the read-only or editable preparation renderer by stack mode. */
export function RecipePreparationField(props: PreparationFieldProps) {
  if (props.stackMode === recipeStateType.readOnly) {
    return <ReadOnlyPreparationField form={props.form} />;
  }
  return <EditablePreparationField {...props} />;
}
