import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useRecipeScraperValidation } from '@hooks/useRecipeScraperValidation';
import React, { ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormIngredientElement,
  ingredientTableElement,
  ingredientType,
  recipeTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { RecipeFormProvider, useRecipeForm } from '@test-helpers/recipeFormTestProvider';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';
import { createMockRecipeProp } from '@test-helpers/recipeHookTestWrapper';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import RecipeDatabase from '@utils/RecipeDatabase';
import { IngredientValidationProps, TagValidationProps } from '@components/dialogs/ValidationQueue';
import { ApplyIngredientEditPatch } from '@hooks/useRecipeIngredients';
import { RecipeFormInput } from '@schemas/recipeFormSchema';
import {
  IngredientArrayActionsProvider,
  useIngredientArrayActionsRegister,
} from '@screens/recipe/fields/IngredientArrayActionsContext';

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

function FormDrivenApplyPatchRegistrar({ children }: { children: React.ReactNode }) {
  const { form } = useRecipeForm();
  const applyPatch = React.useMemo(() => makeFormApplyPatch(form), [form]);
  useIngredientArrayActionsRegister(applyPatch);
  return <>{children}</>;
}

const createMockIngredient = (name: string): FormIngredientElement => ({
  name,
  quantity: '100',
  unit: 'g',
});

const createMockTag = (name: string): tagTableElement => ({
  id: 0,
  name,
});

const createScrapedRecipe = (
  ingredients: FormIngredientElement[],
  tags: tagTableElement[]
): recipeTableElement => ({
  id: 1,
  image_Source: 'test.jpg',
  title: 'Scraped Recipe',
  description: 'Test',
  tags,
  persons: 4,
  ingredients: ingredients.map((ing, idx) => ({
    id: idx,
    name: ing.name ?? '',
    unit: ing.unit ?? 'g',
    quantity: ing.quantity ?? '100',
    type: ingredientType.vegetable,
    season: [],
  })),
  season: [],
  preparation: [{ title: 'Step 1', description: 'Cook' }],
  time: 30,
});

function createWrapper(ingredients: FormIngredientElement[], tags: tagTableElement[]) {
  const recipe = createScrapedRecipe(ingredients, tags);
  const props = createMockRecipeProp('addFromScrape', recipe);
  return function Wrapper({ children }: { children: ReactNode }) {
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

function createReadOnlyWrapper() {
  const props = createMockRecipeProp('readOnly');
  return function Wrapper({ children }: { children: ReactNode }) {
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

describe('useRecipeScraperValidation', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    jest.clearAllMocks();
    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('does not trigger validation when not in addScrape mode', () => {
    const wrapper = createReadOnlyWrapper();

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    expect(result.current.validationQueue).toBeNull();
  });

  test('does not trigger validation when no ingredients or tags', () => {
    const wrapper = createWrapper([], []);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    expect(result.current.validationQueue).toBeNull();
  });

  test('starts ingredient validation when ingredients need validation', async () => {
    const wrapper = createWrapper([createMockIngredient('UnknownIngredient')], []);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.validationQueue).not.toBeNull();
    });
    expect(result.current.validationQueue?.type).toBe('Ingredient');
  });

  test('starts tag validation when tags need validation', async () => {
    const wrapper = createWrapper([], [createMockTag('UnknownTag')]);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.validationQueue).not.toBeNull();
    });
    expect(result.current.validationQueue?.type).toBe('Tag');
  });

  test('validates tags before ingredients when both need validation', async () => {
    const wrapper = createWrapper(
      [createMockIngredient('UnknownIngredient')],
      [createMockTag('UnknownTag')]
    );

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.validationQueue).not.toBeNull();
    });
    expect(result.current.validationQueue?.type).toBe('Tag');
  });

  test('does not trigger validation for known ingredients', async () => {
    const knownIngredientName = testIngredients[0]!.name;
    const wrapper = createWrapper([createMockIngredient(knownIngredientName)], []);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.validationQueue).toBeNull();
    });
  });

  test('does not trigger validation for known tags', async () => {
    const knownTagName = testTags[0]!.name;
    const wrapper = createWrapper([], [createMockTag(knownTagName)]);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.validationQueue).toBeNull();
    });
  });

  test('ingredient onValidated callback replaces matching form ingredients', async () => {
    const unknownIngredientName = 'UnknownIngredient';
    const wrapper = createWrapper([createMockIngredient(unknownIngredientName)], []);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return {
          dialogs: useRecipeDialogs(),
          form: useRecipeForm(),
        };
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.dialogs.validationQueue).not.toBeNull();
    });

    const queue = result.current.dialogs.validationQueue as IngredientValidationProps;
    const validatedIngredient = {
      id: 99,
      name: unknownIngredientName,
      type: ingredientType.vegetable,
      unit: 'g',
      quantity: '100',
      season: [],
    };

    act(() => {
      queue.onValidated(
        { name: unknownIngredientName, quantity: '100', similarItems: [] },
        validatedIngredient
      );
    });

    await waitFor(() => {
      const updatedIngredient = result.current.form.form
        .getValues('recipeIngredients')
        .find(ing => ing.name === unknownIngredientName);
      expect(updatedIngredient).toBeDefined();
      expect((updatedIngredient as typeof validatedIngredient).id).toBe(99);
      expect((updatedIngredient as typeof validatedIngredient).type).toBe(ingredientType.vegetable);
    });
  });

  test('ingredient onDismissed callback removes the ingredient from recipe', async () => {
    const unknownIngredientName = 'UnknownIngredient';
    const wrapper = createWrapper([createMockIngredient(unknownIngredientName)], []);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return {
          dialogs: useRecipeDialogs(),
          form: useRecipeForm(),
        };
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.dialogs.validationQueue).not.toBeNull();
    });

    const queue = result.current.dialogs.validationQueue as IngredientValidationProps;

    act(() => {
      queue.onDismissed?.({
        name: unknownIngredientName,
        quantity: '100',
        unit: 'g',
        season: [],
        similarItems: [],
      });
    });

    await waitFor(() => {
      const remainingIngredient = result.current.form.form
        .getValues('recipeIngredients')
        .find(ing => ing.name === unknownIngredientName);
      expect(remainingIngredient).toBeUndefined();
    });
  });

  test('tag onValidated callback replaces matching tags in recipe', async () => {
    const unknownTagName = 'UnknownTag';
    const wrapper = createWrapper([], [createMockTag(unknownTagName)]);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return {
          dialogs: useRecipeDialogs(),
          form: useRecipeForm(),
        };
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.dialogs.validationQueue).not.toBeNull();
    });

    const queue = result.current.dialogs.validationQueue as TagValidationProps;
    const validatedTag = { id: 42, name: unknownTagName };

    act(() => {
      queue.onValidated({ id: 0, name: unknownTagName, similarItems: [] }, validatedTag);
    });

    await waitFor(() => {
      const tags = result.current.form.form.getValues('recipeTags')!;
      const replacedTag = tags.find(tag => tag.name === unknownTagName);
      expect(replacedTag).toBeDefined();
      expect(replacedTag?.id).toBe(42);
    });
  });

  test('tag onDismissed callback removes the tag from recipe', async () => {
    const unknownTagName = 'UnknownTag';
    const wrapper = createWrapper([], [createMockTag(unknownTagName)]);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return {
          dialogs: useRecipeDialogs(),
          form: useRecipeForm(),
        };
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.dialogs.validationQueue).not.toBeNull();
    });

    const queue = result.current.dialogs.validationQueue as TagValidationProps;

    act(() => {
      queue.onDismissed?.({ id: 0, name: unknownTagName, similarItems: [] });
    });

    await waitFor(() => {
      const tags = result.current.form.form.getValues('recipeTags')!;
      expect(tags.some(tag => tag.name === unknownTagName)).toBe(false);
    });
  });

  test('tag onValidated does not throw when recipeTags form value is undefined', async () => {
    const unknownTagName = 'UnknownTag';
    const wrapper = createWrapper([], [createMockTag(unknownTagName)]);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return {
          dialogs: useRecipeDialogs(),
          form: useRecipeForm(),
        };
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.dialogs.validationQueue).not.toBeNull();
    });

    act(() => {
      result.current.form.form.setValue('recipeTags', undefined as never);
    });

    const queue = result.current.dialogs.validationQueue as TagValidationProps;

    act(() => {
      queue.onValidated(
        { id: 0, name: unknownTagName, similarItems: [] },
        { id: 42, name: unknownTagName }
      );
    });

    await waitFor(() => {
      expect(result.current.form.form.getValues('recipeTags')).toEqual([]);
    });
  });

  test('tag onDismissed does not throw when recipeTags form value is undefined', async () => {
    const unknownTagName = 'UnknownTag';
    const wrapper = createWrapper([], [createMockTag(unknownTagName)]);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return {
          dialogs: useRecipeDialogs(),
          form: useRecipeForm(),
        };
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.dialogs.validationQueue).not.toBeNull();
    });

    act(() => {
      result.current.form.form.setValue('recipeTags', undefined as never);
    });

    const queue = result.current.dialogs.validationQueue as TagValidationProps;

    act(() => {
      queue.onDismissed?.({ id: 0, name: unknownTagName, similarItems: [] });
    });

    await waitFor(() => {
      expect(result.current.form.form.getValues('recipeTags')).toEqual([]);
    });
  });

  test('starts ingredient validation after tag queue completes when both need validation', async () => {
    const unknownIngredientName = 'UnknownIngredient';
    const unknownTagName = 'UnknownTag';
    const wrapper = createWrapper(
      [createMockIngredient(unknownIngredientName)],
      [createMockTag(unknownTagName)]
    );

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.validationQueue?.type).toBe('Tag');
    });

    act(() => {
      result.current.clearValidationQueue();
    });

    await waitFor(() => {
      expect(result.current.validationQueue?.type).toBe('Ingredient');
    });
  });
});
