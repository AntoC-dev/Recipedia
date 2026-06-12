import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { FormProvider, useForm, UseFormReturn, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ingredientType } from '@customTypes/DatabaseElementTypes';
import { recipeFormSchema, RecipeFormInput } from '@schemas/recipeFormSchema';
import { useIngredientArray } from '@screens/recipe/fields/useIngredientArray';
import {
  IngredientArrayActionsProvider,
  useIngredientArrayActions,
} from '@screens/recipe/fields/IngredientArrayActionsContext';
import { resetUseIngredientsMocks, setMockIngredients } from '@mocks/hooks/useIngredients-mock';
import { defaultValueNumber } from '@utils/Constants';

jest.mock('@hooks/useIngredients', () => ({
  useIngredients: require('@mocks/hooks/useIngredients-mock').useIngredientsMock,
}));
jest.mock('@hooks/useRecipeIngredients', () => ({
  ...jest.requireActual('@hooks/useRecipeIngredients'),
  useRecipeIngredients: () => ({
    editIngredients: jest.fn(),
  }),
}));

const flour = {
  id: 1,
  name: 'Flour',
  quantity: '200',
  unit: 'g',
  type: ingredientType.cereal,
  season: [] as string[],
};
const sugar = {
  id: 2,
  name: 'Sugar',
  quantity: '100',
  unit: 'g',
  type: ingredientType.sugar,
  season: [] as string[],
};

function buildFormDefaults(partial?: Partial<RecipeFormInput>): RecipeFormInput {
  return {
    recipeImage: '',
    recipeTitle: 'Test',
    recipeDescription: '',
    recipeTags: [],
    recipePersons: defaultValueNumber,
    recipeIngredients: [],
    recipePreparation: [],
    recipeTime: defaultValueNumber,
    recipeNutrition: undefined,
    ...partial,
  } as RecipeFormInput;
}

function createTestWrapper(defaults?: Partial<RecipeFormInput>) {
  const formRef: { current: UseFormReturn<RecipeFormInput> | null } = { current: null };

  function Wrapper({ children }: { children: React.ReactNode }) {
    const form = useForm<RecipeFormInput>({
      resolver: zodResolver(recipeFormSchema),
      mode: 'onTouched',
      defaultValues: buildFormDefaults(defaults),
    });
    // eslint-disable-next-line react-compiler/react-compiler
    formRef.current = form;
    return (
      <FormProvider {...form}>
        <IngredientArrayActionsProvider>{children}</IngredientArrayActionsProvider>
      </FormProvider>
    );
  }

  return { wrapper: Wrapper, formRef };
}

function useTestHook() {
  const form = useFormContext<RecipeFormInput>();
  return useIngredientArray({ form });
}

function useTestHookWithActions() {
  const form = useFormContext<RecipeFormInput>();
  const array = useIngredientArray({ form });
  const actions = useIngredientArrayActions();
  return { array, actions };
}

beforeEach(() => {
  resetUseIngredientsMocks();
});

