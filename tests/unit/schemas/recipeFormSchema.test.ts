import { recipeFormSchema } from '@schemas/recipeFormSchema';
import { ingredientType } from '@customTypes/DatabaseElementTypes';
import { defaultValueNumber } from '@utils/Constants';

const validIngredient = {
  name: 'Flour',
  quantity: '2',
  unit: 'cups',
  type: ingredientType.baking,
  season: [],
};

const validRecipe = {
  recipeImage: 'file:///image.jpg',
  recipeTitle: 'Pancakes',
  recipeDescription: 'Fluffy',
  recipeTags: [{ name: 'breakfast' }],
  recipePersons: 4,
  recipeIngredients: [validIngredient],
  recipePreparation: [{ title: 'Mix', description: 'Mix all' }],
  recipeTime: 20,
};

describe('recipeFormSchema', () => {
  test('passes with a fully valid recipe', () => {
    const result = recipeFormSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });

  test('fails when image is empty', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, recipeImage: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe('alerts.missingElements.image');
    }
  });

  test('fails when image is whitespace only', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, recipeImage: '   ' });
    expect(result.success).toBe(false);
  });

  test('fails when title is empty', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, recipeTitle: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe('alerts.missingElements.titleRecipe');
    }
  });

  test('fails when title is whitespace only', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, recipeTitle: '  ' });
    expect(result.success).toBe(false);
  });

  test('fails when ingredients array is empty', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, recipeIngredients: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe('alerts.missingElements.titleIngredients');
    }
  });

  test('fails when an ingredient is missing name', () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      recipeIngredients: [{ ...validIngredient, name: '' }],
    });
    expect(result.success).toBe(false);
  });

  test('fails when an ingredient is missing quantity', () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      recipeIngredients: [{ ...validIngredient, quantity: '' }],
    });
    expect(result.success).toBe(false);
  });

  test('fails when an ingredient is missing type', () => {
    const { type: _unused, ...rest } = validIngredient;
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      recipeIngredients: [rest],
    });
    expect(result.success).toBe(false);
  });

  test('fails when an ingredient is missing season', () => {
    const { season: _unused, ...rest } = validIngredient;
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      recipeIngredients: [rest],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.join('.') === 'recipeIngredients.0.season')).toBe(
        true
      );
    }
  });

  test('passes when an ingredient has season set to an empty array', () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      recipeIngredients: [{ ...validIngredient, season: [] }],
    });
    expect(result.success).toBe(true);
  });

  test('fails when persons is sentinel', () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      recipePersons: defaultValueNumber,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe('alerts.missingElements.titlePersons');
    }
  });

  test('fails when time is sentinel', () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      recipeTime: defaultValueNumber,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe('alerts.missingElements.titleTime');
    }
  });

  test('fails when preparation array is empty', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, recipePreparation: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe('alerts.missingElements.titlePreparation');
    }
  });

  test('fails when any preparation step has an empty description', () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      recipePreparation: [
        { title: 'Step 1', description: 'Mix everything' },
        { title: 'Step 2', description: '' },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe('alerts.missingElements.titlePreparation');
      expect(result.error.issues[0]!.path).toEqual(['recipePreparation', 1, 'description']);
    }
  });

  test('fails when any preparation step description is whitespace only', () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      recipePreparation: [{ title: 'Step 1', description: '   ' }],
    });
    expect(result.success).toBe(false);
  });

  test('passes with nutrition omitted', () => {
    const result = recipeFormSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });

  test('passes with valid nutrition', () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      recipeNutrition: {
        energyKcal: 100,
        energyKj: 418,
        fat: 1,
        saturatedFat: 0.5,
        carbohydrates: 20,
        sugars: 5,
        fiber: 2,
        protein: 3,
        salt: 0.1,
        portionWeight: 100,
      },
    });
    expect(result.success).toBe(true);
  });

  test('fails when nutrition has a sentinel numeric field', () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      recipeNutrition: {
        energyKcal: defaultValueNumber,
        energyKj: 418,
        fat: 1,
        saturatedFat: 0.5,
        carbohydrates: 20,
        sugars: 5,
        fiber: 2,
        protein: 3,
        salt: 0.1,
        portionWeight: 100,
      },
    });
    expect(result.success).toBe(false);
  });

  test('defaults tags to empty array when omitted', () => {
    const { recipeTags: _ignored, ...without } = validRecipe;
    const result = recipeFormSchema.safeParse(without);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recipeTags).toEqual([]);
    }
  });

  test('trims title before validation', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, recipeTitle: '  Pancakes  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recipeTitle).toBe('Pancakes');
    }
  });

  test('reports all missing ingredient fields together', () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      recipeIngredients: [{ name: '', quantity: '', season: [] }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('recipeIngredients.0.name');
      expect(paths).toContain('recipeIngredients.0.quantity');
      expect(paths).toContain('recipeIngredients.0.type');
    }
  });

  test('accepts an ingredient with note and id', () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      recipeIngredients: [{ ...validIngredient, id: 7, note: 'for the sauce' }],
    });
    expect(result.success).toBe(true);
  });
});
