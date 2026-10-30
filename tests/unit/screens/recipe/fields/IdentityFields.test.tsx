import { act, fireEvent } from '@testing-library/react-native';

import { recipeStateType } from '@customTypes/ScreenTypes';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import {
  RecipeDescriptionField,
  RecipeImageField,
  RecipeTitleField,
} from '@screens/recipe/fields/IdentityFields';

import { IMAGE_MODAL_TARGET_TEST_ID, Form, renderWithForm, t } from './fieldsTestHarness';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/organisms/RecipeImage', () => ({
  RecipeImage: require('@mocks/components/organisms/RecipeImage-mock').recipeImageMock,
}));
jest.mock('@components/organisms/RecipeText', () => ({
  RecipeText: require('@mocks/components/organisms/RecipeText-mock').recipeTextMock,
}));

describe('RecipeImageField', () => {
  test('renders image from form value', async () => {
    const { getByTestId } = await renderWithForm(
      RecipeImageField,
      form => ({
        form,
        stackMode: recipeStateType.edit,
      }),
      { recipeImage: 'file:///a.jpg' }
    );
    expect(getByTestId('RecipeImage::ImgUri').props.children).toBe('file:///a.jpg');
  });

  test('passes the stack mode button label key', async () => {
    const { getByTestId } = await renderWithForm(RecipeImageField, form => ({
      form,
      stackMode: recipeStateType.addOCR,
    }));
    expect(getByTestId('RecipeImage::OverlayButtonLabelKey').props.children).toBe(
      'recipe.roundButton.scan'
    );
  });

  test('falls back to empty string when value undefined', async () => {
    const { getByTestId, form } = await renderWithForm(RecipeImageField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
    }));
    await act(() => {
      form.setValue('recipeImage', undefined as unknown as string);
    });
    expect(getByTestId('RecipeImage::ImgUri').props.children).toBe('');
  });

  test('opens the image modal for the image field from the dialogs context', async () => {
    const { getByTestId } = await renderWithForm(RecipeImageField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
    }));
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID).props.children).toBe('none');
    await fireEvent.press(getByTestId('RecipeImage::OpenModal'));
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID).props.children).toBe(recipeColumnsNames.image);
  });
});

