import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { UseFormReturn } from 'react-hook-form';
import {
  ApplyIngredientEditPatch,
  formatIngredientString,
  useRecipeIngredients,
} from '@hooks/useRecipeIngredients';
import { RecipeFormProvider, useRecipeForm } from '@test-helpers/recipeFormTestProvider';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';
import { createMockRecipeProp } from '@test-helpers/recipeHookTestWrapper';
import {
  IngredientArrayActionsProvider,
  useIngredientArrayActionsRegister,
} from '@screens/recipe/fields/IngredientArrayActionsContext';
import RecipeDatabase from '@utils/RecipeDatabase';
import {
  FormIngredientElement,
  ingredientTableElement,
  ingredientType,
} from '@customTypes/DatabaseElementTypes';
import { RecipeFormInput } from '@schemas/recipeFormSchema';
import { IngredientValidationProps } from '@components/dialogs/ValidationQueue';

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

const tomato: ingredientTableElement = {
  name: 'Tomato',
  unit: 'g',
  type: ingredientType.vegetable,
  season: [],
};

const onion: ingredientTableElement = {
  name: 'Onion',
  unit: 'g',
  type: ingredientType.vegetable,
  season: [],
};

const garlic: ingredientTableElement = {
  name: 'Garlic',
  unit: 'clove',
  type: ingredientType.condiment,
  season: [],
};

const seededIngredients: ingredientTableElement[] = [tomato, onion, garlic];

function FormDrivenApplyPatchRegistrar({ children }: { children: React.ReactNode }) {
  const { form } = useRecipeForm();
  const applyPatch = React.useMemo(() => makeFormApplyPatch(form), [form]);
  useIngredientArrayActionsRegister(applyPatch);
  return <>{children}</>;
}

function createWrapper() {
  const props = createMockRecipeProp('addManually');
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

function renderIngredientHook() {
  return renderHook(
    () => ({
      ingredientOps: useRecipeIngredients(),
      form: useRecipeForm(),
      dialogs: useRecipeDialogs(),
    }),
    { wrapper: createWrapper() }
  );
}

describe('RecipeFormIngredientsPipeline (real DB + FuzzyIndex, no internal mocks)', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    database = RecipeDatabase.getInstance();
    await database.init();
    await database.addMultipleIngredients(seededIngredients);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  describe('addOrMergeIngredient', () => {
    test('adds new ingredient to empty form', async () => {
      const { result } = renderIngredientHook();

      act(() => {
        result.current.ingredientOps.addOrMergeIngredient({
          name: 'Tomato',
          unit: 'g',
          quantity: '100',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
      expect(result.current.form.form.getValues('recipeIngredients')![0]!.name).toBe('Tomato');
      expect(result.current.form.form.getValues('recipeIngredients')![0]!.quantity).toBe('100');
    });

    test('merges quantities when duplicate name + same unit', async () => {
      const { result } = renderIngredientHook();

      act(() => {
        result.current.ingredientOps.addOrMergeIngredient({
          name: 'Onion',
          unit: 'g',
          quantity: '50',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      act(() => {
        result.current.ingredientOps.addOrMergeIngredient({
          name: 'Onion',
          unit: 'g',
          quantity: '75',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
      expect(result.current.form.form.getValues('recipeIngredients')![0]!.quantity).toBe('125');
    });

    test('replaces existing when duplicate name + different unit', async () => {
      const { result } = renderIngredientHook();

      act(() => {
        result.current.ingredientOps.addOrMergeIngredient({
          name: 'Garlic',
          unit: 'clove',
          quantity: '2',
          type: ingredientType.condiment,
          season: [],
        });
      });

      act(() => {
        result.current.ingredientOps.addOrMergeIngredient({
          name: 'Garlic',
          unit: 'g',
          quantity: '10',
          type: ingredientType.condiment,
          season: [],
        });
      });

      expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
      expect(result.current.form.form.getValues('recipeIngredients')![0]!.unit).toBe('g');
      expect(result.current.form.form.getValues('recipeIngredients')![0]!.quantity).toBe('10');
    });

    test('adds as separate ingredient when same name + same unit + different non-empty notes', async () => {
      const { result } = renderIngredientHook();

      act(() => {
        result.current.ingredientOps.addOrMergeIngredient({
          name: 'Tomato',
          unit: 'g',
          quantity: '100',
          type: ingredientType.vegetable,
          season: [],
          note: 'for the sauce',
        });
      });

      act(() => {
        result.current.ingredientOps.addOrMergeIngredient({
          name: 'Tomato',
          unit: 'g',
          quantity: '50',
          type: ingredientType.vegetable,
          season: [],
          note: 'for the salad',
        });
      });

      expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(2);
      expect(result.current.form.form.getValues('recipeIngredients')![0]!.note).toBe(
        'for the sauce'
      );
      expect(result.current.form.form.getValues('recipeIngredients')![1]!.note).toBe(
        'for the salad'
      );
    });
  });

  describe('editIngredients', () => {
    test('updates quantity in-place without triggering validation when name does not change', async () => {
      const { result } = renderIngredientHook();

      act(() => {
        result.current.ingredientOps.addOrMergeIngredient({
          name: 'Onion',
          unit: 'g',
          quantity: '100',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      act(() => {
        result.current.ingredientOps.editIngredients(
          0,
          formatIngredientString({ name: 'Onion', unit: 'g', quantity: '200', season: [] }),
          makeFormApplyPatch(result.current.form.form)
        );
      });

      expect(result.current.form.form.getValues('recipeIngredients')![0]!.quantity).toBe('200');
      expect(result.current.form.form.getValues('recipeIngredients')![0]!.name).toBe('Onion');
      expect(result.current.dialogs.validationQueue).toBeNull();
    });

    test('triggers validation queue when name changes to a fuzzy-matching DB ingredient', async () => {
      const { result } = renderIngredientHook();

      act(() => {
        result.current.form.form.setValue('recipeIngredients', [{ name: '' }] as never, {
          shouldValidate: true,
        });
      });

      act(() => {
        result.current.ingredientOps.editIngredients(
          0,
          formatIngredientString({ name: 'Onions', unit: 'g', quantity: '100', season: [] }),
          makeFormApplyPatch(result.current.form.form)
        );
      });

      await waitFor(() => {
        expect(result.current.dialogs.validationQueue).not.toBeNull();
      });

      const queue = result.current.dialogs.validationQueue as IngredientValidationProps;
      expect(queue.type).toBe('Ingredient');
      expect(queue.items.length).toBeGreaterThan(0);
    });

    test('resolves directly without validation queue when name changes to an exact DB match', async () => {
      const { result } = renderIngredientHook();

      act(() => {
        result.current.form.form.setValue('recipeIngredients', [{ name: '' }] as never, {
          shouldValidate: true,
        });
      });

      act(() => {
        result.current.ingredientOps.editIngredients(
          0,
          formatIngredientString({ name: 'Tomato', unit: 'g', quantity: '150', season: [] }),
          makeFormApplyPatch(result.current.form.form)
        );
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeIngredients')![0]!.name).toBe('Tomato');
      });

      expect(result.current.dialogs.validationQueue).toBeNull();
    });
  });
});
