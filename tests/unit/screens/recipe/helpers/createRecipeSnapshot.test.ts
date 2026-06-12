import type { UseFormReturn } from 'react-hook-form';
import { createRecipeSnapshot } from '@screens/recipe/helpers/createRecipeSnapshot';
import { ingredientType, recipeTableElement } from '@customTypes/DatabaseElementTypes';
import type { RecipeFormInput } from '@schemas/recipeFormSchema';

function formStub(values: Partial<RecipeFormInput>): UseFormReturn<RecipeFormInput> {
  const completeValues = {
    recipeImage: '',
    recipeTitle: '',
    recipeDescription: '',
    recipeTags: [],
    recipePersons: 4,
    recipeIngredients: [],
    recipePreparation: [],
    recipeTime: 30,
    recipeNutrition: undefined,
    ...values,
  } as RecipeFormInput;
  return {
    getValues: () => completeValues,
  } as unknown as UseFormReturn<RecipeFormInput>;
}

const baselineRecipe: recipeTableElement = {
  id: 7,
  image_Source: 'orig.jpg',
  title: 'Original',
  description: 'desc',
  tags: [{ id: 1, name: 'Italian' }],
  persons: 4,
  ingredients: [
    { id: 1, name: 'Flour', unit: 'g', quantity: '100', type: ingredientType.cereal, season: [] },
  ],
  season: ['1', '2', '3'],
  preparation: [{ title: 'Step', description: 'Mix' }],
  time: 20,
  sourceProvider: 'hellofresh',
  sourceUrl: 'https://hellofresh.fr/recipe/original',
};

describe('createRecipeSnapshot', () => {
  test('builds a recipeTableElement from the current form values', () => {
    const form = formStub({
      recipeTitle: 'Pancakes',
      recipeDescription: 'Tasty',
      recipeImage: 'pancakes.jpg',
      recipePersons: 2,
      recipeTime: 15,
    });

    const snapshot = createRecipeSnapshot(form, null);

    expect(snapshot.title).toBe('Pancakes');
    expect(snapshot.description).toBe('Tasty');
    expect(snapshot.image_Source).toBe('pancakes.jpg');
    expect(snapshot.persons).toBe(2);
    expect(snapshot.time).toBe(15);
  });

  test('preserves baseline id, season, sourceProvider, sourceUrl', () => {
    const form = formStub({ recipeTitle: 'Edited' });

    const snapshot = createRecipeSnapshot(form, baselineRecipe);

    expect(snapshot.id).toBe(baselineRecipe.id);
    expect(snapshot.season).toEqual(baselineRecipe.season);
    expect(snapshot.sourceProvider).toBe(baselineRecipe.sourceProvider);
    expect(snapshot.sourceUrl).toBe(baselineRecipe.sourceUrl);
  });

  test('uses fallback sourceUrl when no baseline is supplied', () => {
    const form = formStub({});

    const snapshot = createRecipeSnapshot(form, null, 'https://example.com/source');

    expect(snapshot.sourceUrl).toBe('https://example.com/source');
  });

  test('baseline sourceUrl wins over the fallback when both are provided', () => {
    const form = formStub({});

    const snapshot = createRecipeSnapshot(form, baselineRecipe, 'https://other.example/source');

    expect(snapshot.sourceUrl).toBe(baselineRecipe.sourceUrl);
  });

  test('defaults missing form fields to safe values', () => {
    const form = {
      getValues: () => ({}) as unknown as RecipeFormInput,
    } as unknown as UseFormReturn<RecipeFormInput>;

    const snapshot = createRecipeSnapshot(form, null);

    expect(snapshot.image_Source).toBe('');
    expect(snapshot.title).toBe('');
    expect(snapshot.description).toBe('');
    expect(snapshot.tags).toEqual([]);
    expect(snapshot.ingredients).toEqual([]);
    expect(snapshot.preparation).toEqual([]);
    expect(snapshot.season).toEqual([]);
  });
});
