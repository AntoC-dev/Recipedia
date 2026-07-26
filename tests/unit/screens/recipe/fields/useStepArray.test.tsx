import { act, renderHook } from '@testing-library/react-native';
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

function renderUseStepArray(preparation: RecipeFormInput['recipePreparation'] = []) {
  const formRef: { current: UseFormReturn<RecipeFormInput> | null } = { current: null };
  const { result } = renderHook(() => {
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
  test('length reflects the initial preparation array', () => {
    const { result } = renderUseStepArray([
      { title: 'A', description: 'first' },
      { title: 'B', description: 'second' },
    ]);
    expect(result.current.length).toBe(2);
    expect(result.current.fields).toHaveLength(2);
  });

  test('length is zero when there are no initial steps', () => {
    const { result } = renderUseStepArray([]);
    expect(result.current.length).toBe(0);
    expect(result.current.fields).toHaveLength(0);
  });

  test('addStep appends a blank step to the form value', () => {
    const { result, formRef } = renderUseStepArray([]);

    act(() => {
      result.current.addStep();
    });

    expect(formRef.current!.getValues('recipePreparation')).toEqual([
      { title: '', description: '' },
    ]);
  });

  test('addStep increments length and grows the fields list', () => {
    const { result } = renderUseStepArray([{ title: 'A', description: 'first' }]);

    act(() => {
      result.current.addStep();
    });

    expect(result.current.length).toBe(2);
    expect(result.current.fields).toHaveLength(2);
  });

  test('each appended step keeps existing rows untouched', () => {
    const { result, formRef } = renderUseStepArray([{ title: 'Keep', description: 'me' }]);

    act(() => {
      result.current.addStep();
    });

    const prep = formRef.current!.getValues('recipePreparation')!;
    expect(prep[0]).toEqual({ title: 'Keep', description: 'me' });
    expect(prep[1]).toEqual({ title: '', description: '' });
  });
});
