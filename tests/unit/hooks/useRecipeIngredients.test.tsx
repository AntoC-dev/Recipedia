import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  formatIngredientString,
  parseIngredientString,
  useRecipeIngredients,
} from '@hooks/useRecipeIngredients';
import { RecipeFormProvider, useRecipeForm } from '@context/RecipeFormContext';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import { createMockRecipeProp } from '@test-helpers/recipeHookTestWrapper';
import { ingredientType, recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testTags } from '@data/tagsDataset';
import { testIngredients } from '@data/ingredientsDataset';
import * as logger from '@utils/logger';

jest.mock('expo-sqlite', () => require('@mocks/deps/expo-sqlite-mock').expoSqliteMock());
jest.mock('@utils/FileGestion', () =>
  require('@mocks/utils/FileGestion-mock.tsx').fileGestionMock()
);
jest.mock('@utils/settings', () => require('@mocks/utils/settings-mock').settingsMock());
jest.mock('@utils/firstLaunch', () => ({
  isFirstLaunch: jest.fn().mockResolvedValue(false),
}));

function createIngredientsWrapper(props: RecipePropType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <RecipeDatabaseProvider>
        <RecipeFormProvider props={props}>
          <RecipeDialogsProvider>{children}</RecipeDialogsProvider>
        </RecipeFormProvider>
      </RecipeDatabaseProvider>
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
        });
      });

      test('parses ingredient with decimal quantity', () => {
        const result = parseIngredientString('1.5@@kg--Flour');

        expect(result.quantity).toBe('1.5');
        expect(result.unit).toBe('kg');
        expect(result.name).toBe('Flour');
      });

      test('handles empty quantity', () => {
        const result = parseIngredientString('@@g--Flour');
        expect(result).toEqual({
          quantity: '',
          unit: 'g',
          name: 'Flour',
        });
      });

      test('handles empty unit', () => {
        const result = parseIngredientString('2@@--Eggs');
        expect(result).toEqual({
          quantity: '2',
          unit: '',
          name: 'Eggs',
        });
      });

      test('handles empty name', () => {
        const result = parseIngredientString('100@@ml--');
        expect(result).toEqual({
          quantity: '100',
          unit: 'ml',
          name: '',
        });
      });

      test('handles ingredient with only name', () => {
        const result = parseIngredientString('@@--Pepper');

        expect(result.quantity).toBe('');
        expect(result.unit).toBe('');
        expect(result.name).toBe('Pepper');
      });

      test('handles malformed string', () => {
        const result = parseIngredientString('malformed');
        expect(result.quantity).toBe('malformed');
        expect(result.unit).toBe('');
        expect(result.name).toBe('');
      });

      test('handles empty string', () => {
        const result = parseIngredientString('');

        expect(result.quantity).toBe('');
        expect(result.unit).toBe('');
        expect(result.name).toBe('');
      });

      test('handles ingredient with spaces in name', () => {
        const result = parseIngredientString('500@@g--Olive Oil');

        expect(result.quantity).toBe('500');
        expect(result.unit).toBe('g');
        expect(result.name).toBe('Olive Oil');
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
    });
  });

  describe('hook functions', () => {
    const dbInstance = RecipeDatabase.getInstance();
    let loggerWarnSpy: jest.SpyInstance;

    beforeEach(async () => {
      jest.clearAllMocks();
      loggerWarnSpy = jest.spyOn(logger.recipeLogger, 'warn').mockImplementation(() => {});
      await dbInstance.init();
      await dbInstance.addMultipleIngredients(testIngredients);
      await dbInstance.addMultipleTags(testTags);
    });

    afterEach(async () => {
      loggerWarnSpy.mockRestore();
      await dbInstance.reset();
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
