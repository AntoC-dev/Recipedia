/**
 * PreparationStepField - single editable preparation step bound to its own
 * form controllers.
 *
 * Subscribing each row to `recipePreparation.{index}.{title|description}`
 * means a keystroke commit in one row only re-renders that row's two
 * controllers — sibling rows stay mounted with their own local input state
 * and never re-render. This is what stops the O(N) cascade the bulk
 * `setValue('recipePreparation', ...)` pattern used to trigger.
 *
 * The row's delete button removes a blank step at once and asks for
 * confirmation before removing a step that holds a title or description.
 *
 * @module screens/recipe/fields/PreparationStep
 */

import React, { useState } from 'react';
import { useController, UseFormReturn } from 'react-hook-form';

import { EditableStep } from '@components/organisms/RecipePreparation';
import { ConfirmationDialog } from '@components/dialogs/ConfirmationDialog';
import { isPreparationStepBlank } from '@utils/RecipeFormHelpers';
import { RecipeFormInput } from '@schemas/recipeFormSchema';
import { useInlineErrorFor } from '@screens/recipe/helpers/inlineErrorGate';

type Form = UseFormReturn<RecipeFormInput>;
type T = (key: string, options?: Record<string, unknown>) => string;

export interface PreparationStepFieldProps {
  form: Form;
  index: number;
  t: T;
  onRemove: () => void;
}

export function PreparationStepField({ form, index, t, onRemove }: PreparationStepFieldProps) {
  const titleCtrl = useController({
    control: form.control,
    name: `recipePreparation.${index}.title` as const,
  });
  const descriptionCtrl = useController({
    control: form.control,
    name: `recipePreparation.${index}.description` as const,
  });
  // Schema only validates the step's description (min 1 char). Title accepts
  // empty strings, so no inline gate is wired for it.
  const { error: descriptionError } = useInlineErrorFor(
    `recipePreparation.${index}.description` as const,
    t
  );
  // `onChange` writes the value on every keystroke without marking the
  // controller touched, so the form stays in sync even when the keyboard is
  // dismissed without a blur. The commit handlers additionally call `onBlur`,
  // which lets RHF's `mode: 'onTouched'` re-run validation and open the inline
  // gate the first time the user actually finishes editing the step.

  /** Commits the step title and marks its controller touched. */
  const handleTitleCommit = (value: string) => {
    titleCtrl.field.onChange(value);
    titleCtrl.field.onBlur();
  };
  /** Commits the step description and marks its controller touched. */
  const handleDescriptionCommit = (value: string) => {
    descriptionCtrl.field.onChange(value);
    descriptionCtrl.field.onBlur();
  };
  const title = titleCtrl.field.value ?? '';
  const description = descriptionCtrl.field.value ?? '';
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const handleRemovePress = () => {
    if (isPreparationStepBlank({ title, description })) {
      onRemove();
      return;
    }
    setDeleteConfirmVisible(true);
  };
  const handleDeleteConfirm = () => {
    setDeleteConfirmVisible(false);
    onRemove();
  };

  return (
    <>
      <EditableStep
        index={index}
        title={title}
        description={description}
        onTitleChange={titleCtrl.field.onChange}
        onDescriptionChange={descriptionCtrl.field.onChange}
        onTitleCommit={handleTitleCommit}
        onDescriptionCommit={handleDescriptionCommit}
        onRemove={handleRemovePress}
        descriptionError={descriptionError}
      />
      {isDeleteConfirmVisible ? (
        <ConfirmationDialog
          testId={`RecipePreparation::EditableStep::${index}::DeleteConfirmation`}
          isVisible={true}
          title={t('preparationDeleteStepConfirmTitle', { number: index + 1 })}
          content={t('preparationDeleteStepConfirmContent')}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirmVisible(false)}
        />
      ) : null}
    </>
  );
}
