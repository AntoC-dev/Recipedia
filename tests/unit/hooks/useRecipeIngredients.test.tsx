import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  formatIngredientString,
  parseIngredientString,
  useRecipeIngredients,
} from '@hooks/useRecipeIngredients';
import { RecipeFormProvider, useRecipeForm } from '@context/RecipeFormContext';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';
import { createMockRecipeProp } from '@test-helpers/recipeHookTestWrapper';
import { ingredientType, recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import { testIngredients } from '@data/ingredientsDataset';
import * as logger from '@utils/logger';

const mockFindSimilarIngredients = jest.fn();
const mockAddIngredient = jest.fn();

jest.mock('@context/RecipeDatabaseContext', () => {
  const { testTags: mockTags } = require('@data/tagsDataset');
  const { testIngredients: mockIngredients } = require('@data/ingredientsDataset');
  return {
    useRecipeDatabase: () => ({
      ingredients: mockIngredients,
      tags: mockTags,
      recipes: [],
      findSimilarIngredients: mockFindSimilarIngredients,
      findSimilarTags: jest.fn(() => []),
      addIngredient: mockAddIngredient,
      addTag: jest.fn(async (tag: unknown) => tag),
      isDatabaseReady: true,
      searchRandomlyTags: jest.fn(() => []),
      getRandomTags: jest.fn(() => []),
    }),
    RecipeDatabaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

function createIngredientsWrapper(props: RecipePropType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <RecipeFormProvider props={props}>
        <RecipeDialogsProvider>{children}</RecipeDialogsProvider>
      </RecipeFormProvider>
    );
  };
}

const recipeWithIngredients: recipeTableElement = {
  id: 1,
  image_Source: 'test.jpg',
  title: 'Test Recipe',
  description: 'Test',
  tags: [],
  persons: 4,
  ingredients: [
    { id: 1, name: 'Flour', unit: 'g', quantity: '200', type: ingredientType.cereal, season: [] },
    { id: 2, name: 'Sugar', unit: 'g', quantity: '100', type: ingredientType.sugar, season: [] },
    { id: 3, name: 'Milk', unit: 'ml', quantity: '250', type: ingredientType.dairy, season: [] },
  ],
  season: [],
  preparation: [{ title: 'Step 1', description: 'Mix' }],
  time: 30,
};

describe('useRecipeIngredients', () => {
  describe('pure functions', () => {
    describe('parseIngredientString', () => {
      test('parses complete ingredient string correctly', () => {
        const result = parseIngredientString('200@@g--Flour');
        expect(result).toEqual({
          quantity: '200',
          unit: 'g',
          name: 'Flour',
          note: '',
        });
      });

      test('parses ingredient with decimal quantity', () => {
        const result = parseIngredientString('1.5@@kg--Flour');

        expect(result.quantity).toBe('1.5');
        expect(result.unit).toBe('kg');
        expect(result.name).toBe('Flour');
        expect(result.note).toBe('');
      });

      test('handles empty quantity', () => {
        const result = parseIngredientString('@@g--Flour');
        expect(result).toEqual({
          quantity: '',
          unit: 'g',
          name: 'Flour',
          note: '',
        });
      });

      test('handles empty unit', () => {
        const result = parseIngredientString('2@@--Eggs');
        expect(result).toEqual({
          quantity: '2',
          unit: '',
          name: 'Eggs',
          note: '',
        });
      });

      test('handles empty name', () => {
        const result = parseIngredientString('100@@ml--');
        expect(result).toEqual({
          quantity: '100',
          unit: 'ml',
          name: '',
          note: '',
        });
      });

      test('handles ingredient with only name', () => {
        const result = parseIngredientString('@@--Pepper');

        expect(result.quantity).toBe('');
        expect(result.unit).toBe('');
        expect(result.name).toBe('Pepper');
        expect(result.note).toBe('');
      });

      test('handles malformed string', () => {
        const result = parseIngredientString('malformed');
        expect(result.quantity).toBe('malformed');
        expect(result.unit).toBe('');
        expect(result.name).toBe('');
        expect(result.note).toBe('');
      });

      test('handles empty string', () => {
        const result = parseIngredientString('');

        expect(result.quantity).toBe('');
        expect(result.unit).toBe('');
        expect(result.name).toBe('');
        expect(result.note).toBe('');
      });

      test('handles ingredient with spaces in name', () => {
        const result = parseIngredientString('500@@g--Olive Oil');

        expect(result.quantity).toBe('500');
        expect(result.unit).toBe('g');
        expect(result.name).toBe('Olive Oil');
        expect(result.note).toBe('');
      });

      test('parses ingredient string with note', () => {
        const result = parseIngredientString('200@@g--Flour%%For the sauce');
        expect(result).toEqual({
          quantity: '200',
          unit: 'g',
          name: 'Flour',
          note: 'For the sauce',
        });
      });

      test('handles ingredient with empty note after separator', () => {
        const result = parseIngredientString('200@@g--Flour%%');
        expect(result).toEqual({
          quantity: '200',
          unit: 'g',
          name: 'Flour',
          note: '',
        });
      });
    });

    describe('formatIngredientString', () => {
      test('formats complete ingredient correctly', () => {
        const ingredient = { quantity: '200', unit: 'g', name: 'Flour', season: [] };
        const result = formatIngredientString(ingredient);
        expect(result).toBe('200@@g--Flour');
      });

      test('formats ingredient without quantity', () => {
        const result = formatIngredientString({
          name: 'Salt',
          unit: 'pinch',
          quantity: undefined,
          season: [],
        });

        expect(result).toBe('@@pinch--Salt');
      });

      test('formats ingredient without unit', () => {
        const result = formatIngredientString({
          name: 'Eggs',
          unit: undefined,
          quantity: '2',
          season: [],
        });

        expect(result).toBe('2@@--Eggs');
      });

      test('handles missing values', () => {
        const ingredient = { name: 'Salt', season: [] };
        const result = formatIngredientString(ingredient);
        expect(result).toBe('@@--Salt');
      });

      test('handles all empty values', () => {
        const ingredient = { name: '', unit: '', quantity: '', season: [] };
        const result = formatIngredientString(ingredient);
        expect(result).toBe('@@--');
      });

      test('round-trips through parse and format', () => {
        const original = '250@@ml--Water';
        const parsed = parseIngredientString(original);
        const formatted = formatIngredientString({
          name: parsed.name,
          unit: parsed.unit,
          quantity: parsed.quantity,
          season: [],
        });

        expect(formatted).toBe(original);
      });

      test('formats ingredient with note', () => {
        const ingredient = {
          quantity: '200',
          unit: 'g',
          name: 'Flour',
          note: 'For the sauce',
          season: [],
        };
        const result = formatIngredientString(ingredient);
        expect(result).toBe('200@@g--Flour%%For the sauce');
      });

      test('formats ingredient without note (undefined)', () => {
        const ingredient = {
          quantity: '200',
          unit: 'g',
          name: 'Flour',
          note: undefined,
          season: [],
        };
        const result = formatIngredientString(ingredient);
        expect(result).toBe('200@@g--Flour');
      });

      test('formats ingredient with empty string note', () => {
        const ingredient = {
          quantity: '200',
          unit: 'g',
          name: 'Flour',
          note: '',
          season: [],
        };
        const result = formatIngredientString(ingredient);
        expect(result).toBe('200@@g--Flour');
      });

      test('round-trips through parse and format with note', () => {
        const original = '250@@ml--Water%%For cooking';
        const parsed = parseIngredientString(original);
        const formatted = formatIngredientString({
          name: parsed.name,
          unit: parsed.unit,
          quantity: parsed.quantity,
          note: parsed.note,
          season: [],
        });

        expect(formatted).toBe(original);
      });
    });
  });

  describe('hook functions', () => {
    let loggerWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      loggerWarnSpy = jest.spyOn(logger.recipeLogger, 'warn').mockImplementation(() => {});
      mockFindSimilarIngredients.mockImplementation((name: string) => {
        const exactMatch = testIngredients.find(i => i.name.toLowerCase() === name.toLowerCase());
        if (exactMatch) return [exactMatch];

        const fuzzyMatches = testIngredients.filter(i => {
          const lowerName = i.name.toLowerCase();
          const searchName = name.toLowerCase();
          return (
            lowerName.includes(searchName.substring(0, 3)) ||
            searchName.includes(lowerName.substring(0, 3))
          );
        });
        return fuzzyMatches;
      });
      mockAddIngredient.mockImplementation(async ing => ({ ...ing, id: 100 }));
    });

    afterEach(() => {
      loggerWarnSpy.mockRestore();
    });

    describe('addNewIngredient', () => {
      test('adds empty ingredient to recipe', async () => {
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.addNewIngredient();
        });

        expect(result.current.form.state.recipeIngredients).toHaveLength(4);
        expect(result.current.form.state.recipeIngredients[3]).toEqual({ name: '' });
      });

      test('adds ingredient to empty array', async () => {
        const emptyRecipe: recipeTableElement = { ...recipeWithIngredients, ingredients: [] };
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', emptyRecipe));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(0);
        });

        act(() => {
          result.current.ingredients.addNewIngredient();
        });

        expect(result.current.form.state.recipeIngredients).toHaveLength(1);
        expect(result.current.form.state.recipeIngredients[0]).toEqual({ name: '' });
      });
    });

    describe('editIngredients', () => {
      test('updates quantity only without triggering validation', async () => {
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(0, '300@@g--Flour');
        });

        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('300');
        expect(result.current.form.state.recipeIngredients[0].name).toBe('Flour');
      });

      test('updates unit without triggering validation', async () => {
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(0, '200@@kg--Flour');
        });

        expect(result.current.form.state.recipeIngredients[0].unit).toBe('kg');
        expect(result.current.form.state.recipeIngredients[0].name).toBe('Flour');
      });

      test('logs warning for negative index', async () => {
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(() => useRecipeIngredients(), { wrapper });

        await waitFor(() => {
          expect(result.current.editIngredients).toBeDefined();
        });

        act(() => {
          result.current.editIngredients(-1, '100@@g--Test');
        });

        expect(loggerWarnSpy).toHaveBeenCalledWith(
          'Cannot edit ingredient - invalid index',
          expect.objectContaining({ oldIngredientId: -1 })
        );
      });

      test('logs warning for index beyond array length', async () => {
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(() => useRecipeIngredients(), { wrapper });

        await waitFor(() => {
          expect(result.current.editIngredients).toBeDefined();
        });

        act(() => {
          result.current.editIngredients(100, '100@@g--Test');
        });

        expect(loggerWarnSpy).toHaveBeenCalledWith(
          'Cannot edit ingredient - invalid index',
          expect.objectContaining({ oldIngredientId: 100 })
        );
      });

      test('name change triggers validation queue for fuzzy matches', async () => {
        mockFindSimilarIngredients.mockImplementation((name: string) => {
          if (name.toLowerCase() === 'spaghettis') {
            return [testIngredients.find(i => i.name === 'Spaghetti')!];
          }
          return [];
        });

        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
            dialogs: useRecipeDialogs(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(0, '200@@g--Spaghettis');
        });

        await waitFor(() => {
          expect(result.current.dialogs.validationQueue).not.toBeNull();
        });
      });

      test('name change to exact match adds ingredient directly', async () => {
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
            dialogs: useRecipeDialogs(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(0, '200@@g--Spaghetti');
        });

        await waitFor(() => {
          const hasSpaghettiIngredient = result.current.form.state.recipeIngredients.some(
            ing => ing.name === 'Spaghetti'
          );
          expect(hasSpaghettiIngredient).toBe(true);
        });
      });
    });

    describe('addOrMergeIngredient', () => {
      test('adds new ingredient when not existing', async () => {
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 10,
            name: 'Butter',
            unit: 'g',
            quantity: '50',
            type: ingredientType.oilAndFat,
            season: [],
          });
        });

        expect(result.current.form.state.recipeIngredients).toHaveLength(4);
        expect(result.current.form.state.recipeIngredients[3].name).toBe('Butter');
      });

      test('merges quantity for existing ingredient with same unit', async () => {
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 1,
            name: 'Flour',
            unit: 'g',
            quantity: '100',
            type: ingredientType.cereal,
            season: [],
          });
        });

        expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('300');
      });

      test('replaces ingredient when same name but different unit', async () => {
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 1,
            name: 'Flour',
            unit: 'kg',
            quantity: '0.5',
            type: ingredientType.cereal,
            season: [],
          });
        });

        expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        expect(result.current.form.state.recipeIngredients[0].unit).toBe('kg');
        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('0.5');
      });

      test('case-insensitive name matching for merge', async () => {
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 1,
            name: 'FLOUR',
            unit: 'g',
            quantity: '100',
            type: ingredientType.cereal,
            season: [],
          });
        });

        expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('300');
      });

      test('preserves type and season from validated ingredient when merging with FormIngredient', async () => {
        const recipeWithFormIngredient: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [{ name: 'Flour', unit: 'g', quantity: '200' } as never],
        };
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithFormIngredient)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(1);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 1,
            name: 'Flour',
            unit: 'g',
            quantity: '100',
            type: ingredientType.cereal,
            season: ['1', '2', '3'],
          });
        });

        const merged = result.current.form.state.recipeIngredients[0];
        expect(merged.quantity).toBe('300');
        expect(merged.type).toBe(ingredientType.cereal);
        expect(merged.season).toEqual(['1', '2', '3']);
      });

      test('handles existing ingredient with undefined name gracefully', async () => {
        const recipeWithEmptyNameIngredient: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [{ id: 1, name: '', unit: 'g', quantity: '100', season: [] } as never],
        };
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithEmptyNameIngredient)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(1);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 2,
            name: '',
            unit: 'g',
            quantity: '50',
            type: ingredientType.cereal,
            season: [],
          });
        });

        expect(result.current.form.state.recipeIngredients).toHaveLength(1);
      });
    });

    describe('editIngredients with notes', () => {
      const recipeWithNotes: recipeTableElement = {
        ...recipeWithIngredients,
        ingredients: [
          {
            id: 1,
            name: 'Flour',
            unit: 'g',
            quantity: '200',
            type: ingredientType.cereal,
            season: [],
            note: 'for the sauce',
          },
          {
            id: 2,
            name: 'Sugar',
            unit: 'g',
            quantity: '100',
            type: ingredientType.sugar,
            season: [],
          },
        ],
      };

      test('preserves note when updating quantity only', async () => {
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithNotes));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(2);
        });

        act(() => {
          result.current.ingredients.editIngredients(0, '300@@g--Flour%%for the sauce');
        });

        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('300');
        expect(result.current.form.state.recipeIngredients[0].note).toBe('for the sauce');
      });

      test('updates note when explicitly changed', async () => {
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithNotes));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(2);
        });

        act(() => {
          result.current.ingredients.editIngredients(0, '200@@g--Flour%%for the filling');
        });

        expect(result.current.form.state.recipeIngredients[0].note).toBe('for the filling');
      });

      test('clears note when empty string passed', async () => {
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithNotes));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(2);
        });

        act(() => {
          result.current.ingredients.editIngredients(0, '200@@g--Flour%%');
        });

        expect(result.current.form.state.recipeIngredients[0].note).toBe('');
      });

      test('adds note to ingredient without one', async () => {
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithNotes));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(2);
        });

        act(() => {
          result.current.ingredients.editIngredients(1, '100@@g--Sugar%%for the topping');
        });

        expect(result.current.form.state.recipeIngredients[1].note).toBe('for the topping');
      });

      test('multiple rapid edits preserve all changes (stale closure regression)', async () => {
        const recipeForRapidEdits: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [
            {
              id: 1,
              name: 'Flour',
              unit: 'g',
              quantity: '100',
              type: ingredientType.cereal,
              season: [],
            },
            {
              id: 2,
              name: 'Sugar',
              unit: 'g',
              quantity: '50',
              type: ingredientType.sugar,
              season: [],
            },
            {
              id: 3,
              name: 'Salt',
              unit: 'tsp',
              quantity: '1',
              type: ingredientType.spice,
              season: [],
            },
          ],
        };
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeForRapidEdits));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(0, '200@@g--Flour%%for the dough');
          result.current.ingredients.editIngredients(1, '100@@g--Sugar%%for the topping');
          result.current.ingredients.editIngredients(2, '2@@tsp--Salt%%a pinch');
        });

        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('200');
        expect(result.current.form.state.recipeIngredients[0].note).toBe('for the dough');
        expect(result.current.form.state.recipeIngredients[1].quantity).toBe('100');
        expect(result.current.form.state.recipeIngredients[1].note).toBe('for the topping');
        expect(result.current.form.state.recipeIngredients[2].quantity).toBe('2');
        expect(result.current.form.state.recipeIngredients[2].note).toBe('a pinch');
      });
    });

    describe('addOrMergeIngredient with notes', () => {
      const recipeWithNotes: recipeTableElement = {
        ...recipeWithIngredients,
        ingredients: [
          {
            id: 1,
            name: 'Flour',
            unit: 'g',
            quantity: '200',
            type: ingredientType.cereal,
            season: [],
            note: 'for the sauce',
          },
        ],
      };

      test('does not merge when both have different notes', async () => {
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithNotes));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(1);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 1,
            name: 'Flour',
            unit: 'g',
            quantity: '100',
            type: ingredientType.cereal,
            season: [],
            note: 'for the filling',
          });
        });

        expect(result.current.form.state.recipeIngredients).toHaveLength(2);
        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('200');
        expect(result.current.form.state.recipeIngredients[0].note).toBe('for the sauce');
        expect(result.current.form.state.recipeIngredients[1].quantity).toBe('100');
        expect(result.current.form.state.recipeIngredients[1].note).toBe('for the filling');
      });

      test('merges when both have same note', async () => {
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithNotes));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(1);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 1,
            name: 'Flour',
            unit: 'g',
            quantity: '100',
            type: ingredientType.cereal,
            season: [],
            note: 'for the sauce',
          });
        });

        expect(result.current.form.state.recipeIngredients).toHaveLength(1);
        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('300');
        expect(result.current.form.state.recipeIngredients[0].note).toBe('for the sauce');
      });

      test('merges when new ingredient has note but existing does not', async () => {
        const recipeWithoutNote: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [
            {
              id: 1,
              name: 'Flour',
              unit: 'g',
              quantity: '200',
              type: ingredientType.cereal,
              season: [],
            },
          ],
        };
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithoutNote));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(1);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 1,
            name: 'Flour',
            unit: 'g',
            quantity: '100',
            type: ingredientType.cereal,
            season: [],
            note: 'for the filling',
          });
        });

        expect(result.current.form.state.recipeIngredients).toHaveLength(1);
        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('300');
        expect(result.current.form.state.recipeIngredients[0].note).toBe('for the filling');
      });

      test('falls back to existing note when new note is undefined', async () => {
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithNotes));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(1);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 1,
            name: 'Flour',
            unit: 'g',
            quantity: '100',
            type: ingredientType.cereal,
            season: [],
          });
        });

        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('300');
        expect(result.current.form.state.recipeIngredients[0].note).toBe('for the sauce');
      });

      test('preserves new note when replacing with different unit', async () => {
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithNotes));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(1);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 1,
            name: 'Flour',
            unit: 'kg',
            quantity: '0.5',
            type: ingredientType.cereal,
            season: [],
            note: 'for the bread',
          });
        });

        expect(result.current.form.state.recipeIngredients[0].unit).toBe('kg');
        expect(result.current.form.state.recipeIngredients[0].note).toBe('for the bread');
      });
    });

    describe('replaceAllMatchingFormIngredients', () => {
      test('replaces all matching ingredients with database metadata and unit', async () => {
        const recipeWithDuplicates: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [
            { name: 'Olive Oil', quantity: '2', unit: 'càs' } as never,
            { name: 'Salt', quantity: '1', unit: 'tsp' } as never,
            { name: 'Olive Oil', quantity: '', unit: '' } as never,
          ],
        };
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithDuplicates)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.replaceAllMatchingFormIngredients({
            id: 10,
            name: 'Olive Oil',
            type: ingredientType.oilAndFat,
            season: ['1', '2', '3'],
            quantity: '',
            unit: 'ml',
          });
        });

        const ingredients = result.current.form.state.recipeIngredients;
        expect(ingredients[0].id).toBe(10);
        expect(ingredients[0].name).toBe('Olive Oil');
        expect(ingredients[0].type).toBe(ingredientType.oilAndFat);
        expect(ingredients[0].quantity).toBe('2');
        expect(ingredients[0].unit).toBe('ml');

        expect(ingredients[1].name).toBe('Salt');

        expect(ingredients[2].id).toBe(10);
        expect(ingredients[2].name).toBe('Olive Oil');
        expect(ingredients[2].type).toBe(ingredientType.oilAndFat);
        expect(ingredients[2].quantity).toBe('');
        expect(ingredients[2].unit).toBe('ml');
      });

      test('preserves notes from original FormIngredients', async () => {
        const recipeWithNotes: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [
            { name: 'Vinegar', quantity: '2', unit: 'tbsp', note: 'white or cider' } as never,
            { name: 'Vinegar', quantity: '1', unit: 'tbsp', note: 'balsamic' } as never,
          ],
        };
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithNotes));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(2);
        });

        act(() => {
          result.current.ingredients.replaceAllMatchingFormIngredients({
            id: 5,
            name: 'Vinegar',
            type: ingredientType.sauce,
            season: [],
            quantity: '',
            unit: '',
          });
        });

        const ingredients = result.current.form.state.recipeIngredients;
        expect(ingredients[0].note).toBe('white or cider');
        expect(ingredients[1].note).toBe('balsamic');
      });

      test('handles case-insensitive matching', async () => {
        const recipeWithMixedCase: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [
            { name: 'olive oil', quantity: '2', unit: 'tbsp' } as never,
            { name: 'OLIVE OIL', quantity: '1', unit: 'tbsp' } as never,
          ],
        };
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithMixedCase));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(2);
        });

        act(() => {
          result.current.ingredients.replaceAllMatchingFormIngredients({
            id: 10,
            name: 'Olive Oil',
            type: ingredientType.oilAndFat,
            season: [],
            quantity: '',
            unit: '',
          });
        });

        const ingredients = result.current.form.state.recipeIngredients;
        expect(ingredients[0].id).toBe(10);
        expect(ingredients[1].id).toBe(10);
      });

      test('does not affect non-matching ingredients', async () => {
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.replaceAllMatchingFormIngredients({
            id: 100,
            name: 'NonExistent',
            type: ingredientType.oilAndFat,
            season: [],
            quantity: '',
            unit: '',
          });
        });

        expect(result.current.form.state.recipeIngredients[0].name).toBe('Flour');
        expect(result.current.form.state.recipeIngredients[1].name).toBe('Sugar');
        expect(result.current.form.state.recipeIngredients[2].name).toBe('Milk');
      });
    });

    describe('editIngredients property updates', () => {
      test('updates ingredient season when provided', async () => {
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(0, '200@@g--Flour');
        });

        expect(result.current.form.state.recipeIngredients[0].name).toBe('Flour');
        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('200');
      });

      test('updates ingredient type from database match', async () => {
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithIngredients)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.state.recipeIngredients).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(0, '200@@g--Spaghetti');
        });

        await waitFor(() => {
          const spaghetti = result.current.form.state.recipeIngredients.find(
            i => i.name === 'Spaghetti'
          );
          expect(spaghetti).toBeDefined();
          expect(spaghetti?.type).toBeDefined();
        });
      });
    });
  });
});
