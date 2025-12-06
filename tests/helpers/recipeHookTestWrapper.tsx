import React, { ReactNode } from 'react';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import { RecipeFormProvider } from '@context/RecipeFormContext';
import { RecipeDialogsProvider } from '@context/RecipeDialogsContext';
import {
  AddFromPicProp,
  AddManuallyProp,
  EditRecipeProp,
  ReadRecipeProp,
  RecipeMode,
  RecipePropType,
} from '@customTypes/RecipeNavigationTypes';
import {
  ingredientTableElement,
  ingredientType,
  recipeTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';

export const defaultTestRecipe: recipeTableElement = {
  id: 1,
  image_Source: 'test-image.jpg',
  title: 'Test Recipe',
  description: 'A test recipe description',
  tags: [{ id: 1, name: 'Italian' }],
  persons: 4,
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
  season: [],
  preparation: [{ title: 'Step 1', description: 'Mix ingredients' }],
  time: 30,
};

export function createMockRecipeProp(
  mode: RecipeMode,
  recipe?: recipeTableElement,
  imgUri?: string
): RecipePropType {
  switch (mode) {
    case 'readOnly':
      return {
        mode: 'readOnly',
        recipe: recipe ?? defaultTestRecipe,
      } as ReadRecipeProp;
    case 'edit':
      return {
        mode: 'edit',
        recipe: recipe ?? defaultTestRecipe,
      } as EditRecipeProp;
    case 'addManually':
      return { mode: 'addManually' } as AddManuallyProp;
    case 'addFromPic':
      return {
        mode: 'addFromPic',
        imgUri: imgUri ?? 'test-image-uri.jpg',
      } as AddFromPicProp;
  }
}

interface WrapperOptions {
  props?: RecipePropType;
  initialIngredients?: ingredientTableElement[];
  initialTags?: tagTableElement[];
}

export function createRecipeHookWrapper(
  options?: WrapperOptions
): React.FC<{ children: ReactNode }> {
  const props = options?.props ?? createMockRecipeProp('addManually');

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <RecipeDatabaseProvider>
        <RecipeFormProvider props={props}>
          <RecipeDialogsProvider>{children}</RecipeDialogsProvider>
        </RecipeFormProvider>
      </RecipeDatabaseProvider>
    );
  };
}

export function createRecipeFormWrapper(props: RecipePropType): React.FC<{ children: ReactNode }> {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <RecipeDatabaseProvider>
        <RecipeFormProvider props={props}>{children}</RecipeFormProvider>
      </RecipeDatabaseProvider>
    );
  };
}

export function createRecipeDialogsWrapper(): React.FC<{ children: ReactNode }> {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return <RecipeDialogsProvider>{children}</RecipeDialogsProvider>;
  };
}

export function createDatabaseWrapper(): React.FC<{ children: ReactNode }> {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return <RecipeDatabaseProvider>{children}</RecipeDatabaseProvider>;
  };
}
