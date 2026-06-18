import React from 'react';
import { act, fireEvent } from '@testing-library/react-native';

import { recipeStateType } from '@customTypes/ScreenTypes';
import { defaultValueNumber } from '@utils/Constants';
import { RecipeNutritionField } from '@screens/recipe/fields/NutritionField';

import { renderWithForm, t } from './fieldsTestHarness';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/molecules/NutritionTable', () =>
  require('@mocks/components/molecules/NutritionTable-mock')
);
jest.mock('@components/molecules/NutritionEmptyState', () =>
  require('@mocks/components/molecules/NutritionEmptyState-mock')
);

describe('RecipeNutritionField', () => {
  test('does not render nutrition table when value is undefined in readOnly mode', () => {
    const { queryByTestId } = renderWithForm(RecipeNutritionField, f => ({
      form: f,
      stackMode: recipeStateType.readOnly,
      openModalForField: jest.fn(),
      parentTestId: 'Recipe',
      t,
    }));
    expect(queryByTestId('Recipe::RecipeNutrition::NutritionTable')).toBeNull();
  });

  test('renders empty state in addManual mode when nutrition undefined', () => {
    const { getByTestId } = renderWithForm(RecipeNutritionField, f => ({
      form: f,
      stackMode: recipeStateType.addManual,
      openModalForField: jest.fn(),
      parentTestId: 'Recipe',
      t,
    }));
    expect(getByTestId('Recipe::RecipeNutrition::NutritionEmptyState')).toBeTruthy();
  });

  test('setRecipeNutrition writes through to form on edit', () => {
    const nutrition = {
      energyKcal: 200,
      energyKj: 836,
      fat: 5,
      saturatedFat: 1,
      carbohydrates: 30,
      sugars: 10,
      fiber: 2,
      protein: 6,
      salt: 0.5,
      portionWeight: 100,
    };
    const { getByTestId, form } = renderWithForm(
      RecipeNutritionField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        parentTestId: 'Recipe',
        t,
      }),
      { recipeNutrition: nutrition }
    );
    fireEvent.press(getByTestId('Recipe::RecipeNutrition::NutritionTable::OnNutritionChange'));
    expect(form.getValues('recipeNutrition')?.energyKcal).toBe(300);
  });

  test('renders nutrition table with form value in readOnly mode', () => {
    const nutrition = {
      energyKcal: 200,
      energyKj: 836,
      fat: 5,
      saturatedFat: 1,
      carbohydrates: 30,
      sugars: 10,
      fiber: 2,
      protein: 6,
      salt: 0.5,
      portionWeight: 100,
    };
    const { getByTestId } = renderWithForm(
      RecipeNutritionField,
      form => ({
        form,
        stackMode: recipeStateType.readOnly,
        openModalForField: jest.fn(),
        parentTestId: 'Recipe',
        t,
      }),
      { recipeNutrition: nutrition }
    );
    expect(getByTestId('Recipe::RecipeNutrition::NutritionTable')).toBeTruthy();
  });

  test('surfaces inline nutrition error after a cell edit dirties the table while another cell stays invalid', async () => {
    // energyKj stays at the sentinel (invalid); editing energyKcal dirties the
    // table without resolving the remaining error.
    const partial = {
      energyKcal: 200,
      energyKj: defaultValueNumber,
      fat: 5,
      saturatedFat: 1,
      carbohydrates: 30,
      sugars: 10,
      fiber: 2,
      protein: 6,
      salt: 0.5,
      portionWeight: 100,
    };
    const { getByTestId } = renderWithForm(
      RecipeNutritionField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        parentTestId: 'Recipe',
        t,
      }),
      { recipeNutrition: partial }
    );
    // The mock's OnNutritionChange commits { energyKcal: 300 } — a real change
    // from the default, so the field dirties; energyKj remains invalid.
    await act(async () => {
      fireEvent.press(getByTestId('Recipe::RecipeNutrition::NutritionTable::OnNutritionChange'));
    });
    expect(getByTestId('Recipe::RecipeNutrition::Error').props.children).toBe(
      'alerts.inlineErrors.nutrition'
    );
  });

  test('surfaces inline nutrition error after adding nutrition from an undefined default', async () => {
    const { getByTestId, queryByTestId, form } = renderWithForm(RecipeNutritionField, f => ({
      form: f,
      stackMode: recipeStateType.addManual,
      openModalForField: jest.fn(),
      parentTestId: 'Recipe',
      t,
    }));
    expect(queryByTestId('Recipe::RecipeNutrition::Error')).toBeNull();
    await act(async () => {
      fireEvent.press(getByTestId('Recipe::RecipeNutrition::NutritionEmptyState::OnAddNutrition'));
    });
    expect(form.getValues('recipeNutrition')?.energyKcal).toBe(defaultValueNumber);
    expect(getByTestId('Recipe::RecipeNutrition::Error').props.children).toBe(
      'alerts.inlineErrors.nutrition'
    );
  });

  test('does not show nutrition error when nested field is invalid but the table is untouched', async () => {
    const partial = {
      energyKcal: defaultValueNumber,
      energyKj: 400,
      fat: 5,
      saturatedFat: 1,
      carbohydrates: 30,
      sugars: 10,
      fiber: 2,
      protein: 6,
      salt: 0.5,
      portionWeight: 100,
    };
    const { queryByTestId, form } = renderWithForm(
      RecipeNutritionField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        parentTestId: 'Recipe',
        t,
      }),
      { recipeNutrition: partial }
    );
    await act(async () => {
      await form.trigger('recipeNutrition');
    });
    expect(queryByTestId('Recipe::RecipeNutrition::Error')).toBeNull();
  });
});
