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

const recipeWithoutId: recipeTableElement = {
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

const ingredientWithoutId: ingredientTableElement = {
  name: 'Tomato',
  type: ingredientType.vegetable,
  unit: 'g',
  season: [],
};

const tagWithId: tagTableElement = { id: 3, name: 'Italian' };
const tagWithoutId: tagTableElement = { name: 'Italian' };

describe('getRecipeKey', () => {
  it('returns id as string when id is defined', () => {
    expect(getRecipeKey(recipeWithId)).toBe('42');
  });

  it('returns title when id is undefined', () => {
    expect(getRecipeKey(recipeWithoutId)).toBe('Pasta');
  });
});

describe('getSettingsItemKey', () => {
  it('returns id as string for ingredient with id', () => {
    expect(getSettingsItemKey(ingredientWithId)).toBe('7');
  });

  it('returns name for ingredient without id', () => {
    expect(getSettingsItemKey(ingredientWithoutId)).toBe('Tomato');
  });

  it('returns id as string for tag with id', () => {
    expect(getSettingsItemKey(tagWithId)).toBe('3');
  });

  it('returns name for tag without id', () => {
    expect(getSettingsItemKey(tagWithoutId)).toBe('Italian');
  });
});
