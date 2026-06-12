import {
  collectMissingElementsFromErrors,
  firstErrorMessage,
  inlineMessage,
  markAllRecipeFieldsTouched,
} from '@utils/recipeFormErrors';
import { renderHook, act } from '@testing-library/react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recipeFormSchema, RecipeFormInput } from '@schemas/recipeFormSchema';
import { defaultValueNumber } from '@utils/Constants';
import type { FieldErrors } from 'react-hook-form';

const t = (key: string) => `t(${key})`;
const errs = (tree: object): FieldErrors<RecipeFormInput> =>
  tree as unknown as FieldErrors<RecipeFormInput>;

describe('collectMissingElementsFromErrors', () => {
  test('returns empty array for empty errors', () => {
    expect(collectMissingElementsFromErrors(errs({}), t)).toEqual([]);
  });

  test('translates a single top-level error message', () => {
    const result = collectMissingElementsFromErrors(
      errs({
        recipeTitle: { type: 'required', message: 'alerts.missingElements.titleRecipe' },
      }),
      t
    );
    expect(result).toEqual(['t(alerts.missingElements.titleRecipe)']);
  });

  test('collects multiple distinct messages', () => {
    const result = collectMissingElementsFromErrors(
      errs({
        recipeTitle: { message: 'alerts.missingElements.titleRecipe' },
        recipeImage: { message: 'alerts.missingElements.image' },
        recipePersons: { message: 'alerts.missingElements.titlePersons' },
      }),
      t
    );
    expect(result).toHaveLength(3);
    expect(result).toContain('t(alerts.missingElements.titleRecipe)');
    expect(result).toContain('t(alerts.missingElements.image)');
    expect(result).toContain('t(alerts.missingElements.titlePersons)');
  });

  test('deduplicates identical messages across nested errors', () => {
    const result = collectMissingElementsFromErrors(
      errs({
        recipeIngredients: [
          { name: { message: 'alerts.missingElements.titleIngredients' } },
          { quantity: { message: 'alerts.missingElements.titleIngredients' } },
          { type: { message: 'alerts.missingElements.titleIngredients' } },
        ],
      }),
      t
    );
    expect(result).toEqual(['t(alerts.missingElements.titleIngredients)']);
  });

  test('walks deeply nested nutrition errors', () => {
    const result = collectMissingElementsFromErrors(
      errs({
        recipeNutrition: {
          energyKcal: { message: 'alerts.missingElements.nutrition' },
          protein: { message: 'alerts.missingElements.nutrition' },
        },
      }),
      t
    );
    expect(result).toEqual(['t(alerts.missingElements.nutrition)']);
  });

  test('skips entries that have no message', () => {
    expect(
      collectMissingElementsFromErrors(errs({ recipeTags: { type: 'invalid_type' } }), t)
    ).toEqual([]);
  });

  test('handles mix of leaf and nested errors', () => {
    const result = collectMissingElementsFromErrors(
      errs({
        recipeTitle: { message: 'alerts.missingElements.titleRecipe' },
        recipeIngredients: [{ name: { message: 'alerts.missingElements.titleIngredients' } }],
        recipeNutrition: { fat: { message: 'alerts.missingElements.nutrition' } },
      }),
      t
    );
    expect(result).toHaveLength(3);
  });

  test('returns empty array for non-object input (defensive)', () => {
    expect(
      collectMissingElementsFromErrors(undefined as unknown as FieldErrors<RecipeFormInput>, t)
    ).toEqual([]);
    expect(
      collectMissingElementsFromErrors(null as unknown as FieldErrors<RecipeFormInput>, t)
    ).toEqual([]);
  });
});

