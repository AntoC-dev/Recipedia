import { getRecipeKey, getSettingsItemKey } from '@utils/listUtils';
import {
  recipeTableElement,
  ingredientTableElement,
  tagTableElement,
  ingredientType,
} from '@customTypes/DatabaseElementTypes';

const recipeWithId: recipeTableElement = {
  id: 42,
  title: 'Pasta',
  description: '',
  image_Source: '',
  persons: 2,
  time: 0,
  season: [],
  tags: [],
  ingredients: [],
  preparation: [],
};

const ingredientWithId: ingredientTableElement = {
  id: 7,
  name: 'Tomato',
  type: ingredientType.vegetable,
  unit: 'g',
  season: [],
};

const tagWithId: tagTableElement = { id: 3, name: 'Italian' };

describe('getRecipeKey', () => {
  it('returns id as string', () => {
    expect(getRecipeKey(recipeWithId)).toBe('42');
  });
});

describe('getSettingsItemKey', () => {
  it('returns id as string for ingredient', () => {
    expect(getSettingsItemKey(ingredientWithId)).toBe('7');
  });

  it('returns id as string for tag', () => {
    expect(getSettingsItemKey(tagWithId)).toBe('3');
  });
});
