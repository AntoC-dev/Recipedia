import React, { createContext, useContext } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import {
  ApplyIngredientEditPatch,
  formatIngredientString,
  parseIngredientString,
  useRecipeIngredients,
} from '@hooks/useRecipeIngredients';
import { RecipeFormProvider, useRecipeForm } from '@test-helpers/recipeFormTestProvider';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';
import { createMockRecipeProp } from '@test-helpers/recipeHookTestWrapper';
import {
  IngredientArrayActionsProvider,
  useIngredientArrayActionsRegister,
} from '@screens/recipe/fields/IngredientArrayActionsContext';
import {
  FormIngredientElement,
  ingredientTableElement,
  ingredientType,
  recipeTableElement,
} from '@customTypes/DatabaseElementTypes';
import { RecipeFormInput } from '@schemas/recipeFormSchema';
import { IngredientValidationProps } from '@components/dialogs/ValidationQueue';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import { testIngredients } from '@data/ingredientsDataset';
import { testTags } from '@data/tagsDataset';
import * as logger from '@utils/logger';
import {
  mockFindSimilarIngredients,
  mockAddIngredient,
  setMockIngredients,
} from '@mocks/hooks/useIngredients-mock';
import { setMockTags } from '@mocks/hooks/useTags-mock';

type IngredientRow = ingredientTableElement | FormIngredientElement;
type RecipeForm = UseFormReturn<RecipeFormInput>;

function makeFormApplyPatch(form: RecipeForm): ApplyIngredientEditPatch {
  return patch => {
    const current = (form.getValues('recipeIngredients') ?? []) as IngredientRow[];
    if (patch.kind === 'replace') {
      const next = [...current];
      next[patch.index] = patch.row;
      form.setValue('recipeIngredients', next as never, { shouldValidate: true });
      return;
    }
    if (patch.kind === 'merge') {
      const next = [...current];
      next[patch.intoIndex] = patch.row;
      next.splice(patch.removeIndex, 1);
      form.setValue('recipeIngredients', next as never, { shouldValidate: true });
      return;
    }
    if (patch.kind === 'append') {
      const next = [...current, patch.row];
      form.setValue('recipeIngredients', next as never, { shouldValidate: true });
      return;
    }
    const next = current.filter((_, i) => i !== patch.index);
    form.setValue('recipeIngredients', next as never, { shouldValidate: true });
  };
}

const noopApplyPatch: ApplyIngredientEditPatch = () => {};

jest.mock('@hooks/useIngredients', () => ({
  useIngredients: require('@mocks/hooks/useIngredients-mock').useIngredientsMock,
}));

jest.mock('@hooks/useTags', () => ({
  useTags: require('@mocks/hooks/useTags-mock').useTagsMock,
}));

function FormDrivenApplyPatchRegistrar({ children }: { children: React.ReactNode }) {
  const { form } = useRecipeForm();
  const applyPatch = React.useMemo(() => makeFormApplyPatch(form), [form]);
  useIngredientArrayActionsRegister(applyPatch);
  return <>{children}</>;
}

type FieldArrayReturn = ReturnType<typeof useFieldArray<RecipeFormInput, 'recipeIngredients'>>;

const IdentityProbeFieldArrayContext = createContext<FieldArrayReturn | null>(null);

function useIdentityProbeFieldArray(): FieldArrayReturn {
  const ctx = useContext(IdentityProbeFieldArrayContext);
  if (!ctx) throw new Error('IdentityProbeFieldArrayContext missing');
  return ctx;
}

function FieldArrayBackedApplyPatchRegistrar({ children }: { children: React.ReactNode }) {
  const { form } = useRecipeForm();
  const fieldArray = useFieldArray({ control: form.control, name: 'recipeIngredients' });
  const applyPatch: ApplyIngredientEditPatch = React.useMemo(
    () => patch => {
      switch (patch.kind) {
        case 'replace':
          fieldArray.update(patch.index, patch.row as RecipeFormInput['recipeIngredients'][number]);
          return;
        case 'merge':
          fieldArray.update(
            patch.intoIndex,
            patch.row as RecipeFormInput['recipeIngredients'][number]
          );
          fieldArray.remove(patch.removeIndex);
          return;
        case 'remove':
          fieldArray.remove(patch.index);
          return;
        case 'append':
          fieldArray.append(patch.row as RecipeFormInput['recipeIngredients'][number]);
      }
    },
    [fieldArray]
  );
  useIngredientArrayActionsRegister(applyPatch);
  return (
    <IdentityProbeFieldArrayContext.Provider value={fieldArray}>
      {children}
    </IdentityProbeFieldArrayContext.Provider>
  );
}

