import React from 'react';
import { act, fireEvent } from '@testing-library/react-native';

import { recipeStateType } from '@customTypes/ScreenTypes';
import { defaultValueNumber } from '@utils/Constants';
import { RecipePersonsField, RecipeTimeField } from '@screens/recipe/fields/QuantityFields';

import { Form, renderWithForm, t } from './fieldsTestHarness';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/organisms/RecipeNumber', () => ({
  RecipeNumber: require('@mocks/components/organisms/RecipeNumber-mock').recipeNumberMock,
}));

describe('RecipePersonsField', () => {
  test('renders persons from form value', () => {
    const { getByTestId } = renderWithForm(
      RecipePersonsField,
      form => ({
        form,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipePersons: 4 }
    );
    expect(getByTestId('RecipePersons::TextEditable').props.children).toBe(4);
  });

  test('shows inline error after user blurs persons set to sentinel', async () => {
    const { getByTestId } = renderWithForm(
      RecipePersonsField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipePersons: 4 }
    );
    await act(async () => {
      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), defaultValueNumber);
    });
    await act(async () => {
      fireEvent.press(getByTestId('RecipePersons::OnBlur'));
    });
    expect(getByTestId('RecipePersons::Error').props.children).toBe(
      'alerts.inlineErrors.titlePersons'
    );
  });

  test('setter writes value to form', () => {
    const { getByTestId, form } = renderWithForm(RecipePersonsField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: jest.fn(),
      t,
    }));
    fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), '6');
    expect(form.getValues('recipePersons')).toBe(6);
  });

  test('falls back to sentinel when form value is undefined', () => {
    const { getByTestId, form } = renderWithForm(RecipePersonsField, (f: Form) => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: jest.fn(),
      t,
    }));
    act(() => {
      form.setValue('recipePersons', undefined as never);
    });
    expect(getByTestId('RecipePersons::TextEditable').props.children).toBe(defaultValueNumber);
  });
});

describe('RecipeTimeField', () => {
  test('renders time from form value', () => {
    const { getByTestId } = renderWithForm(
      RecipeTimeField,
      form => ({
        form,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeTime: 30 }
    );
    expect(getByTestId('RecipeTime::TextEditable').props.children).toBe(30);
  });

  test('shows inline error after user blurs time set to sentinel', async () => {
    const { getByTestId } = renderWithForm(
      RecipeTimeField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeTime: 30 }
    );
    await act(async () => {
      fireEvent.press(getByTestId('RecipeTime::SetTextToEdit'), defaultValueNumber);
    });
    await act(async () => {
      fireEvent.press(getByTestId('RecipeTime::OnBlur'));
    });
    expect(getByTestId('RecipeTime::Error').props.children).toBe('alerts.inlineErrors.titleTime');
  });

  test('falls back to sentinel when form value is undefined', () => {
    const { getByTestId, form } = renderWithForm(RecipeTimeField, (f: Form) => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: jest.fn(),
      t,
    }));
    act(() => {
      form.setValue('recipeTime', undefined as never);
    });
    expect(getByTestId('RecipeTime::TextEditable').props.children).toBe(defaultValueNumber);
  });
});
