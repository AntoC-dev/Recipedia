import { act, fireEvent, waitFor } from '@testing-library/react-native';

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

function renderStep(preparation: { title: string; description: string }[]) {
  return renderWithForm(PreparationStepField, form => ({ form, index: 0, t }), {
    recipePreparation: preparation,
  });
}

describe('PreparationStepField', () => {
  test('renders the title and description from the bound form value', () => {
    const { getByTestId } = renderStep([{ title: 'Boil water', description: 'Until steaming' }]);
    expect(getByTestId(titleInputId).props.value).toBe('Boil water');
    expect(getByTestId(descInputId).props.value).toBe('Until steaming');
  });

  test('falls back to empty strings when the bound step has no title or description', () => {
    const { getByTestId } = renderStep([{} as { title: string; description: string }]);
    expect(getByTestId(titleInputId).props.value).toBe('');
    expect(getByTestId(descInputId).props.value).toBe('');
  });

  test('typing a title commits live to the form value', () => {
    const { getByTestId, form } = renderStep([{ title: 'Old', description: 'desc' }]);

    act(() => {
      fireEvent.changeText(getByTestId(titleInputId), 'New title');
    });

    expect(form.getValues('recipePreparation')![0]).toEqual({
      title: 'New title',
      description: 'desc',
    });
  });

  test('typing a description commits live to the form value', () => {
    const { getByTestId, form } = renderStep([{ title: 'Step', description: 'Old' }]);

    act(() => {
      fireEvent.changeText(getByTestId(descInputId), 'New description');
    });

    expect(form.getValues('recipePreparation')![0]!.description).toBe('New description');
  });

  test('committing the title via blur writes the value to the form', () => {
    const { getByTestId, form } = renderStep([{ title: 'Step', description: 'desc' }]);

    act(() => {
      fireEvent(getByTestId(titleInputId), 'endEditing', {
        nativeEvent: { text: 'Committed title' },
      });
    });

    expect(form.getValues('recipePreparation')![0]!.title).toBe('Committed title');
  });

  test('no inline description error surfaces before the step is touched', () => {
    const { queryByTestId } = renderStep([{ title: 'Step', description: '' }]);
    expect(queryByTestId(descErrorId)).toBeNull();
  });

  test('committing an empty description via blur surfaces the inline error', async () => {
    const { getByTestId } = renderStep([{ title: 'Step', description: 'Filled' }]);

    await act(async () => {
      fireEvent(getByTestId(descInputId), 'endEditing', { nativeEvent: { text: '' } });
    });

    await waitFor(() => {
      expect(getByTestId(descErrorId).props.children).toBeTruthy();
    });
  });

  test('typing a non-empty description after an error clears it', async () => {
    const { getByTestId, queryByTestId } = renderStep([{ title: 'Step', description: 'Filled' }]);

    await act(async () => {
      fireEvent(getByTestId(descInputId), 'endEditing', { nativeEvent: { text: '' } });
    });
    await waitFor(() => {
      expect(getByTestId(descErrorId).props.children).toBeTruthy();
    });

    await act(async () => {
      fireEvent(getByTestId(descInputId), 'endEditing', { nativeEvent: { text: 'Now filled' } });
    });
    await waitFor(() => {
      expect(queryByTestId(descErrorId)).toBeNull();
    });
  });
});