function createIdentityProbeWrapper(props: RecipePropType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <RecipeFormProvider props={props}>
        <RecipeDialogsProvider>
          <IngredientArrayActionsProvider>
            <FieldArrayBackedApplyPatchRegistrar>{children}</FieldArrayBackedApplyPatchRegistrar>
          </IngredientArrayActionsProvider>
        </RecipeDialogsProvider>
      </RecipeFormProvider>
    );
  };
}

function createIngredientsWrapper(props: RecipePropType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <RecipeFormProvider props={props}>
        <RecipeDialogsProvider>
          <IngredientArrayActionsProvider>
            <FormDrivenApplyPatchRegistrar>{children}</FormDrivenApplyPatchRegistrar>
          </IngredientArrayActionsProvider>
        </RecipeDialogsProvider>
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
      setMockIngredients(testIngredients);
      setMockTags(testTags);
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
      mockAddIngredient.mockImplementation(async ing => ({ ...(ing as object), id: 100 }));
    });

    afterEach(() => {
      loggerWarnSpy.mockRestore();
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '300@@g--Flour',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        expect(result.current.form.form.getValues('recipeIngredients')[0].quantity).toBe('300');
        expect(result.current.form.form.getValues('recipeIngredients')[0].name).toBe('Flour');
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '200@@kg--Flour',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        expect(result.current.form.form.getValues('recipeIngredients')[0].unit).toBe('kg');
        expect(result.current.form.form.getValues('recipeIngredients')[0].name).toBe('Flour');
      });

      test('resolves an unresolved row against the database when the committed name is unchanged', async () => {
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.form.form.setValue(
            'recipeIngredients',
            [{ name: 'Flour', quantity: '200', unit: '' }] as never,
            { shouldValidate: false }
          );
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '200@@g--Flour',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          const row = result.current.form.form.getValues('recipeIngredients')[0];
          expect(row.type).toBe(ingredientType.baking);
          expect(row.season).toBeDefined();
          expect(row.id).toBe(9);
        });
      });

      test('clears stale row-level error after quantity-only edit', async () => {
        const recipeMissingQty: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [
            {
              id: 1,
              name: 'Flour',
              unit: 'g',
              quantity: '',
              type: ingredientType.cereal,
              season: [],
            },
          ],
        };
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeMissingQty));

        const { result } = renderHook(
          () => ({ ingredients: useRecipeIngredients(), form: useRecipeForm() }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
        });

        await act(async () => {
          await result.current.form.form.trigger('recipeIngredients');
        });

        const rawErrorsBefore = (
          result.current.form.form.control as unknown as {
            _formState: { errors: { recipeIngredients?: { quantity?: unknown }[] } };
          }
        )._formState.errors;
        expect(rawErrorsBefore.recipeIngredients?.[0]?.quantity).toBeDefined();

        await act(async () => {
          result.current.ingredients.editIngredients(
            0,
            '250@@g--Flour',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          const rawErrorsAfter = (
            result.current.form.form.control as unknown as {
              _formState: { errors: { recipeIngredients?: { quantity?: unknown }[] } };
            }
          )._formState.errors;
          expect(rawErrorsAfter.recipeIngredients?.[0]?.quantity).toBeUndefined();
        });
        expect(result.current.form.form.getValues('recipeIngredients')[0].quantity).toBe('250');
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
          result.current.editIngredients(-1, '100@@g--Test', noopApplyPatch);
        });

        expect(loggerWarnSpy).toHaveBeenCalledWith(
          'Cannot edit ingredient - invalid index',
          expect.objectContaining({ index: -1 })
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
          result.current.editIngredients(100, '100@@g--Test', noopApplyPatch);
        });

        expect(loggerWarnSpy).toHaveBeenCalledWith(
          'Cannot edit ingredient - invalid index',
          expect.objectContaining({ index: 100 })
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '200@@g--Spaghettis',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          expect(result.current.dialogs.validationQueue).not.toBeNull();
        });
      });

      test('exact match replaces ingredient directly without queue', async () => {
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '200@@g--Spaghetti',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')[0].name).toBe('Spaghetti');
        });

        expect(result.current.dialogs.validationQueue).toBeNull();
      });

      test('preserves ingredient order when name changes to exact match', async () => {
        const spaghettiIngredient = testIngredients.find(i => i.name === 'Spaghetti')!;
        mockFindSimilarIngredients.mockImplementation((name: string) => {
          if (name.toLowerCase() === 'spaghetti') {
            return [spaghettiIngredient];
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '200@@g--Spaghetti',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')[0].name).toBe('Spaghetti');
        });

        expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
      });

      test('preserves ingredient order when validation is confirmed', async () => {
        const spaghettiIngredient = testIngredients.find(i => i.name === 'Spaghetti')!;
        mockFindSimilarIngredients.mockImplementation((name: string) => {
          if (name.toLowerCase() === 'spaghettis') {
            return [spaghettiIngredient];
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '200@@g--Spaghettis',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          expect(result.current.dialogs.validationQueue).not.toBeNull();
        });

        const queue = result.current.dialogs.validationQueue as IngredientValidationProps;

        act(() => {
          queue.onValidated(queue.items[0], spaghettiIngredient);
        });

        expect(result.current.form.form.getValues('recipeIngredients')[0].name).toBe('Spaghetti');
        expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
      });

      test('merges duplicate at lower index without splice-shift drift', async () => {
        const flourIngredient = testIngredients.find(i => i.name === 'Flour')!;
        mockFindSimilarIngredients.mockImplementation((name: string) => {
          if (name.toLowerCase() === 'flour') return [flourIngredient];
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        // Edit row 2 (Milk) to "Flour" — duplicate at row 0. Names match exact,
        // so replaceIngredientAtIndex fires directly without a queue.
        act(() => {
          result.current.ingredients.editIngredients(
            2,
            '150@@g--Flour',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        const ingredients = result.current.form.form.getValues('recipeIngredients');
        expect(ingredients).toHaveLength(2);
        // Merged Flour lands at the lower of the two indices (the surviving slot)
        expect(ingredients[0].name).toBe('Flour');
        expect(ingredients[0].quantity).toBe('350');
        expect(ingredients[1].name).toBe('Sugar');
      });

      test('removes ingredient when validation dialog is dismissed', async () => {
        const spaghettiIngredient = testIngredients.find(i => i.name === 'Spaghetti')!;
        mockFindSimilarIngredients.mockImplementation((name: string) => {
          if (name.toLowerCase() === 'spaghettis') {
            return [spaghettiIngredient];
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '200@@g--Spaghettis',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          expect(result.current.dialogs.validationQueue).not.toBeNull();
        });

        const queue = result.current.dialogs.validationQueue as IngredientValidationProps;

        act(() => {
          queue.onDismissed?.(queue.items[0]);
        });

        expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(2);
        expect(
          result.current.form.form.getValues('recipeIngredients').some(i => i.name === 'Flour')
        ).toBe(false);
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
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

        expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(4);
        expect(result.current.form.form.getValues('recipeIngredients')[3].name).toBe('Butter');
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
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

        expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        expect(result.current.form.form.getValues('recipeIngredients')[0].quantity).toBe('300');
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
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

        expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        expect(result.current.form.form.getValues('recipeIngredients')[0].unit).toBe('kg');
        expect(result.current.form.form.getValues('recipeIngredients')[0].quantity).toBe('0.5');
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
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

        expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        expect(result.current.form.form.getValues('recipeIngredients')[0].quantity).toBe('300');
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
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

        const merged = result.current.form.form.getValues('recipeIngredients')[0];
        expect(merged.quantity).toBe('300');
        expect(merged.type).toBe(ingredientType.cereal);
        expect(merged.season).toEqual(['1', '2', '3']);
      });

      test('merges names that differ only by leading/trailing whitespace', async () => {
        const recipeWithSpaced: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [
            {
              id: 1,
              name: '  Carotte',
              unit: 'g',
              quantity: '100',
              type: ingredientType.vegetable,
              season: [],
            },
          ],
        };
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithSpaced));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 1,
            name: 'Carotte  ',
            unit: 'g',
            quantity: '50',
            type: ingredientType.vegetable,
            season: [],
          });
        });

        expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
        expect(result.current.form.form.getValues('recipeIngredients')![0].quantity).toBe('150');
      });

      test('merges names that differ only by NFC equivalence (decomposed vs precomposed é)', async () => {
        const decomposedCafe = 'Café';
        const precomposedCafe = 'Café';
        const recipeWithDecomposed: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [
            {
              id: 1,
              name: decomposedCafe,
              unit: 'g',
              quantity: '100',
              type: ingredientType.vegetable,
              season: [],
            },
          ],
        };
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithDecomposed)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 1,
            name: precomposedCafe,
            unit: 'g',
            quantity: '50',
            type: ingredientType.vegetable,
            season: [],
          });
        });

        expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
        expect(result.current.form.form.getValues('recipeIngredients')![0].quantity).toBe('150');
      });

      test('does NOT merge unrelated names that happen to share a token', async () => {
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
          expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 99,
            name: 'Whole Wheat Flour',
            unit: 'g',
            quantity: '50',
            type: ingredientType.cereal,
            season: [],
          });
        });

        expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(4);
      });

      test('preserves existing quantity when incoming has none (different unit)', async () => {
        const recipeWithQty: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [
            {
              id: 1,
              name: 'Riz basmati Bio',
              unit: 'g égoutté',
              quantity: '200',
              type: ingredientType.cereal,
              season: [],
            },
          ],
        };
        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithQty));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 1,
            name: 'Riz basmati Bio',
            unit: 'g',
            quantity: '',
            type: ingredientType.cereal,
            season: [],
          });
        });

        expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
        expect(result.current.form.form.getValues('recipeIngredients')![0].unit).toBe('g');
        expect(result.current.form.form.getValues('recipeIngredients')![0].quantity).toBe('200');
      });

      test('merges names that differ only by internal whitespace', async () => {
        const recipeWithDoubleSpaced: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [
            {
              id: 1,
              name: 'Riz basmati  Bio',
              unit: 'g',
              quantity: '200',
              type: ingredientType.cereal,
              season: [],
            },
          ],
        };
        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithDoubleSpaced)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
        });

        act(() => {
          result.current.ingredients.addOrMergeIngredient({
            id: 1,
            name: 'Riz basmati Bio',
            unit: 'g',
            quantity: '50',
            type: ingredientType.cereal,
            season: [],
          });
        });

        expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
        expect(result.current.form.form.getValues('recipeIngredients')![0].quantity).toBe('250');
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
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

        expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(2);
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(2);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '300@@g--Flour%%for the sauce',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        expect(result.current.form.form.getValues('recipeIngredients')[0].quantity).toBe('300');
        expect(result.current.form.form.getValues('recipeIngredients')[0].note).toBe(
          'for the sauce'
        );
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(2);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '200@@g--Flour%%for the filling',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        expect(result.current.form.form.getValues('recipeIngredients')[0].note).toBe(
          'for the filling'
        );
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(2);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '200@@g--Flour%%',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        expect(result.current.form.form.getValues('recipeIngredients')[0].note).toBe('');
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(2);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            1,
            '100@@g--Sugar%%for the topping',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        expect(result.current.form.form.getValues('recipeIngredients')[1].note).toBe(
          'for the topping'
        );
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '200@@g--Flour%%for the dough',
            makeFormApplyPatch(result.current.form.form)
          );
          result.current.ingredients.editIngredients(
            1,
            '100@@g--Sugar%%for the topping',
            makeFormApplyPatch(result.current.form.form)
          );
          result.current.ingredients.editIngredients(
            2,
            '2@@tsp--Salt%%a pinch',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        expect(result.current.form.form.getValues('recipeIngredients')[0].quantity).toBe('200');
        expect(result.current.form.form.getValues('recipeIngredients')[0].note).toBe(
          'for the dough'
        );
        expect(result.current.form.form.getValues('recipeIngredients')[1].quantity).toBe('100');
        expect(result.current.form.form.getValues('recipeIngredients')[1].note).toBe(
          'for the topping'
        );
        expect(result.current.form.form.getValues('recipeIngredients')[2].quantity).toBe('2');
        expect(result.current.form.form.getValues('recipeIngredients')[2].note).toBe('a pinch');
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
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

        expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(2);
        expect(result.current.form.form.getValues('recipeIngredients')[0].quantity).toBe('200');
        expect(result.current.form.form.getValues('recipeIngredients')[0].note).toBe(
          'for the sauce'
        );
        expect(result.current.form.form.getValues('recipeIngredients')[1].quantity).toBe('100');
        expect(result.current.form.form.getValues('recipeIngredients')[1].note).toBe(
          'for the filling'
        );
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
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

        expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
        expect(result.current.form.form.getValues('recipeIngredients')[0].quantity).toBe('300');
        expect(result.current.form.form.getValues('recipeIngredients')[0].note).toBe(
          'for the sauce'
        );
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
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

        expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
        expect(result.current.form.form.getValues('recipeIngredients')[0].quantity).toBe('300');
        expect(result.current.form.form.getValues('recipeIngredients')[0].note).toBe(
          'for the filling'
        );
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
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

        expect(result.current.form.form.getValues('recipeIngredients')[0].quantity).toBe('300');
        expect(result.current.form.form.getValues('recipeIngredients')[0].note).toBe(
          'for the sauce'
        );
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
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

        expect(result.current.form.form.getValues('recipeIngredients')[0].unit).toBe('kg');
        expect(result.current.form.form.getValues('recipeIngredients')[0].note).toBe(
          'for the bread'
        );
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
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

        const ingredients = result.current.form.form.getValues('recipeIngredients');
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(2);
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

        const ingredients = result.current.form.form.getValues('recipeIngredients');
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(2);
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

        const ingredients = result.current.form.form.getValues('recipeIngredients');
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
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

        expect(result.current.form.form.getValues('recipeIngredients')[0].name).toBe('Flour');
        expect(result.current.form.form.getValues('recipeIngredients')[1].name).toBe('Sugar');
        expect(result.current.form.form.getValues('recipeIngredients')[2].name).toBe('Milk');
      });

      test('preserves object identity for non-matching rows so UI subscribers do not re-render', async () => {
        const recipeWithDuplicates: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [
            { name: 'Olive Oil', quantity: '2', unit: 'càs' } as never,
            { name: 'Salt', quantity: '1', unit: 'tsp' } as never,
            { name: 'Olive Oil', quantity: '', unit: '' } as never,
          ],
        };
        const wrapper = createIdentityProbeWrapper(
          createMockRecipeProp('edit', recipeWithDuplicates)
        );

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            fieldArray: useIdentityProbeFieldArray(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.fieldArray.fields).toHaveLength(3);
        });

        const saltBefore = result.current.fieldArray.fields[1];

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

        const saltAfter = result.current.fieldArray.fields[1];
        expect(saltAfter.id).toBe(saltBefore.id);
        expect(saltAfter.name).toBe('Salt');
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '200@@g--Flour',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        expect(result.current.form.form.getValues('recipeIngredients')[0].name).toBe('Flour');
        expect(result.current.form.form.getValues('recipeIngredients')[0].quantity).toBe('200');
      });

      test('updates ingredient type from database match', async () => {
        const spaghettiIngredient = testIngredients.find(i => i.name === 'Spaghetti')!;
        mockFindSimilarIngredients.mockImplementation((name: string) => {
          if (name.toLowerCase() === 'spaghetti') {
            return [spaghettiIngredient];
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '200@@g--Spaghetti',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          const spaghetti = result.current.form.form
            .getValues('recipeIngredients')
            .find(i => i.name === 'Spaghetti');
          expect(spaghetti).toBeDefined();
          expect(spaghetti?.type).toBeDefined();
        });
      });

      test('uses database unit and quantity when original row has none (fresh add from dropdown)', async () => {
        const spaghettiIngredient = testIngredients.find(i => i.name === 'Spaghetti')!;
        mockFindSimilarIngredients.mockImplementation((name: string) => {
          if (name.toLowerCase() === 'spaghetti') {
            return [spaghettiIngredient];
          }
          return [];
        });

        const recipeWithEmptyRow: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [
            { name: '', unit: '', quantity: '', type: ingredientType.cereal, season: [] },
          ],
        };

        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithEmptyRow));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
            dialogs: useRecipeDialogs(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '@@--Spaghetti',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          const updated = result.current.form.form.getValues('recipeIngredients')[0];
          expect(updated.name).toBe('Spaghetti');
          expect(updated.unit).toBe(spaghettiIngredient.unit);
          expect(updated.quantity ?? '').toBe(spaghettiIngredient.quantity ?? '');
        });
      });

      test('preserves user-set unit and quantity when renaming an existing ingredient', async () => {
        const spaghettiIngredient = testIngredients.find(i => i.name === 'Spaghetti')!;
        mockFindSimilarIngredients.mockImplementation((name: string) => {
          if (name.toLowerCase() === 'spaghetti') {
            return [spaghettiIngredient];
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '350@@kg--Spaghetti',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          const updated = result.current.form.form.getValues('recipeIngredients')[0];
          expect(updated.name).toBe('Spaghetti');
          expect(updated.unit).toBe('kg');
          expect(updated.quantity).toBe('350');
        });
      });
    });

    describe('replaceIngredientAtIndex - duplicate merging', () => {
      test('replaces ingredient at index and removes duplicate when exact match has different unit', async () => {
        const spaghettiIngredient = testIngredients.find(i => i.name === 'Spaghetti')!;
        const spaghettiWithDifferentUnit = { ...spaghettiIngredient, unit: 'piece' };

        mockFindSimilarIngredients.mockImplementation((name: string) => {
          if (name.toLowerCase() === 'spaghetti') {
            return [spaghettiWithDifferentUnit];
          }
          return [];
        });

        const recipeWithDuplicate: recipeTableElement = {
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
            {
              id: 2,
              name: 'Spaghetti',
              unit: 'g',
              quantity: '100',
              type: ingredientType.cereal,
              season: [],
            },
            {
              id: 3,
              name: 'Milk',
              unit: 'ml',
              quantity: '250',
              type: ingredientType.dairy,
              season: [],
            },
          ],
        };

        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithDuplicate));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
            dialogs: useRecipeDialogs(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '300@@piece--Spaghetti',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(2);
        });

        const spaghetti = result.current.form.form
          .getValues('recipeIngredients')
          .find(i => i.name === 'Spaghetti');
        expect(spaghetti).toBeDefined();
        expect(spaghetti?.unit).toBe('piece');
      });

      test('merges quantities when exact match name matches another ingredient with same unit', async () => {
        const spaghettiIngredient = testIngredients.find(i => i.name === 'Spaghetti')!;
        const spaghettiWithSameUnit = { ...spaghettiIngredient, unit: 'g' };

        mockFindSimilarIngredients.mockImplementation((name: string) => {
          if (name.toLowerCase() === 'spaghetti') {
            return [spaghettiWithSameUnit];
          }
          return [];
        });

        const recipeWithDuplicateUnit: recipeTableElement = {
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
            {
              id: 2,
              name: 'Spaghetti',
              unit: 'g',
              quantity: '100',
              type: ingredientType.cereal,
              season: [],
            },
            {
              id: 3,
              name: 'Milk',
              unit: 'ml',
              quantity: '250',
              type: ingredientType.dairy,
              season: [],
            },
          ],
        };

        const wrapper = createIngredientsWrapper(
          createMockRecipeProp('edit', recipeWithDuplicateUnit)
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '300@@g--Spaghetti',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(2);
        });

        const spaghetti = result.current.form.form
          .getValues('recipeIngredients')
          .find(i => i.name === 'Spaghetti');
        expect(spaghetti).toBeDefined();
        expect(Number(spaghetti?.quantity)).toBe(400);
      });
    });

    describe('updateIngredient - no-op field branches', () => {
      test('does not update fields when values are identical to existing', async () => {
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
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(3);
        });

        const originalIngredient = result.current.form.form.getValues('recipeIngredients')[0];

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            `${originalIngredient.quantity}@@${originalIngredient.unit}--${originalIngredient.name}`,
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          const updated = result.current.form.form.getValues('recipeIngredients')[0];
          expect(updated.name).toBe(originalIngredient.name);
          expect(updated.quantity).toBe(originalIngredient.quantity);
          expect(updated.unit).toBe(originalIngredient.unit);
        });
      });

      test('updateIngredient does not update id when new ingredient has no id', async () => {
        const recipeWithKnownId: recipeTableElement = {
          ...recipeWithIngredients,
          ingredients: [
            {
              id: 42,
              name: 'Flour',
              unit: 'g',
              quantity: '200',
              type: ingredientType.cereal,
              season: [],
            },
          ],
        };

        const wrapper = createIngredientsWrapper(createMockRecipeProp('edit', recipeWithKnownId));

        const { result } = renderHook(
          () => ({
            ingredients: useRecipeIngredients(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
        });

        act(() => {
          result.current.ingredients.editIngredients(
            0,
            '300@@g--Flour',
            makeFormApplyPatch(result.current.form.form)
          );
        });

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')[0].quantity).toBe('300');
        });

        expect(result.current.form.form.getValues('recipeIngredients')[0].id).toBe(42);
      });
    });
  });
});
