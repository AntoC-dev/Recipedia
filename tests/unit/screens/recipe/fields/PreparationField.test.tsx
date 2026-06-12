import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';

import { recipeStateType } from '@customTypes/ScreenTypes';
import { RecipePreparationField } from '@screens/recipe/fields/PreparationField';

import { renderWithForm, t } from './fieldsTestHarness';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/organisms/RecipePreparation', () => {
  const mocks = require('@mocks/components/organisms/RecipePreparation-mock');
  return {
    RecipePreparation: mocks.recipePreparationMock,
    PreparationSection: mocks.preparationSectionMock,
    PreparationEmptyAdd: mocks.preparationEmptyAddMock,
    EditableStep: mocks.editableStepMock,
  };
});

describe('RecipePreparationField', () => {
  test('readOnly mode renders steps from form value via display organism', () => {
    const steps = [{ title: 'Step 1', description: 'Mix' }];
    const { getByTestId } = renderWithForm(
      RecipePreparationField,
      form => ({
        form,
        stackMode: recipeStateType.readOnly,
        openModalForField: jest.fn(),
        t,
      }),
      { recipePreparation: steps }
    );
    expect(JSON.parse(getByTestId('RecipePreparation::Steps').props.children)).toEqual(steps);
  });

  test('edit mode appends a new step when the section add button is pressed', () => {
    const { getByTestId, form } = renderWithForm(
      RecipePreparationField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipePreparation: [{ title: 'Step 1', description: 'Mix' }] }
    );
    fireEvent.press(getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction'));
    expect(form.getValues('recipePreparation')).toHaveLength(2);
    expect(form.getValues('recipePreparation')![1]).toEqual({ title: '', description: '' });
  });

  test('addOCR mode + empty steps renders empty-add block with OCR + manual buttons', () => {
    const openModal = jest.fn();
    const { getByTestId } = renderWithForm(
      RecipePreparationField,
      f => ({
        form: f,
        stackMode: recipeStateType.addOCR,
        openModalForField: openModal,
        t,
      }),
      { recipePreparation: [] }
    );
    fireEvent.press(getByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction'));
    expect(openModal).toHaveBeenCalledWith('PREPARATION');
  });

  test('addOCR mode + non-empty steps renders the editable section with rows', () => {
    const { queryByTestId, getByTestId } = renderWithForm(
      RecipePreparationField,
      f => ({
        form: f,
        stackMode: recipeStateType.addOCR,
        openModalForField: jest.fn(),
        t,
      }),
      { recipePreparation: [{ title: 'Step 1', description: 'Mix' }] }
    );
    expect(queryByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')).toBeNull();
    expect(
      getByTestId('RecipePreparation::EditableStep::0::TextInputTitle::CustomTextInput')
    ).toBeTruthy();
  });

  describe('step reordering', () => {
    test('no reorder affordance is rendered in the editable step row', () => {
      const { queryByTestId } = renderWithForm(
        RecipePreparationField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          openModalForField: jest.fn(),
          t,
        }),
        {
          recipePreparation: [
            { title: 'A', description: 'first' },
            { title: 'B', description: 'second' },
            { title: 'C', description: 'third' },
          ],
        }
      );
      expect(queryByTestId('RecipePreparation::EditableStep::0::MoveUp')).toBeNull();
      expect(queryByTestId('RecipePreparation::EditableStep::0::MoveDown')).toBeNull();
      expect(queryByTestId('RecipePreparation::EditableStep::0::DragHandle')).toBeNull();
    });
  });

  test('committing a step title via blur writes only to that row in the form value', () => {
    const { getByTestId, form } = renderWithForm(
      RecipePreparationField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      {
        recipePreparation: [
          { title: 'Step 1', description: 'Mix' },
          { title: 'Step 2', description: 'Bake' },
        ],
      }
    );
    const titleInput = getByTestId(
      'RecipePreparation::EditableStep::1::TextInputTitle::CustomTextInput'
    );
    act(() => {
      fireEvent(titleInput, 'endEditing', { nativeEvent: { text: 'Updated step 2 title' } });
    });
    const prep = form.getValues('recipePreparation')!;
    expect(prep[0]).toEqual({ title: 'Step 1', description: 'Mix' });
    expect(prep[1]).toEqual({ title: 'Updated step 2 title', description: 'Bake' });
  });

  describe('inline error', () => {
    test('does not surface a description error before the step has been touched', () => {
      const { queryByTestId } = renderWithForm(
        RecipePreparationField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          openModalForField: jest.fn(),
          t,
        }),
        { recipePreparation: [{ title: 'Step 1', description: '' }] }
      );
      expect(queryByTestId('RecipePreparation::EditableStep::0::DescriptionError')).toBeNull();
    });

    test('surfaces a description error after the description input has been blurred empty', async () => {
      const { getByTestId } = renderWithForm(
        RecipePreparationField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          openModalForField: jest.fn(),
          t,
        }),
        { recipePreparation: [{ title: 'Step 1', description: 'Mix' }] }
      );
      const descInput = getByTestId(
        'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
      );
      await act(async () => {
        fireEvent(descInput, 'endEditing', { nativeEvent: { text: '' } });
      });
      await waitFor(() => {
        expect(
          getByTestId('RecipePreparation::EditableStep::0::DescriptionError').props.children
        ).toBeTruthy();
      });
    });

    test('clears the description error once the user types a non-empty description', async () => {
      const { getByTestId, queryByTestId } = renderWithForm(
        RecipePreparationField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          openModalForField: jest.fn(),
          t,
        }),
        { recipePreparation: [{ title: 'Step 1', description: 'Mix' }] }
      );
      const descInput = getByTestId(
        'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
      );
      await act(async () => {
        fireEvent(descInput, 'endEditing', { nativeEvent: { text: '' } });
      });
      await waitFor(() => {
        expect(
          getByTestId('RecipePreparation::EditableStep::0::DescriptionError').props.children
        ).toBeTruthy();
      });
      await act(async () => {
        fireEvent(descInput, 'endEditing', { nativeEvent: { text: 'Now filled' } });
      });
      await waitFor(() => {
        expect(queryByTestId('RecipePreparation::EditableStep::0::DescriptionError')).toBeNull();
      });
    });
  });
});