describe('RecipeTitleField', () => {
  test('renders title from form value', async () => {
    const { getByTestId } = await renderWithForm(
      RecipeTitleField,
      form => ({
        form,
        stackMode: recipeStateType.edit,
        t,
      }),
      { recipeTitle: 'Pancakes' }
    );
    expect(getByTestId('RecipeTitle::TextEditable').props.children).toBe('Pancakes');
  });

  test('setter writes through to form.setValue', async () => {
    const { getByTestId, form } = await renderWithForm(RecipeTitleField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      t,
    }));
    await fireEvent(getByTestId('RecipeTitle::SetTextToEdit'), 'press', 'New Title');
    expect(form.getValues('recipeTitle')).toBe('New Title');
  });

  test('does not show error when user types without blurring', async () => {
    const { getByTestId, queryByTestId } = await renderWithForm(
      RecipeTitleField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        t,
      }),
      { recipeTitle: 'Pancakes' }
    );
    await fireEvent(getByTestId('RecipeTitle::SetTextToEdit'), 'press', '');
    expect(queryByTestId('RecipeTitle::Error')).toBeNull();
  });

  test('shows inline error once the user blurs an invalid field', async () => {
    const { getByTestId } = await renderWithForm(
      RecipeTitleField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        t,
      }),
      { recipeTitle: 'Pancakes' }
    );
    await fireEvent(getByTestId('RecipeTitle::SetTextToEdit'), 'press', '');
    await fireEvent.press(getByTestId('RecipeTitle::OnBlur'));
    expect(getByTestId('RecipeTitle::Error').props.children).toBe(
      'alerts.inlineErrors.titleRecipe'
    );
  });

  test('keeps the title editable in addOCR mode after the scanned value is erased so the inline error surfaces', async () => {
    const { getByTestId } = await renderWithForm(
      RecipeTitleField,
      f => ({
        form: f,
        stackMode: recipeStateType.addOCR,
        t,
      }),
      { recipeTitle: 'Scanned Title' }
    );
    await act(async () => {
      await fireEvent(getByTestId('RecipeTitle::SetTextToEdit'), 'press', '');
    });
    expect(getByTestId('RecipeTitle::TextEditable')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(getByTestId('RecipeTitle::OnBlur'));
    });
    expect(getByTestId('RecipeTitle::Error').props.children).toBe(
      'alerts.inlineErrors.titleRecipe'
    );
  });

  test('does not show error when programmatic setValue does not mark the field touched', async () => {
    const { queryByTestId, form } = await renderWithForm(
      RecipeTitleField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        t,
      }),
      { recipeTitle: 'Pancakes' }
    );
    await act(async () => {
      form.setValue('recipeTitle', '', {
        shouldTouch: false,
        shouldValidate: true,
      });
    });
    expect(queryByTestId('RecipeTitle::Error')).toBeNull();
  });

  test('clears inline error after form.reset() wipes touchedFields', async () => {
    const { getByTestId, queryByTestId, form } = await renderWithForm(
      RecipeTitleField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        t,
      }),
      { recipeTitle: 'Pancakes' }
    );
    await fireEvent(getByTestId('RecipeTitle::SetTextToEdit'), 'press', '');
    await fireEvent.press(getByTestId('RecipeTitle::OnBlur'));
    expect(getByTestId('RecipeTitle::Error').props.children).toBe(
      'alerts.inlineErrors.titleRecipe'
    );
    await act(async () => {
      form.reset({ ...form.getValues(), recipeTitle: 'Pancakes' });
    });
    expect(queryByTestId('RecipeTitle::Error')).toBeNull();
  });

  test('renders title field without inline error before submit', async () => {
    const { queryByTestId } = await renderWithForm(RecipeTitleField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      t,
    }));
    expect(queryByTestId('RecipeTitle::Error')).toBeNull();
  });

  test('shows the OCR button in addOCR mode while the title is empty and untouched', async () => {
    const { getByTestId, queryByTestId } = await renderWithForm(RecipeTitleField, form => ({
      form,
      stackMode: recipeStateType.addOCR,
      t,
    }));
    expect(getByTestId('RecipeTitle::OpenModal')).toBeTruthy();
    expect(queryByTestId('RecipeTitle::TextEditable')).toBeNull();
  });

  test('shows the editable title input after tapping add manually in addOCR mode', async () => {
    const { getByTestId, queryByTestId } = await renderWithForm(RecipeTitleField, form => ({
      form,
      stackMode: recipeStateType.addOCR,
      t,
    }));
    await fireEvent.press(getByTestId('RecipeTitle::ManuallyFill'));
    expect(getByTestId('RecipeTitle::TextEditable')).toBeTruthy();
    expect(queryByTestId('RecipeTitle::ManuallyFill')).toBeNull();
  });

  test('keeps the title editable in addOCR mode after typing then clearing', async () => {
    const { getByTestId, queryByTestId } = await renderWithForm(RecipeTitleField, form => ({
      form,
      stackMode: recipeStateType.addOCR,
      t,
    }));
    await fireEvent.press(getByTestId('RecipeTitle::ManuallyFill'));
    await fireEvent(getByTestId('RecipeTitle::SetTextToEdit'), 'press', 'Pancakes');
    await fireEvent(getByTestId('RecipeTitle::SetTextToEdit'), 'press', '');
    expect(getByTestId('RecipeTitle::TextEditable')).toBeTruthy();
    expect(queryByTestId('RecipeTitle::ManuallyFill')).toBeNull();
  });

  test('opens the OCR modal for the title when the scan button is pressed in addOCR mode', async () => {
    const { getByTestId } = await renderWithForm(RecipeTitleField, form => ({
      form,
      stackMode: recipeStateType.addOCR,
      t,
    }));
    await fireEvent.press(getByTestId('RecipeTitle::OpenModal'));
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID).props.children).toBe(recipeColumnsNames.title);
  });

  test('shows no editable input in readOnly mode', async () => {
    const { queryByTestId } = await renderWithForm(
      RecipeTitleField,
      form => ({
        form,
        stackMode: recipeStateType.readOnly,
        t,
      }),
      { recipeTitle: 'Pancakes' }
    );
    expect(queryByTestId('RecipeTitle::TextEditable')).toBeNull();
  });

  test('falls back to empty string when form value is undefined', async () => {
    const { getByTestId, form } = await renderWithForm(RecipeTitleField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      t,
    }));
    await act(() => {
      form.setValue('recipeTitle', undefined as never);
    });
    expect(getByTestId('RecipeTitle::TextEditable').props.children).toBe('');
  });
});

