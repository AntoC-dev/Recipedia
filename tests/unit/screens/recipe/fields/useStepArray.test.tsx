import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { recipeFormSchema, RecipeFormInput } from '@schemas/recipeFormSchema';
import { defaultValueNumber } from '@utils/Constants';
import { useStepArray } from '@screens/recipe/fields/useStepArray';

function buildDefaults(preparation: RecipeFormInput['recipePreparation']): RecipeFormInput {
  return {
    recipeImage: '',
    recipeTitle: 'Test',
    recipeDescription: '',
    recipeTags: [],
    recipePersons: defaultValueNumber,
    recipeIngredients: [],
    recipePreparation: preparation,
    recipeTime: defaultValueNumber,
    recipeNutrition: undefined,
  };
}

async function renderUseStepArray(preparation: RecipeFormInput['recipePreparation'] = []) {
  const formRef: { current: UseFormReturn<RecipeFormInput> | null } = { current: null };
  const { result } = await renderHook(() => {
    const form = useForm<RecipeFormInput>({
      resolver: zodResolver(recipeFormSchema),
      mode: 'onTouched',
      defaultValues: buildDefaults(preparation),
    });
    formRef.current = form;
    return useStepArray(form);
  });
  return { result, formRef };
}

describe('useStepArray', () => {
  test('length reflects the initial preparation array', async () => {
    const { result } = await renderUseStepArray([
      { title: 'A', description: 'first' },
      { title: 'B', description: 'second' },
    ]);
    expect(result.current.length).toBe(2);
    expect(result.current.fields).toHaveLength(2);
  });

  test('length is zero when there are no initial steps', async () => {
    const { result } = await renderUseStepArray([]);
    expect(result.current.length).toBe(0);
    expect(result.current.fields).toHaveLength(0);
  });

  test('addStep appends a blank step to the form value', async () => {
    const { result, formRef } = await renderUseStepArray([]);

    await act(() => {
      result.current.addStep();
    });

    expect(formRef.current!.getValues('recipePreparation')).toEqual([
      { title: '', description: '' },
    ]);
  });

  test('addStep increments length and grows the fields list', async () => {
    const { result } = await renderUseStepArray([{ title: 'A', description: 'first' }]);

    await act(() => {
      result.current.addStep();
    });

    expect(result.current.length).toBe(2);
    expect(result.current.fields).toHaveLength(2);
  });

  test('each appended step keeps existing rows untouched', async () => {
    const { result, formRef } = await renderUseStepArray([{ title: 'Keep', description: 'me' }]);

    await act(() => {
      result.current.addStep();
    });

    const prep = formRef.current!.getValues('recipePreparation')!;
    expect(prep[0]).toEqual({ title: 'Keep', description: 'me' });
    expect(prep[1]).toEqual({ title: '', description: '' });
  });

  test('removeStep deletes the targeted step and keeps the others in order', async () => {
    const { result, formRef } = await renderUseStepArray([
      { title: 'A', description: 'first' },
      { title: 'B', description: 'second' },
      { title: 'C', description: 'third' },
    ]);

    await act(() => {
      result.current.removeStep(1);
    });

    expect(formRef.current!.getValues('recipePreparation')).toEqual([
      { title: 'A', description: 'first' },
      { title: 'C', description: 'third' },
    ]);
    expect(result.current.length).toBe(2);
    expect(result.current.fields).toHaveLength(2);
  });

  test('removeStep on the only step empties the array and re-validates the preparation', async () => {
    const { result, formRef } = await renderUseStepArray([{ title: 'A', description: 'only' }]);

    await act(async () => {
      result.current.removeStep(0);
    });

    expect(formRef.current!.getValues('recipePreparation')).toEqual([]);
    await waitFor(() => {
      expect(formRef.current!.getFieldState('recipePreparation').error?.root?.message).toBe(
        'alerts.missingElements.titlePreparation'
      );
    });
  });
});

describe('useStepArray moveStep', () => {
  const threeSteps = [
    { title: 'A', description: 'first' },
    { title: 'B', description: 'second' },
    { title: 'C', description: 'third' },
  ];

  test.each([
    [0, 1, ['B', 'A', 'C']],
    [2, 1, ['A', 'C', 'B']],
    [0, 2, ['B', 'C', 'A']],
  ])('moves step %s to position %s', async (from, to, expectedTitles) => {
    const { result, formRef } = await renderUseStepArray(threeSteps);

    await act(() => {
      result.current.moveStep(from, to);
    });

    expect(formRef.current!.getValues('recipePreparation')!.map(step => step.title)).toEqual(
      expectedTitles
    );
    expect(result.current.fields.map(field => field.title)).toEqual(expectedTitles);
    expect(result.current.length).toBe(3);
  });

  test('carries a step validation error along with the moved step', async () => {
    const { result, formRef } = await renderUseStepArray([
      { title: 'A', description: '' },
      { title: 'B', description: 'second' },
    ]);
    await act(async () => {
      await formRef.current!.trigger('recipePreparation');
    });
    expect(formRef.current!.getFieldState('recipePreparation.0.description').error).toBeDefined();

    await act(() => {
      result.current.moveStep(0, 1);
    });

    await waitFor(() => {
      expect(formRef.current!.getFieldState('recipePreparation.1.description').error).toBeDefined();
    });
    expect(formRef.current!.getFieldState('recipePreparation.0.description').error).toBeUndefined();
  });
});
