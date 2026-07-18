import React from 'react';
import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { recipeFormSchema, RecipeFormInput } from '@schemas/recipeFormSchema';
import { defaultValueNumber } from '@utils/Constants';
import { useInlineErrorFor } from '@screens/recipe/helpers/inlineErrorGate';

type Form = UseFormReturn<RecipeFormInput>;

const t = (key: string) => key;

function Probe({ name }: { name: 'recipeTitle' }) {
  const state = useInlineErrorFor(name, t);
  return (
    <>
      <Text testID='error'>{state.error ?? ''}</Text>
      <Text testID='isTouched'>{state.isTouched ? 'true' : 'false'}</Text>
      <Text testID='showInlineError'>{state.showInlineError ? 'true' : 'false'}</Text>
      <Text testID='hasBeenEdited'>{state.hasBeenEdited ? 'true' : 'false'}</Text>
    </>
  );
}

function renderHostedProbe(defaults?: Partial<RecipeFormInput>) {
  const formRef: { current: Form | null } = { current: null };
  function Host() {
    const form = useForm<RecipeFormInput>({
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
    React.useEffect(() => {
      formRef.current = form;
    });
    return (
      <FormProvider {...form}>
        <Probe name='recipeTitle' />
      </FormProvider>
    );
  }
  const utils = render(<Host />);
  if (!formRef.current) throw new Error('form not captured');
  return { ...utils, form: formRef.current };
}

describe('useInlineErrorFor', () => {
  test('returns no error before the field has been touched or the form submitted', () => {
    const { getByTestId } = renderHostedProbe();
    expect(getByTestId('error').props.children).toBe('');
    expect(getByTestId('isTouched').props.children).toBe('false');
    expect(getByTestId('showInlineError').props.children).toBe('false');
  });

  test('surfaces the translated inline error after the field is edited and invalid', async () => {
    const { getByTestId, form } = renderHostedProbe({ recipeTitle: 'Pancakes' });
    await act(async () => {
      form.setValue('recipeTitle', '', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    });
    expect(getByTestId('isTouched').props.children).toBe('true');
    expect(getByTestId('error').props.children).toBe('alerts.inlineErrors.titleRecipe');
  });

  test('hides the inline error after a bare blur with no edit', async () => {
    const { getByTestId, form } = renderHostedProbe();
    await act(async () => {
      form.setValue('recipeTitle', '', { shouldTouch: true, shouldValidate: true });
    });
    expect(getByTestId('isTouched').props.children).toBe('true');
    expect(getByTestId('error').props.children).toBe('');
    expect(getByTestId('showInlineError').props.children).toBe('false');
  });

  test('keeps the inline error after the field is edited then cleared back to empty', async () => {
    const { getByTestId, form } = renderHostedProbe();
    await act(async () => {
      form.setValue('recipeTitle', 'Temp', { shouldDirty: true, shouldTouch: true });
    });
    await act(async () => {
      form.setValue('recipeTitle', '', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    });
    expect(getByTestId('isTouched').props.children).toBe('true');
    expect(getByTestId('error').props.children).toBe('alerts.inlineErrors.titleRecipe');
  });

  test('latches hasBeenEdited once the field is edited and keeps it after clearing', async () => {
    const { getByTestId, form } = renderHostedProbe();
    expect(getByTestId('hasBeenEdited').props.children).toBe('false');
    await act(async () => {
      form.setValue('recipeTitle', 'Temp', { shouldDirty: true, shouldTouch: true });
    });
    expect(getByTestId('hasBeenEdited').props.children).toBe('true');
    await act(async () => {
      form.setValue('recipeTitle', '', { shouldDirty: true, shouldTouch: true });
    });
    expect(getByTestId('hasBeenEdited').props.children).toBe('true');
  });

  test('keeps hasBeenEdited latched after form.reset() since it tracks the component lifetime', async () => {
    const { getByTestId, form } = renderHostedProbe();
    await act(async () => {
      form.setValue('recipeTitle', 'Temp', { shouldDirty: true, shouldTouch: true });
    });
    expect(getByTestId('hasBeenEdited').props.children).toBe('true');
    await act(async () => {
      form.reset({ ...form.getValues(), recipeTitle: '' });
    });
    expect(getByTestId('hasBeenEdited').props.children).toBe('true');
  });

  test('keeps hasBeenEdited false after a bare blur with no edit', async () => {
    const { getByTestId, form } = renderHostedProbe();
    await act(async () => {
      form.setValue('recipeTitle', '', { shouldTouch: true, shouldValidate: true });
    });
    expect(getByTestId('hasBeenEdited').props.children).toBe('false');
  });

  test('surfaces the inline error after submit even when the field was never touched', async () => {
    const { getByTestId, form } = renderHostedProbe();
    await act(async () => {
      await form.handleSubmit(
        () => {},
        () => {}
      )();
    });
    expect(getByTestId('showInlineError').props.children).toBe('true');
    expect(getByTestId('error').props.children).toBe('alerts.inlineErrors.titleRecipe');
  });

  test('returns no error when programmatic setValue does not mark the field touched', async () => {
    const { getByTestId, form } = renderHostedProbe({ recipeTitle: 'Pancakes' });
    await act(async () => {
      form.setValue('recipeTitle', '', { shouldTouch: false, shouldValidate: true });
    });
    expect(getByTestId('error').props.children).toBe('');
    expect(getByTestId('isTouched').props.children).toBe('false');
  });

  test('form.reset() clears touchedFields and re-hides the inline error', async () => {
    const { getByTestId, form } = renderHostedProbe({ recipeTitle: 'Pancakes' });
    await act(async () => {
      form.setValue('recipeTitle', '', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    });
    expect(getByTestId('error').props.children).toBe('alerts.inlineErrors.titleRecipe');
    await act(async () => {
      form.reset({ ...form.getValues(), recipeTitle: 'Pancakes' });
    });
    expect(getByTestId('isTouched').props.children).toBe('false');
    expect(getByTestId('error').props.children).toBe('');
  });
});
