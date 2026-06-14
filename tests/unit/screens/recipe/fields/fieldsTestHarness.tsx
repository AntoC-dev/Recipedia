import React from 'react';
import { render } from '@testing-library/react-native';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { recipeFormSchema, RecipeFormInput } from '@schemas/recipeFormSchema';
import { defaultValueNumber } from '@utils/Constants';
import { RecipeDialogsProvider } from '@context/RecipeDialogsContext';

export type Form = UseFormReturn<RecipeFormInput>;

export const t = (key: string) => key;

export function useTestForm(defaults?: Partial<RecipeFormInput>) {
  return useForm<RecipeFormInput>({
    resolver: zodResolver(recipeFormSchema),
    mode: 'onTouched',
    defaultValues: {
      recipeImage: '',
      recipeTitle: '',
      recipeDescription: '',
      recipeTags: [],
      recipePersons: defaultValueNumber,
      recipeIngredients: [],
      recipePreparation: [],
      recipeTime: defaultValueNumber,
      recipeNutrition: undefined,
      ...defaults,
    },
  });
}

export function renderWithForm<P extends { form: Form }>(
  Component: React.ComponentType<P>,
  buildProps: (form: Form) => P,
  defaults?: Partial<RecipeFormInput>
) {
  const formRef: { current: Form | null } = { current: null };
  function TestHost() {
    const form = useTestForm(defaults);
    // eslint-disable-next-line react-compiler/react-compiler
    formRef.current = form;
    const built = buildProps(form);
    return (
      <FormProvider {...form}>
        <RecipeDialogsProvider>
          <Component {...built} />
        </RecipeDialogsProvider>
      </FormProvider>
    );
  }
  const utils = render(<TestHost />);
  if (!formRef.current) {
    throw new Error('TestHost failed to capture form');
  }
  return { ...utils, form: formRef.current };
}
