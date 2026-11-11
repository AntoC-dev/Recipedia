import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { recipeStateType } from '@customTypes/ScreenTypes';
import { RecipePreparationField } from '@screens/recipe/fields/PreparationField';

import {
  IMAGE_MODAL_TARGET_TEST_ID,
  pressDeleteStepAndConfirm,
  renderWithForm,
  t,
} from './fieldsTestHarness';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/organisms/RecipePreparation', () => {
  const mocks = require('@mocks/components/organisms/RecipePreparation-mock');
  return {
    RecipePreparation: mocks.recipePreparationMock,
    PreparationSection: mocks.preparationSectionMock,
    EditableStep: mocks.editableStepMock,
  };
});

describe('RecipePreparationField', () => {
  test('readOnly mode renders steps from form value via display organism', async () => {
    const steps = [{ title: 'Step 1', description: 'Mix' }];
    const { getByTestId } = await renderWithForm(
      RecipePreparationField,
      form => ({
        form,
        stackMode: recipeStateType.readOnly,
        t,
      }),
      { recipePreparation: steps }
    );
    expect(JSON.parse(getByTestId('RecipePreparation::Steps').props.children)).toEqual(steps);
  });

  test('edit mode appends a new step when the section add button is pressed', async () => {
    const { getByTestId, form } = await renderWithForm(
      RecipePreparationField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        t,
      }),
      { recipePreparation: [{ title: 'Step 1', description: 'Mix' }] }
    );
    await fireEvent.press(
      getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction')
    );
    expect(form.getValues('recipePreparation')).toHaveLength(2);
    expect(form.getValues('recipePreparation')![1]).toEqual({ title: '', description: '' });
  });

  test('addOCR mode + empty steps renders empty-add block with OCR + manual buttons', async () => {
    const { getByTestId } = await renderWithForm(
      RecipePreparationField,
      f => ({
        form: f,
        stackMode: recipeStateType.addOCR,
        t,
      }),
      { recipePreparation: [] }
    );
    await fireEvent.press(
      getByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
    );
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID).props.children).toBe('PREPARATION');
    expect(getByTestId('RecipePreparation::IsEmpty').props.children).toBe('true');
  });

  test('addOCR mode + non-empty steps keeps the scan button and opens the preparation modal', async () => {
    const { getByTestId } = await renderWithForm(
      RecipePreparationField,
      f => ({
        form: f,
        stackMode: recipeStateType.addOCR,
        t,
      }),
      { recipePreparation: [{ title: 'Step 1', description: 'Mix' }] }
    );
    await fireEvent.press(
      getByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
    );
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID).props.children).toBe('PREPARATION');
    expect(getByTestId('RecipePreparation::IsEmpty').props.children).toBe('false');
    expect(
      getByTestId('RecipePreparation::EditableStep::0::TextInputTitle::CustomTextInput')
    ).toBeTruthy();
  });

  test.each([recipeStateType.edit, recipeStateType.addManual])(
    '%s mode + empty steps keeps the new-step plus button and no scan button',
    async stackMode => {
      const { getByTestId, queryByTestId } = await renderWithForm(
        RecipePreparationField,
        f => ({ form: f, stackMode, t }),
        { recipePreparation: [] }
      );
      expect(getByTestId('RecipePreparation::IsEmpty').props.children).toBe('true');
      expect(
        queryByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
      ).toBeNull();
    }
  );

  test.each([recipeStateType.edit, recipeStateType.addManual])(
    '%s mode + non-empty steps does not render the scan button',
    async stackMode => {
      const { queryByTestId } = await renderWithForm(
        RecipePreparationField,
        f => ({ form: f, stackMode, t }),
        { recipePreparation: [{ title: 'Step 1', description: 'Mix' }] }
      );
      expect(
        queryByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
      ).toBeNull();
    }
  );

  describe('step reordering', () => {
    test('no reorder affordance is rendered in the editable step row', async () => {
      const { queryByTestId } = await renderWithForm(
        RecipePreparationField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
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

  describe('step deletion', () => {
    const stepA = { title: 'A', description: 'first' };
    const stepB = { title: 'B', description: 'second' };
    const stepC = { title: 'C', description: 'third' };
    const threeSteps = [stepA, stepB, stepC];

    async function renderEditableWithSteps(steps: { title: string; description: string }[]) {
      return renderWithForm(
        RecipePreparationField,
        f => ({ form: f, stackMode: recipeStateType.edit, t }),
        { recipePreparation: steps }
      );
    }

    test('confirming the deletion of a middle step shifts the following step into its place', async () => {
      const { getByTestId, queryByTestId } = await renderEditableWithSteps(threeSteps);

      await pressDeleteStepAndConfirm(getByTestId, 1);

      expect(
        getByTestId('RecipePreparation::EditableStep::1::TextInputTitle::CustomTextInput').props
          .value
      ).toBe('C');
      expect(queryByTestId('RecipePreparation::EditableStep::2')).toBeNull();
    });

    describe('mixing blank and filled steps', () => {
      const blankStep = { title: '', description: '' };
      const filledStep = { title: 'B', description: 'second' };

      test('deleting a filled step leaves no inline error on the untouched blank steps', async () => {
        const { getByTestId, queryByTestId } = await renderEditableWithSteps([
          blankStep,
          filledStep,
          blankStep,
        ]);

        await pressDeleteStepAndConfirm(getByTestId, 1);

        await waitFor(() => {
          expect(queryByTestId('RecipePreparation::EditableStep::0::DescriptionError')).toBeNull();
          expect(queryByTestId('RecipePreparation::EditableStep::1::DescriptionError')).toBeNull();
        });
      });

      test('a filled step shifted into the place of a deleted blank one still asks for confirmation', async () => {
        const { getByTestId, form } = await renderEditableWithSteps([blankStep, filledStep]);

        await fireEvent.press(getByTestId('RecipePreparation::EditableStep::0::DeleteButton'));
        await fireEvent.press(getByTestId('RecipePreparation::EditableStep::0::DeleteButton'));

        expect(form.getValues('recipePreparation')).toEqual([filledStep]);
        expect(
          getByTestId('RecipePreparation::EditableStep::0::DeleteConfirmation::Title')
        ).toBeTruthy();
      });
    });

    describe('confirmation dialog', () => {
      test('cancelling one step then deleting another removes only the second one', async () => {
        const { getByTestId, form } = await renderEditableWithSteps(threeSteps);

        await fireEvent.press(getByTestId('RecipePreparation::EditableStep::0::DeleteButton'));
        await fireEvent.press(
          getByTestId('RecipePreparation::EditableStep::0::DeleteConfirmation::CancelButton')
        );
        await pressDeleteStepAndConfirm(getByTestId, 2);

        expect(form.getValues('recipePreparation')).toEqual([stepA, stepB]);
      });

      test('no dialog stays open after the confirmed deletion shifts the next step into place', async () => {
        const { getByTestId, queryByTestId } = await renderEditableWithSteps(threeSteps);

        await pressDeleteStepAndConfirm(getByTestId, 1);

        expect(
          queryByTestId('RecipePreparation::EditableStep::1::DeleteConfirmation::Title')
        ).toBeNull();
      });
    });

    describe('inline errors', () => {
      async function renderWithSecondStepInError() {
        const rendered = await renderEditableWithSteps([stepA, stepB]);
        const secondDescription = rendered.getByTestId(
          'RecipePreparation::EditableStep::1::TextInputContent::CustomTextInput'
        );
        await fireEvent.changeText(secondDescription, '');
        await fireEvent(secondDescription, 'endEditing', { nativeEvent: { text: '' } });
        await waitFor(() => {
          expect(
            rendered.getByTestId('RecipePreparation::EditableStep::1::DescriptionError')
          ).toBeTruthy();
        });
        return rendered;
      }

      test('an inline error follows its step when a step before it is deleted', async () => {
        const { getByTestId, queryByTestId } = await renderWithSecondStepInError();

        await pressDeleteStepAndConfirm(getByTestId, 0);

        await waitFor(() => {
          expect(getByTestId('RecipePreparation::EditableStep::0::DescriptionError')).toBeTruthy();
        });
        expect(queryByTestId('RecipePreparation::EditableStep::1')).toBeNull();
      });

      test('deleting the step with an inline error clears that error', async () => {
        const { getByTestId, queryByTestId } = await renderWithSecondStepInError();

        await pressDeleteStepAndConfirm(getByTestId, 1);

        await waitFor(() => {
          expect(queryByTestId('RecipePreparation::EditableStep::0::DescriptionError')).toBeNull();
        });
      });
    });

    test('deleting every step in addOCR mode empties the list and switches the add button to add manually', async () => {
      const { getByTestId, queryByTestId } = await renderWithForm(
        RecipePreparationField,
        f => ({ form: f, stackMode: recipeStateType.addOCR, t }),
        { recipePreparation: [stepA] }
      );

      await pressDeleteStepAndConfirm(getByTestId, 0);

      expect(queryByTestId('RecipePreparation::EditableStep::0')).toBeNull();
      expect(getByTestId('RecipePreparation::IsEmpty').props.children).toBe('true');
      expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toBe(
        'pencil'
      );
    });
  });

  test('committing a step title via blur writes only to that row in the form value', async () => {
    const { getByTestId, form } = await renderWithForm(
      RecipePreparationField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
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
    await fireEvent(titleInput, 'endEditing', { nativeEvent: { text: 'Updated step 2 title' } });
    const prep = form.getValues('recipePreparation')!;
    expect(prep[0]).toEqual({ title: 'Step 1', description: 'Mix' });
    expect(prep[1]).toEqual({ title: 'Updated step 2 title', description: 'Bake' });
  });

  describe('live commit', () => {
    test('typing a step title commits to the form without blur', async () => {
      const { getByTestId, form } = await renderWithForm(
        RecipePreparationField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
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
      await fireEvent.changeText(titleInput, 'Live step 2 title');
      const prep = form.getValues('recipePreparation')!;
      expect(prep[0]).toEqual({ title: 'Step 1', description: 'Mix' });
      expect(prep[1]).toEqual({ title: 'Live step 2 title', description: 'Bake' });
    });

    test('typing a step description commits to the form without blur', async () => {
      const { getByTestId, form } = await renderWithForm(
        RecipePreparationField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          t,
        }),
        { recipePreparation: [{ title: 'Step 1', description: 'Mix' }] }
      );
      const descInput = getByTestId(
        'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
      );
      await fireEvent.changeText(descInput, 'Live description');
      expect(form.getValues('recipePreparation')![0]!.description).toBe('Live description');
    });

    test('typing does not mark the step touched, so no inline error surfaces', async () => {
      const { getByTestId, queryByTestId } = await renderWithForm(
        RecipePreparationField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          t,
        }),
        { recipePreparation: [{ title: 'Step 1', description: 'Mix' }] }
      );
      const descInput = getByTestId(
        'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
      );
      await fireEvent.changeText(descInput, '');
      expect(queryByTestId('RecipePreparation::EditableStep::0::DescriptionError')).toBeNull();
    });
  });

  describe('inline error', () => {
    test('does not surface a description error before the step has been touched', async () => {
      const { queryByTestId } = await renderWithForm(
        RecipePreparationField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          t,
        }),
        { recipePreparation: [{ title: 'Step 1', description: '' }] }
      );
      expect(queryByTestId('RecipePreparation::EditableStep::0::DescriptionError')).toBeNull();
    });

    test('surfaces a description error after the description input has been blurred empty', async () => {
      const { getByTestId } = await renderWithForm(
        RecipePreparationField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          t,
        }),
        { recipePreparation: [{ title: 'Step 1', description: 'Mix' }] }
      );
      const descInput = getByTestId(
        'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
      );
      await fireEvent(descInput, 'endEditing', { nativeEvent: { text: '' } });
      await waitFor(() => {
        expect(
          getByTestId('RecipePreparation::EditableStep::0::DescriptionError').props.children
        ).toBeTruthy();
      });
    });

    test('clears the description error once the user types a non-empty description', async () => {
      const { getByTestId, queryByTestId } = await renderWithForm(
        RecipePreparationField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          t,
        }),
        { recipePreparation: [{ title: 'Step 1', description: 'Mix' }] }
      );
      const descInput = getByTestId(
        'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
      );
      await fireEvent(descInput, 'endEditing', { nativeEvent: { text: '' } });
      await waitFor(() => {
        expect(
          getByTestId('RecipePreparation::EditableStep::0::DescriptionError').props.children
        ).toBeTruthy();
      });
      await fireEvent(descInput, 'endEditing', { nativeEvent: { text: 'Now filled' } });
      await waitFor(() => {
        expect(queryByTestId('RecipePreparation::EditableStep::0::DescriptionError')).toBeNull();
      });
    });
  });
});
