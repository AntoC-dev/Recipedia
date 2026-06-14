/**
 * Test-only replacement for the now-deleted `RecipeFormContext`. Wraps RHF's
 * `<FormProvider>` so hook tests can still mount their dependencies (hooks
 * that read the form via `useFormContext`). Defaults are computed via the
 * same per-mode rules the production routes use.
 *
 * Tests import `RecipeFormProvider` and `useRecipeForm` from this module
 * rather than the production code so the production module can be deleted.
 */

import React, { ReactNode, useRef } from 'react';
import { FormProvider, useForm, UseFormReturn, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ingredientTableElement, recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { defaultValueNumber } from '@utils/Constants';
import { getDefaultPersonsSync } from '@utils/settings';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import { hasRecipeFromProps, hasScrapedDataFromProps } from '@utils/RecipeFormHelpers';
import { recipeFormSchema, RecipeFormInput } from '@schemas/recipeFormSchema';

const recipeFormResolver = zodResolver(recipeFormSchema);

function pickInitial<TKey extends keyof recipeTableElement>(
  props: RecipePropType,
  fromProp: boolean,
  fromScrape: boolean,
  key: TKey,
  fallback: NonNullable<recipeTableElement[TKey]>
): NonNullable<recipeTableElement[TKey]> {
  if (
    fromProp &&
    props.mode !== 'addManually' &&
    props.mode !== 'addFromPic' &&
    props.mode !== 'addFromScrape'
  ) {
    return props.recipe[key] as NonNullable<recipeTableElement[TKey]>;
  }
  if (fromScrape && props.mode === 'addFromScrape') {
    const value = props.scrapedData[key];
    return (value ?? fallback) as NonNullable<recipeTableElement[TKey]>;
  }
  return fallback;
}

function buildDefaultValues(
  props: RecipePropType,
  fromProp: boolean,
  fromScrape: boolean
): RecipeFormInput {
  const fallbackPersons = fromProp || fromScrape ? defaultValueNumber : getDefaultPersonsSync();
  return {
    recipeImage: pickInitial(props, fromProp, fromScrape, 'image_Source', ''),
    recipeTitle: pickInitial(props, fromProp, fromScrape, 'title', ''),
    recipeDescription: pickInitial(props, fromProp, fromScrape, 'description', ''),
    recipeTags: pickInitial(props, fromProp, fromScrape, 'tags', []),
    recipePersons: pickInitial(props, fromProp, fromScrape, 'persons', fallbackPersons),
    recipeIngredients: pickInitial(
      props,
      fromProp,
      fromScrape,
      'ingredients',
      [] as ingredientTableElement[]
    ) as RecipeFormInput['recipeIngredients'],
    recipePreparation: pickInitial(props, fromProp, fromScrape, 'preparation', []),
    recipeTime: pickInitial(props, fromProp, fromScrape, 'time', defaultValueNumber),
    recipeNutrition: fromProp
      ? (props as { mode: 'readOnly' | 'edit'; recipe: recipeTableElement }).recipe.nutrition
      : fromScrape
        ? (
            props as {
              mode: 'addFromScrape';
              scrapedData: Partial<recipeTableElement>;
            }
          ).scrapedData.nutrition
        : undefined,
  };
}

export interface RecipeFormProviderProps {
  props: RecipePropType;
  children: ReactNode;
}

export function RecipeFormProvider({ props, children }: RecipeFormProviderProps) {
  const initStateFromProp = hasRecipeFromProps(props);
  const initStateFromScrape = hasScrapedDataFromProps(props);
  const defaultValuesRef = useRef<RecipeFormInput | null>(null);
  if (defaultValuesRef.current === null) {
    defaultValuesRef.current = buildDefaultValues(props, initStateFromProp, initStateFromScrape);
  }
  const form = useForm<RecipeFormInput>({
    resolver: recipeFormResolver,
    defaultValues: defaultValuesRef.current,
    mode: 'onTouched',
  });
  return <FormProvider {...form}>{children}</FormProvider>;
}

export function useRecipeForm(): { form: UseFormReturn<RecipeFormInput> } {
  const form = useFormContext<RecipeFormInput>();
  return { form };
}