describe('RecipeDescriptionField', () => {
  test('renders description from form value', async () => {
    const { getByTestId } = await renderWithForm(
      RecipeDescriptionField,
      form => ({
        form,
        stackMode: recipeStateType.edit,
        t,
      }),
      { recipeDescription: 'Fluffy' }
    );
    expect(getByTestId('RecipeDescription::TextEditable').props.children).toBe('Fluffy');
  });

  test('shows the editable description input after tapping add manually in addOCR mode', async () => {
    const { getByTestId, queryByTestId } = await renderWithForm(RecipeDescriptionField, form => ({
      form,
      stackMode: recipeStateType.addOCR,
      t,
    }));
    await fireEvent.press(getByTestId('RecipeDescription::ManuallyFill'));
    expect(getByTestId('RecipeDescription::TextEditable')).toBeTruthy();
    expect(queryByTestId('RecipeDescription::ManuallyFill')).toBeNull();
  });

  test('keeps the description editable in addOCR mode after typing then clearing', async () => {
    const { getByTestId, queryByTestId } = await renderWithForm(RecipeDescriptionField, form => ({
      form,
      stackMode: recipeStateType.addOCR,
      t,
    }));
    await fireEvent.press(getByTestId('RecipeDescription::ManuallyFill'));
    await fireEvent(getByTestId('RecipeDescription::SetTextToEdit'), 'press', 'Fluffy');
    await fireEvent(getByTestId('RecipeDescription::SetTextToEdit'), 'press', '');
    expect(getByTestId('RecipeDescription::TextEditable')).toBeTruthy();
    expect(queryByTestId('RecipeDescription::ManuallyFill')).toBeNull();
  });

  test('keeps the description editable in addOCR mode after the scanned value is erased', async () => {
    const { getByTestId, queryByTestId } = await renderWithForm(
      RecipeDescriptionField,
      f => ({
        form: f,
        stackMode: recipeStateType.addOCR,
        t,
      }),
      { recipeDescription: 'Scanned description' }
    );
    await act(async () => {
      await fireEvent(getByTestId('RecipeDescription::SetTextToEdit'), 'press', '');
    });
    expect(getByTestId('RecipeDescription::TextEditable')).toBeTruthy();
    expect(queryByTestId('RecipeDescription::ManuallyFill')).toBeNull();
  });

  test('onBlur does not produce an error since description is optional', async () => {
    const { getByTestId, queryByTestId } = await renderWithForm(RecipeDescriptionField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      t,
    }));
    await fireEvent.press(getByTestId('RecipeDescription::OnBlur'));
    expect(queryByTestId('RecipeDescription::Error')).toBeNull();
  });

  test('falls back to empty string when form value is undefined', async () => {
    const { getByTestId, form } = await renderWithForm(RecipeDescriptionField, (f: Form) => ({
      form: f,
      stackMode: recipeStateType.edit,
      t,
    }));
    await act(() => {
      form.setValue('recipeDescription', undefined as never);
    });
    expect(getByTestId('RecipeDescription::TextEditable').props.children).toBe('');
  });
});