describe('firstErrorMessage', () => {
  test('returns undefined for undefined node', () => {
    expect(firstErrorMessage(undefined, t)).toBeUndefined();
  });

  test('returns undefined for null node', () => {
    expect(firstErrorMessage(null, t)).toBeUndefined();
  });

  test('returns undefined for empty object', () => {
    expect(firstErrorMessage({}, t)).toBeUndefined();
  });

  test('returns undefined for non-object scalar', () => {
    expect(firstErrorMessage('not-an-error' as unknown, t)).toBeUndefined();
    expect(firstErrorMessage(42 as unknown, t)).toBeUndefined();
  });

  test('returns inline-translated message from a leaf with message', () => {
    const node = { type: 'required', message: 'alerts.missingElements.titleRecipe' };
    expect(firstErrorMessage(node, t)).toBe('t(alerts.inlineErrors.titleRecipe)');
  });

  test('returns inline-translated message from a nested error tree', () => {
    const node = {
      name: { message: 'alerts.missingElements.titleIngredients' },
    };
    expect(firstErrorMessage(node, t)).toBe('t(alerts.inlineErrors.titleIngredients)');
  });

  test('returns only the first unique message even when several are present', () => {
    const node = {
      energyKcal: { message: 'alerts.missingElements.nutrition' },
      protein: { message: 'alerts.missingElements.nutrition' },
      fat: { message: 'alerts.missingElements.nutrition' },
    };
    expect(firstErrorMessage(node, t)).toBe('t(alerts.inlineErrors.nutrition)');
  });

  test('handles a leaf without a message property', () => {
    const node = { name: { type: 'invalid_type' } };
    expect(firstErrorMessage(node, t)).toBeUndefined();
  });

  test('walks deeply nested structures', () => {
    const node = {
      deep: { deeper: { deepest: { message: 'alerts.missingElements.image' } } },
    };
    expect(firstErrorMessage(node, t)).toBe('t(alerts.inlineErrors.image)');
  });

  test('does not recurse into RHF internal `ref` even when it contains cycles', () => {
    const cycle: Record<string, unknown> = { name: 'TextInput' };
    cycle.self = cycle;
    const node = {
      recipeTitle: {
        type: 'min',
        message: 'alerts.missingElements.titleRecipe',
        ref: cycle,
      },
    };
    expect(() => firstErrorMessage(node, t)).not.toThrow();
    expect(firstErrorMessage(node, t)).toBe('t(alerts.inlineErrors.titleRecipe)');
  });

  test('collectMissingElementsFromErrors keeps the missingElements phrasing for the dialog', () => {
    const result = collectMissingElementsFromErrors(
      errs({ recipeTitle: { message: 'alerts.missingElements.titleRecipe' } }),
      t
    );
    expect(result).toEqual(['t(alerts.missingElements.titleRecipe)']);
  });

  test('collectMissingElementsFromErrors ignores ref/type/types keys', () => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    const errors = errs({
      recipeTitle: {
        type: 'min',
        message: 'alerts.missingElements.titleRecipe',
        ref: cycle,
        types: { min: 'alerts.missingElements.titleRecipe' },
      },
    });
    expect(() => collectMissingElementsFromErrors(errors, t)).not.toThrow();
    expect(collectMissingElementsFromErrors(errors, t)).toEqual([
      't(alerts.missingElements.titleRecipe)',
    ]);
  });
});

describe('inlineMessage ingredient sub-keys', () => {
  test.each([
    ['alerts.missingElements.ingredientNames', 'alerts.inlineErrors.ingredientRow'],
    ['alerts.missingElements.ingredientQuantities', 'alerts.inlineErrors.ingredientRow'],
    ['alerts.missingElements.ingredientInDatabase', 'alerts.inlineErrors.ingredientRow'],
  ])('maps ingredient sub-issue %s to %s', (key, expected) => {
    expect(inlineMessage(key, t)).toBe(`t(${expected})`);
  });
});

describe('inlineMessage', () => {
  test('returns undefined when the key is undefined', () => {
    expect(inlineMessage(undefined, t)).toBeUndefined();
  });

  test('returns undefined when the key is an empty string', () => {
    expect(inlineMessage('', t)).toBeUndefined();
  });

  test.each([
    ['alerts.missingElements.image', 'alerts.inlineErrors.image'],
    ['alerts.missingElements.titleRecipe', 'alerts.inlineErrors.titleRecipe'],
    ['alerts.missingElements.titleIngredients', 'alerts.inlineErrors.titleIngredients'],
    ['alerts.missingElements.titlePreparation', 'alerts.inlineErrors.titlePreparation'],
    ['alerts.missingElements.titlePersons', 'alerts.inlineErrors.titlePersons'],
    ['alerts.missingElements.titleTime', 'alerts.inlineErrors.titleTime'],
    ['alerts.missingElements.nutrition', 'alerts.inlineErrors.nutrition'],
  ])('maps schema key %s to inline key %s', (schemaKey, inlineKey) => {
    expect(inlineMessage(schemaKey, t)).toBe(`t(${inlineKey})`);
  });

  test('falls back to translating the original key when no inline mapping exists', () => {
    expect(inlineMessage('some.unknown.key', t)).toBe('t(some.unknown.key)');
  });
});

describe('markAllRecipeFieldsTouched', () => {
  const baseDefaults: RecipeFormInput = {
    recipeImage: '',
    recipeTitle: '',
    recipeDescription: '',
    recipeTags: [],
    recipePersons: defaultValueNumber,
    recipeIngredients: [],
    recipePreparation: [],
    recipeTime: defaultValueNumber,
    recipeNutrition: undefined,
  };

  test('marks the touched-gated top-level fields as touched without mutating their values', () => {
    const { result } = renderHook(() =>
      useForm<RecipeFormInput>({
        resolver: zodResolver(recipeFormSchema),
        defaultValues: { ...baseDefaults, recipeTitle: 'Pancakes', recipePersons: 4 },
      })
    );

    act(() => {
      markAllRecipeFieldsTouched(result.current);
    });

    const touched = (
      result.current.control as unknown as {
        _formState: { touchedFields: Record<string, unknown> };
      }
    )._formState.touchedFields;
    expect(touched.recipeImage).toBeTruthy();
    expect(touched.recipeTitle).toBeTruthy();
    expect(touched.recipeDescription).toBeTruthy();
    expect(touched.recipeTags).toBeTruthy();
    expect(touched.recipePersons).toBeTruthy();
    expect(touched.recipeTime).toBeTruthy();
    expect(touched.recipeIngredients).toBeFalsy();
    expect(touched.recipePreparation).toBeFalsy();
    expect(touched.recipeNutrition).toBeFalsy();
    expect(result.current.getValues('recipeTitle')).toBe('Pancakes');
    expect(result.current.getValues('recipePersons')).toBe(4);
  });
});