describe('useIngredientArray', () => {
  describe('initial state', () => {
    test('rowCount reflects the number of initial ingredients', () => {
      const { wrapper } = createTestWrapper({ recipeIngredients: [flour, sugar] });
      const { result } = renderHook(useTestHook, { wrapper });

      expect(result.current.rowCount).toBe(2);
    });

    test('fieldArray.fields is empty when no initial ingredients', () => {
      const { wrapper } = createTestWrapper({ recipeIngredients: [] });
      const { result } = renderHook(useTestHook, { wrapper });

      expect(result.current.fieldArray.fields).toHaveLength(0);
    });
  });

  describe('handleAddIngredient', () => {
    test('appends an empty row', () => {
      const { wrapper, formRef } = createTestWrapper({ recipeIngredients: [] });
      const { result } = renderHook(useTestHook, { wrapper });

      act(() => {
        result.current.handleAddIngredient();
      });

      expect(formRef.current!.getValues('recipeIngredients')).toHaveLength(1);
      expect(formRef.current!.getValues('recipeIngredients')![0].name).toBe('');
    });

    test('increments rowCount by one', () => {
      const { wrapper } = createTestWrapper({ recipeIngredients: [flour] });
      const { result } = renderHook(useTestHook, { wrapper });

      act(() => {
        result.current.handleAddIngredient();
      });

      expect(result.current.rowCount).toBe(2);
    });
  });

  describe('handleRemoveIngredient', () => {
    test('removes the row at the given index', () => {
      const { wrapper, formRef } = createTestWrapper({ recipeIngredients: [flour, sugar] });
      const { result } = renderHook(useTestHook, { wrapper });

      act(() => {
        result.current.handleRemoveIngredient(0);
      });

      expect(formRef.current!.getValues('recipeIngredients')).toHaveLength(1);
      expect(formRef.current!.getValues('recipeIngredients')![0].name).toBe('Sugar');
    });

    test('removing the last row leaves an empty array', () => {
      const { wrapper, formRef } = createTestWrapper({ recipeIngredients: [flour] });
      const { result } = renderHook(useTestHook, { wrapper });

      act(() => {
        result.current.handleRemoveIngredient(0);
      });

      expect(formRef.current!.getValues('recipeIngredients')).toHaveLength(0);
    });

    test('removes the row at the last index when multiple exist', () => {
      const { wrapper, formRef } = createTestWrapper({ recipeIngredients: [flour, sugar] });
      const { result } = renderHook(useTestHook, { wrapper });

      act(() => {
        result.current.handleRemoveIngredient(1);
      });

      expect(formRef.current!.getValues('recipeIngredients')).toHaveLength(1);
      expect(formRef.current!.getValues('recipeIngredients')![0].name).toBe('Flour');
    });
  });

  describe('applyEditPatch via IngredientArrayActionsContext', () => {
    test('replace patch updates the row at the given index without touching sibling rows', () => {
      const { wrapper, formRef } = createTestWrapper({ recipeIngredients: [flour, sugar] });
      const { result } = renderHook(useTestHookWithActions, { wrapper });

      const updatedRow = { ...flour, quantity: '500' };
      act(() => {
        result.current.actions.applyPatch({ kind: 'replace', index: 0, row: updatedRow as never });
      });

      expect(formRef.current!.getValues('recipeIngredients')![0].quantity).toBe('500');
      expect(formRef.current!.getValues('recipeIngredients')![1].name).toBe('Sugar');
    });

    test('merge patch collapses two rows and decrements the count by one', () => {
      const { wrapper, formRef } = createTestWrapper({ recipeIngredients: [flour, sugar] });
      const { result } = renderHook(useTestHookWithActions, { wrapper });

      const mergedRow = { ...flour, quantity: '300' };
      act(() => {
        result.current.actions.applyPatch({
          kind: 'merge',
          intoIndex: 0,
          removeIndex: 1,
          row: mergedRow as never,
        });
      });

      expect(formRef.current!.getValues('recipeIngredients')).toHaveLength(1);
      expect(formRef.current!.getValues('recipeIngredients')![0].quantity).toBe('300');
    });

    test('remove patch removes exactly the specified row', () => {
      const { wrapper, formRef } = createTestWrapper({ recipeIngredients: [flour, sugar] });
      const { result } = renderHook(useTestHookWithActions, { wrapper });

      act(() => {
        result.current.actions.applyPatch({ kind: 'remove', index: 0 });
      });

      expect(formRef.current!.getValues('recipeIngredients')).toHaveLength(1);
      expect(formRef.current!.getValues('recipeIngredients')![0].name).toBe('Sugar');
    });

    test('append patch adds a new row at the end of the array', () => {
      const { wrapper, formRef } = createTestWrapper({ recipeIngredients: [flour] });
      const { result } = renderHook(useTestHookWithActions, { wrapper });

      const newRow = { name: 'Butter', quantity: '50', unit: 'g' };
      act(() => {
        result.current.actions.applyPatch({ kind: 'append', row: newRow as never });
      });

      expect(formRef.current!.getValues('recipeIngredients')).toHaveLength(2);
      expect(formRef.current!.getValues('recipeIngredients')![1].name).toBe('Butter');
    });
  });

  describe('availableIngredients', () => {
    test('excludes ingredient names already present in the form', () => {
      setMockIngredients([flour, sugar]);
      const { wrapper } = createTestWrapper({ recipeIngredients: [flour] });
      const { result } = renderHook(useTestHook, { wrapper });

      expect(result.current.availableIngredients).not.toContain('Flour');
      expect(result.current.availableIngredients).toContain('Sugar');
    });

    test('includes all DB ingredients when the form array is empty', () => {
      setMockIngredients([flour, sugar]);
      const { wrapper } = createTestWrapper({ recipeIngredients: [] });
      const { result } = renderHook(useTestHook, { wrapper });

      expect(result.current.availableIngredients).toContain('Flour');
      expect(result.current.availableIngredients).toContain('Sugar');
    });

    test('returns a sorted list', () => {
      setMockIngredients([sugar, flour]);
      const { wrapper } = createTestWrapper({ recipeIngredients: [] });
      const { result } = renderHook(useTestHook, { wrapper });

      const names = result.current.availableIngredients;
      expect(names).toEqual([...names].sort());
    });

    test('returns empty list when every DB ingredient is already in the form', () => {
      setMockIngredients([flour, sugar]);
      const { wrapper } = createTestWrapper({ recipeIngredients: [flour, sugar] });
      const { result } = renderHook(useTestHook, { wrapper });

      expect(result.current.availableIngredients).toHaveLength(0);
    });

    test('returns empty list when the DB has no ingredients', () => {
      setMockIngredients([]);
      const { wrapper } = createTestWrapper({ recipeIngredients: [] });
      const { result } = renderHook(useTestHook, { wrapper });

      expect(result.current.availableIngredients).toHaveLength(0);
    });
  });
});
