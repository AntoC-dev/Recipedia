import React, { useRef } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useScalingOnPersonsChange } from '@screens/recipe/hooks/useScalingOnPersonsChange';
import { recipeFormSchema, RecipeFormInput } from '@schemas/recipeFormSchema';
import { defaultValueNumber } from '@utils/Constants';
import { ingredientType } from '@customTypes/DatabaseElementTypes';

function createWrapper(initialValues: RecipeFormInput) {
  const formHolder: { current: UseFormReturn<RecipeFormInput> | null } = { current: null };

  function Inner({ children }: { children: React.ReactNode }) {
    const form = useForm<RecipeFormInput>({
      resolver: zodResolver(recipeFormSchema),
      defaultValues: initialValues,
      mode: 'onTouched',
    });
    // eslint-disable-next-line react-compiler/react-compiler -- test capture; not used during render
    formHolder.current = form;
    return <FormProvider {...form}>{children}</FormProvider>;
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => <Inner>{children}</Inner>;

  return { Wrapper, getForm: () => formHolder.current as UseFormReturn<RecipeFormInput> };
}

function flourSugarValues(persons: number): RecipeFormInput {
  return {
    recipeImage: '',
    recipeTitle: 'Test',
    recipeDescription: 'desc',
    recipeTags: [],
    recipePersons: persons,
    recipeIngredients: [
      { id: 1, name: 'Flour', unit: 'g', quantity: '200', type: ingredientType.cereal, season: [] },
      { id: 2, name: 'Sugar', unit: 'g', quantity: '100', type: ingredientType.sugar, season: [] },
    ] as RecipeFormInput['recipeIngredients'],
    recipePreparation: [{ title: 'Step', description: 'Do' }],
    recipeTime: 30,
    recipeNutrition: undefined,
  };
}

describe('useScalingOnPersonsChange', () => {
  test('scales ingredient quantities when persons doubles', async () => {
    const { Wrapper, getForm } = createWrapper(flourSugarValues(4));
    renderHook(
      () => {
        const ref = useRef<number>(0);
        return useScalingOnPersonsChange(getForm(), 4, ref);
      },
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(getForm().getValues('recipePersons')).toBe(4);
    });

    act(() => {
      getForm().setValue('recipePersons', 8);
    });

    await waitFor(() => {
      expect(getForm().getValues('recipeIngredients')[0].quantity).toBe('400');
      expect(getForm().getValues('recipeIngredients')[1].quantity).toBe('200');
    });
  });

  test('keeps undefined quantities untouched', async () => {
    const values: RecipeFormInput = {
      ...flourSugarValues(4),
      recipeIngredients: [
        {
          id: 1,
          name: 'Salt',
          unit: 'pinch',
          quantity: undefined,
          type: ingredientType.condiment,
          season: [],
        },
      ] as RecipeFormInput['recipeIngredients'],
    };
    const { Wrapper, getForm } = createWrapper(values);
    renderHook(
      () => {
        const ref = useRef<number>(0);
        return useScalingOnPersonsChange(getForm(), 4, ref);
      },
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(getForm().getValues('recipePersons')).toBe(4);
    });

    act(() => {
      getForm().setValue('recipePersons', 8);
    });

    await waitFor(() => {
      expect(getForm().getValues('recipeIngredients')[0].quantity).toBeUndefined();
    });
  });

  test('skips scaling when transition involves sentinel defaultValueNumber', async () => {
    const { Wrapper, getForm } = createWrapper(flourSugarValues(defaultValueNumber));
    renderHook(
      () => {
        const ref = useRef<number>(0);
        return useScalingOnPersonsChange(getForm(), defaultValueNumber, ref);
      },
      { wrapper: Wrapper }
    );

    act(() => {
      getForm().setValue('recipePersons', 8);
    });

    await waitFor(() => {
      expect(getForm().getValues('recipePersons')).toBe(8);
    });
    expect(getForm().getValues('recipeIngredients')[0].quantity).toBe('200');
  });

  test('skips scaling while user is editing a row', async () => {
    const { Wrapper, getForm } = createWrapper(flourSugarValues(4));
    const focusRefHolder: { current: React.MutableRefObject<number> | null } = { current: null };
    renderHook(
      () => {
        const ref = useRef<number>(1);
        focusRefHolder.current = ref;
        return useScalingOnPersonsChange(getForm(), 4, ref);
      },
      { wrapper: Wrapper }
    );

    act(() => {
      getForm().setValue('recipePersons', 8);
    });

    await waitFor(() => {
      expect(getForm().getValues('recipePersons')).toBe(8);
    });
    expect(getForm().getValues('recipeIngredients')[0].quantity).toBe('200');
    expect(focusRefHolder.current?.current).toBe(1);
  });

  test('passes shouldValidate:true so existing array errors clear after rescale', async () => {
    const { Wrapper, getForm } = createWrapper(flourSugarValues(4));
    renderHook(
      () => {
        const ref = useRef<number>(0);
        return useScalingOnPersonsChange(getForm(), 4, ref);
      },
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(getForm().getValues('recipePersons')).toBe(4);
    });

    const setValueSpy = jest.spyOn(getForm(), 'setValue');

    act(() => {
      getForm().setValue('recipePersons', 8);
    });

    const scalingCall = setValueSpy.mock.calls.find(([name]) => name === 'recipeIngredients');
    expect(scalingCall?.[2]).toMatchObject({ shouldValidate: true });
    setValueSpy.mockRestore();
  });
});
