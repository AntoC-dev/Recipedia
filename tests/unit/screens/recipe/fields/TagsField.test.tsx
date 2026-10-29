import React from 'react';
import { act, fireEvent } from '@testing-library/react-native';

import { recipeStateType } from '@customTypes/ScreenTypes';
import { RecipeTagsField } from '@screens/recipe/fields/TagsField';

import { Form, renderWithForm } from './fieldsTestHarness';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/organisms/RecipeTags', () => ({
  RecipeTags: require('@mocks/components/organisms/RecipeTags-mock').recipeTagsMock,
}));

describe('RecipeTagsField', () => {
  test('passes tags array to RecipeTags', async () => {
    const { getByTestId } = await renderWithForm(
      RecipeTagsField,
      form => ({
        form,
        stackMode: recipeStateType.edit,
        randomTags: ['quick'],
        addTag: jest.fn(),
        removeTag: jest.fn(),
        openModalForField: jest.fn(),
      }),
      { recipeTags: [{ id: 1, name: 'breakfast' }] }
    );
    expect(JSON.parse(getByTestId('RecipeTags::TagsList').props.children)).toEqual(['breakfast']);
  });

  test('addTag callback is forwarded', async () => {
    const addTag = jest.fn();
    const { getByTestId } = await renderWithForm(RecipeTagsField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      randomTags: [],
      addTag,
      removeTag: jest.fn(),
      openModalForField: jest.fn(),
    }));
    await fireEvent.press(getByTestId('RecipeTags::AddNewTag'));
    expect(addTag).toHaveBeenCalledWith('mockTag');
  });

  test('falls back to [] when form value is undefined', async () => {
    const { getByTestId, form } = await renderWithForm(RecipeTagsField, (f: Form) => ({
      form: f,
      stackMode: recipeStateType.edit,
      randomTags: [],
      addTag: jest.fn(),
      removeTag: jest.fn(),
      openModalForField: jest.fn(),
    }));
    await act(() => {
      form.setValue('recipeTags', undefined as never);
    });
    expect(JSON.parse(getByTestId('RecipeTags::TagsList').props.children)).toEqual([]);
  });
});
