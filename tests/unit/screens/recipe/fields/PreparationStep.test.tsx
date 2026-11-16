import { fireEvent, waitFor } from '@testing-library/react-native';

import { PreparationStepField } from '@screens/recipe/fields/PreparationStep';

import { renderWithForm, t } from './fieldsTestHarness';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/organisms/RecipePreparation', () => {
  const mocks = require('@mocks/components/organisms/RecipePreparation-mock');
  return { EditableStep: mocks.editableStepMock };
});

const titleInputId = 'RecipePreparation::EditableStep::0::TextInputTitle::CustomTextInput';
const descInputId = 'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput';
const descErrorId = 'RecipePreparation::EditableStep::0::DescriptionError';

const deleteButtonId = 'RecipePreparation::EditableStep::0::DeleteButton';
const deleteConfirmationId = 'RecipePreparation::EditableStep::0::DeleteConfirmation';

function renderStep(
  preparation: { title: string; description: string }[],
  onRemove: () => void = jest.fn()
) {
  return renderWithForm(PreparationStepField, form => ({ form, index: 0, t, onRemove }), {
    recipePreparation: preparation,
  });
}

describe('PreparationStepField', () => {
  describe('delete', () => {
    test('deletes a blank step at once without asking', async () => {
      const onRemove = jest.fn();
      const { getByTestId, queryByTestId } = await renderStep(
        [{ title: '', description: '' }],
        onRemove
      );

      await fireEvent.press(getByTestId(deleteButtonId));

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(queryByTestId(deleteConfirmationId)).toBeNull();
    });

    test('asks for confirmation before deleting a step with content', async () => {
      const onRemove = jest.fn();
      const { getByTestId } = await renderStep([{ title: 'Boil', description: '' }], onRemove);

      await fireEvent.press(getByTestId(deleteButtonId));

      expect(onRemove).not.toHaveBeenCalled();
      expect(getByTestId(`${deleteConfirmationId}::Title`)).toBeTruthy();
    });

    test('confirming deletes the step and closes the dialog', async () => {
      const onRemove = jest.fn();
      const { getByTestId, queryByTestId } = await renderStep(
        [{ title: 'Boil', description: 'Boil water' }],
        onRemove
      );

      await fireEvent.press(getByTestId(deleteButtonId));
      await fireEvent.press(getByTestId(`${deleteConfirmationId}::ConfirmButton`));

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(queryByTestId(`${deleteConfirmationId}::Title`)).toBeNull();
    });

    test('cancelling keeps the step untouched and closes the dialog', async () => {
      const onRemove = jest.fn();
      const { getByTestId, queryByTestId, form } = await renderStep(
        [{ title: 'Boil', description: 'Boil water' }],
        onRemove
      );

      await fireEvent.press(getByTestId(deleteButtonId));
      await fireEvent.press(getByTestId(`${deleteConfirmationId}::CancelButton`));

      expect(onRemove).not.toHaveBeenCalled();
      expect(queryByTestId(`${deleteConfirmationId}::Title`)).toBeNull();
      expect(form.getValues('recipePreparation')).toEqual([
        { title: 'Boil', description: 'Boil water' },
      ]);
    });

    test('the confirmation names the step by its 1-based number', async () => {
      const { t: interpolatingT } = require('@mocks/utils/i18n-mock').i18nMock().useI18n();
      const { getByTestId } = await renderWithForm(
        PreparationStepField,
        form => ({ form, index: 1, t: interpolatingT, onRemove: jest.fn() }),
        {
          recipePreparation: [
            { title: 'First', description: 'one' },
            { title: 'Second', description: 'two' },
          ],
        }
      );

      await fireEvent.press(getByTestId('RecipePreparation::EditableStep::1::DeleteButton'));

      expect(
        getByTestId('RecipePreparation::EditableStep::1::DeleteConfirmation::Title').props.children
      ).toBe('Delete step 2?');
      expect(
        getByTestId(
          'RecipePreparation::EditableStep::1::DeleteConfirmation::ConfirmButton::Children'
        ).props.children
      ).toBe('delete');
    });

    test('dismissing the confirmation keeps the step', async () => {
      const onRemove = jest.fn();
      const { getByTestId, queryByTestId } = await renderStep(
        [{ title: 'Boil', description: 'Boil water' }],
        onRemove
      );

      await fireEvent.press(getByTestId(deleteButtonId));
      await fireEvent(getByTestId(deleteConfirmationId), 'dismiss');

      expect(onRemove).not.toHaveBeenCalled();
      expect(queryByTestId(`${deleteConfirmationId}::Title`)).toBeNull();
    });

    test('deletes at once once the text of a filled step has been erased', async () => {
      const onRemove = jest.fn();
      const { getByTestId } = await renderStep([{ title: '', description: 'Boil' }], onRemove);

      await fireEvent.changeText(getByTestId(descInputId), '');
      await fireEvent.press(getByTestId(deleteButtonId));

      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    test('asks for confirmation once text is typed into a freshly added empty step', async () => {
      const onRemove = jest.fn();
      const { getByTestId } = await renderStep([{ title: '', description: '' }], onRemove);

      await fireEvent.changeText(getByTestId(descInputId), 'Now filled');
      await fireEvent.press(getByTestId(deleteButtonId));

      expect(onRemove).not.toHaveBeenCalled();
      expect(getByTestId(`${deleteConfirmationId}::Title`)).toBeTruthy();
    });
  });

  test('renders the title and description from the bound form value', async () => {
    const { getByTestId } = await renderStep([
      { title: 'Boil water', description: 'Until steaming' },
    ]);
    expect(getByTestId(titleInputId).props.value).toBe('Boil water');
    expect(getByTestId(descInputId).props.value).toBe('Until steaming');
  });

  test('falls back to empty strings when the bound step has no title or description', async () => {
    const { getByTestId } = await renderStep([{} as { title: string; description: string }]);
    expect(getByTestId(titleInputId).props.value).toBe('');
    expect(getByTestId(descInputId).props.value).toBe('');
  });

  test('typing a title commits live to the form value', async () => {
    const { getByTestId, form } = await renderStep([{ title: 'Old', description: 'desc' }]);

    await fireEvent.changeText(getByTestId(titleInputId), 'New title');

    expect(form.getValues('recipePreparation')![0]).toEqual({
      title: 'New title',
      description: 'desc',
    });
  });

  test('typing a description commits live to the form value', async () => {
    const { getByTestId, form } = await renderStep([{ title: 'Step', description: 'Old' }]);

    await fireEvent.changeText(getByTestId(descInputId), 'New description');

    expect(form.getValues('recipePreparation')![0]!.description).toBe('New description');
  });

  test('committing the title via blur writes the value to the form', async () => {
    const { getByTestId, form } = await renderStep([{ title: 'Step', description: 'desc' }]);

    await fireEvent(getByTestId(titleInputId), 'endEditing', {
      nativeEvent: { text: 'Committed title' },
    });

    expect(form.getValues('recipePreparation')![0]!.title).toBe('Committed title');
  });

  test('no inline description error surfaces before the step is touched', async () => {
    const { queryByTestId } = await renderStep([{ title: 'Step', description: '' }]);
    expect(queryByTestId(descErrorId)).toBeNull();
  });

  test('committing an empty description via blur surfaces the inline error', async () => {
    const { getByTestId } = await renderStep([{ title: 'Step', description: 'Filled' }]);

    await fireEvent(getByTestId(descInputId), 'endEditing', { nativeEvent: { text: '' } });

    await waitFor(() => {
      expect(getByTestId(descErrorId).props.children).toBeTruthy();
    });
  });

  test('typing a non-empty description after an error clears it', async () => {
    const { getByTestId, queryByTestId } = await renderStep([
      { title: 'Step', description: 'Filled' },
    ]);

    await fireEvent(getByTestId(descInputId), 'endEditing', { nativeEvent: { text: '' } });
    await waitFor(() => {
      expect(getByTestId(descErrorId).props.children).toBeTruthy();
    });

    await fireEvent(getByTestId(descInputId), 'endEditing', {
      nativeEvent: { text: 'Now filled' },
    });
    await waitFor(() => {
      expect(queryByTestId(descErrorId)).toBeNull();
    });
  });
});
