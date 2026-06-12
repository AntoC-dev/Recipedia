import React from 'react';
import { act, fireEvent } from '@testing-library/react-native';

import { recipeStateType } from '@customTypes/ScreenTypes';
import {
  RecipeDescriptionField,
  RecipeImageField,
  RecipeTitleField,
} from '@screens/recipe/fields/IdentityFields';

import { Form, renderWithForm, t } from './fieldsTestHarness';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/organisms/RecipeImage', () => ({
  RecipeImage: require('@mocks/components/organisms/RecipeImage-mock').recipeImageMock,
}));
jest.mock('@components/organisms/RecipeText', () => ({
  RecipeText: require('@mocks/components/organisms/RecipeText-mock').recipeTextMock,
}));

describe('RecipeImageField', () => {
  test('renders image from form value', () => {
    const { getByTestId } = renderWithForm(
      RecipeImageField,
      form => ({
        form,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
      }),
      { recipeImage: 'file:///a.jpg' }
    );
    expect(getByTestId('RecipeImage::ImgUri').props.children).toBe('file:///a.jpg');
  });

  test('falls back to empty string when value undefined', () => {
    const { getByTestId, form } = renderWithForm(RecipeImageField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: jest.fn(),
    }));
    act(() => {
      form.setValue('recipeImage', undefined as unknown as string);
    });
    expect(getByTestId('RecipeImage::ImgUri').props.children).toBe('');
  });

  test('forwards openModalForField to underlying RecipeImage', () => {
    const openModal = jest.fn();
    const { getByTestId } = renderWithForm(RecipeImageField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: openModal,
    }));
    fireEvent.press(getByTestId('RecipeImage::OpenModal'));
    expect(openModal).toHaveBeenCalled();
  });
});

describe('RecipeTitleField', () => {
  test('renders title from form value', () => {
    const { getByTestId } = renderWithForm(
      RecipeTitleField,
      form => ({
        form,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeTitle: 'Pancakes' }
    );
    expect(getByTestId('RecipeTitle::TextEditable').props.children).toBe('Pancakes');
  });

  test('setter writes through to form.setValue', () => {
    const { getByTestId, form } = renderWithForm(RecipeTitleField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: jest.fn(),
      t,
    }));
    fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'New Title');
    expect(form.getValues('recipeTitle')).toBe('New Title');
  });

  test('does not show error when user types without blurring', async () => {
    const { getByTestId, queryByTestId } = renderWithForm(
      RecipeTitleField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeTitle: 'Pancakes' }
    );
    await act(async () => {
      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), '');
    });
    expect(queryByTestId('RecipeTitle::Error')).toBeNull();
  });

  test('shows inline error once the user blurs an invalid field', async () => {
    const { getByTestId } = renderWithForm(
      RecipeTitleField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeTitle: 'Pancakes' }
    );
    await act(async () => {
      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), '');
    });
    await act(async () => {
      fireEvent.press(getByTestId('RecipeTitle::OnBlur'));
    });
    expect(getByTestId('RecipeTitle::Error').props.children).toBe(
      'alerts.inlineErrors.titleRecipe'
    );
  });

  test('keeps the title editable in addOCR mode after the scanned value is erased so the inline error surfaces', async () => {
    const { getByTestId, queryByTestId } = renderWithForm(
      RecipeTitleField,
      f => ({
        form: f,
        stackMode: recipeStateType.addOCR,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeTitle: 'Scanned Title' }
    );
    await act(async () => {
      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), '');
    });
    expect(queryByTestId('RecipeTitle::OpenModal')).toBeNull();
    await act(async () => {
      fireEvent.press(getByTestId('RecipeTitle::OnBlur'));
    });
    expect(getByTestId('RecipeTitle::Error').props.children).toBe(
      'alerts.inlineErrors.titleRecipe'
    );
  });

  test('does not show error when programmatic setValue does not mark the field touched', async () => {
    const { queryByTestId, form } = renderWithForm(
      RecipeTitleField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
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
    const { getByTestId, queryByTestId, form } = renderWithForm(
      RecipeTitleField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeTitle: 'Pancakes' }
    );
    await act(async () => {
      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), '');
    });
    await act(async () => {
      fireEvent.press(getByTestId('RecipeTitle::OnBlur'));
    });
    expect(getByTestId('RecipeTitle::Error').props.children).toBe(
      'alerts.inlineErrors.titleRecipe'
    );
    await act(async () => {
      form.reset({ ...form.getValues(), recipeTitle: 'Pancakes' });
    });
    expect(queryByTestId('RecipeTitle::Error')).toBeNull();
  });

  test('renders title field without inline error before submit', () => {
    const { queryByTestId } = renderWithForm(RecipeTitleField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: jest.fn(),
      t,
    }));
    expect(queryByTestId('RecipeTitle::Error')).toBeNull();
  });

  test('shows the OCR button in addOCR mode while the title is empty and untouched', () => {
    const { getByTestId, queryByTestId } = renderWithForm(RecipeTitleField, form => ({
      form,
      stackMode: recipeStateType.addOCR,
      openModalForField: jest.fn(),
      t,
    }));
    expect(getByTestId('RecipeTitle::OpenModal')).toBeTruthy();
    expect(queryByTestId('RecipeTitle::TextEditable')).toBeNull();
  });

  test('opens the OCR modal when the add button is pressed in addOCR mode', () => {
    const openModalForField = jest.fn();
    const { getByTestId } = renderWithForm(RecipeTitleField, form => ({
      form,
      stackMode: recipeStateType.addOCR,
      openModalForField,
      t,
    }));
    fireEvent.press(getByTestId('RecipeTitle::OpenModal'));
    expect(openModalForField).toHaveBeenCalled();
  });

  test('shows no editable input in readOnly mode', () => {
    const { queryByTestId } = renderWithForm(
      RecipeTitleField,
      form => ({
        form,
        stackMode: recipeStateType.readOnly,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeTitle: 'Pancakes' }
    );
    expect(queryByTestId('RecipeTitle::TextEditable')).toBeNull();
  });

  test('falls back to empty string when form value is undefined', () => {
    const { getByTestId, form } = renderWithForm(RecipeTitleField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: jest.fn(),
      t,
    }));
    act(() => {
      form.setValue('recipeTitle', undefined as never);
    });
    expect(getByTestId('RecipeTitle::TextEditable').props.children).toBe('');
  });
});

describe('RecipeDescriptionField', () => {
  test('renders description from form value', () => {
    const { getByTestId } = renderWithForm(
      RecipeDescriptionField,
      form => ({
        form,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeDescription: 'Fluffy' }
    );
    expect(getByTestId('RecipeDescription::TextEditable').props.children).toBe('Fluffy');
  });

  test('onBlur does not produce an error since description is optional', async () => {
    const { getByTestId, queryByTestId } = renderWithForm(RecipeDescriptionField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: jest.fn(),
      t,
    }));
    await act(async () => {
      fireEvent.press(getByTestId('RecipeDescription::OnBlur'));
    });
    expect(queryByTestId('RecipeDescription::Error')).toBeNull();
  });

  test('falls back to empty string when form value is undefined', () => {
    const { getByTestId, form } = renderWithForm(RecipeDescriptionField, (f: Form) => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: jest.fn(),
      t,
    }));
    act(() => {
      form.setValue('recipeDescription', undefined as never);
    });
    expect(getByTestId('RecipeDescription::TextEditable').props.children).toBe('');
  });
});
