import { buildDefaultsFromRecipe } from '@screens/recipe/defaults/buildDefaultsFromRecipe';
import {
  ingredientType,
  nutritionTableElement,
  recipeTableElement,
} from '@customTypes/DatabaseElementTypes';

const nutrition: nutritionTableElement = {
  energyKcal: 200,
  energyKj: 837,
  fat: 10,
  saturatedFat: 3,
  carbohydrates: 20,
  sugars: 5,
  fiber: 2,
  protein: 8,
  salt: 1,
  portionWeight: 100,
};

const recipe: recipeTableElement = {
  id: 7,
  image_Source: 'file://tartiflette.jpg',
  title: 'Tartiflette',
  description: 'A cheesy dish',
  tags: [{ id: 1, name: 'comfort' }],
  persons: 6,
  ingredients: [
    {
      id: 2,
      name: 'Potato',
      unit: 'g',
      quantity: '800',
      type: ingredientType.vegetable,
      season: [],
    },
  ],
  season: ['winter'],
  preparation: [{ title: 'Step 1', description: 'Peel the potatoes' }],
  time: 45,
  nutrition,
};

describe('buildDefaultsFromRecipe', () => {
  test('maps every recipe column onto its form field', () => {
    expect(buildDefaultsFromRecipe(recipe)).toEqual({
      recipeImage: 'file://tartiflette.jpg',
      recipeTitle: 'Tartiflette',
      recipeDescription: 'A cheesy dish',
      recipeTags: recipe.tags,
      recipePersons: 6,
      recipeIngredients: recipe.ingredients,
      recipePreparation: recipe.preparation,
      recipeTime: 45,
      recipeNutrition: nutrition,
    });
  });

  test('passes tags, ingredients and preparation through by reference', () => {
    const result = buildDefaultsFromRecipe(recipe);
    expect(result.recipeTags).toBe(recipe.tags);
    expect(result.recipeIngredients).toBe(recipe.ingredients);
    expect(result.recipePreparation).toBe(recipe.preparation);
  });

  test('keeps nutrition undefined when the recipe has none', () => {
    const withoutNutrition: recipeTableElement = { ...recipe, nutrition: undefined };
    expect(buildDefaultsFromRecipe(withoutNutrition).recipeNutrition).toBeUndefined();
  });

  test('does not carry id, season or source columns into the form input', () => {
    const result = buildDefaultsFromRecipe(recipe);
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('season');
    expect(result).not.toHaveProperty('sourceUrl');
  });
});
