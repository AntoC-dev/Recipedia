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
  test('renders persons from form value', async () => {
    const { getByTestId } = await renderWithForm(
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
    const { getByTestId } = await renderWithForm(
      RecipePersonsField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipePersons: 4 }
    );
    await fireEvent(getByTestId('RecipePersons::SetTextToEdit'), 'press', defaultValueNumber);
    await fireEvent.press(getByTestId('RecipePersons::OnBlur'));
    expect(getByTestId('RecipePersons::Error').props.children).toBe(
      'alerts.inlineErrors.titlePersons'
    );
  });

  test('setter writes value to form', async () => {
    const { getByTestId, form } = await renderWithForm(RecipePersonsField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: jest.fn(),
      t,
    }));
    await fireEvent(getByTestId('RecipePersons::SetTextToEdit'), 'press', '6');
    expect(form.getValues('recipePersons')).toBe(6);
  });

  test('falls back to sentinel when form value is undefined', async () => {
    const { getByTestId, form } = await renderWithForm(RecipePersonsField, (f: Form) => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: jest.fn(),
      t,
    }));
    await act(() => {
      form.setValue('recipePersons', undefined as never);
    });
    expect(getByTestId('RecipePersons::TextEditable').props.children).toBe(defaultValueNumber);
  });
});

describe('RecipeTimeField', () => {
  test('renders time from form value', async () => {
    const { getByTestId } = await renderWithForm(
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
    const { getByTestId } = await renderWithForm(
      RecipeTimeField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeTime: 30 }
    );
    await fireEvent(getByTestId('RecipeTime::SetTextToEdit'), 'press', defaultValueNumber);
    await fireEvent.press(getByTestId('RecipeTime::OnBlur'));
    expect(getByTestId('RecipeTime::Error').props.children).toBe('alerts.inlineErrors.titleTime');
  });

  test('falls back to sentinel when form value is undefined', async () => {
    const { getByTestId, form } = await renderWithForm(RecipeTimeField, (f: Form) => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: jest.fn(),
      t,
    }));
    await act(() => {
      form.setValue('recipeTime', undefined as never);
    });
    expect(getByTestId('RecipeTime::TextEditable').props.children).toBe(defaultValueNumber);
  });
});
