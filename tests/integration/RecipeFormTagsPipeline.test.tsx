import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useRecipeTags } from '@hooks/useRecipeTags';
import { RecipeFormProvider, useRecipeForm } from '@test-helpers/recipeFormTestProvider';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';
import { createMockRecipeProp } from '@test-helpers/recipeHookTestWrapper';
import RecipeDatabase from '@utils/RecipeDatabase';
import { tagTableElement } from '@customTypes/DatabaseElementTypes';

const italianTag: tagTableElement = { name: 'Italian', id: undefined };
const quickMealsTag: tagTableElement = { name: 'Quick Meals', id: undefined };

const seededTags: tagTableElement[] = [italianTag, quickMealsTag];

function createWrapper() {
  const props = createMockRecipeProp('addManually');
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <RecipeFormProvider props={props}>
        <RecipeDialogsProvider>{children}</RecipeDialogsProvider>
      </RecipeFormProvider>
    );
  };
}

function renderTagHook() {
  return renderHook(
    () => ({
      tagOps: useRecipeTags(),
      form: useRecipeForm(),
      dialogs: useRecipeDialogs(),
    }),
    { wrapper: createWrapper() }
  );
}

describe('RecipeFormTagsPipeline (real useTags + real RecipeDatabase)', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    database = RecipeDatabase.getInstance();
    await database.init();
    await database.addMultipleTags(seededTags);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  describe('addTag — exact DB match', () => {
    test('tag added directly to form without going through validation queue', async () => {
      const { result } = renderTagHook();

      act(() => {
        result.current.tagOps.addTag('Italian');
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeTags')!).toHaveLength(1);
      });

      expect(result.current.form.form.getValues('recipeTags')![0].name).toBe('Italian');
      expect(result.current.dialogs.validationQueue).toBeNull();
    });
  });

  describe('addTag — fuzzy (similar but not exact) DB match', () => {
    test('validation queue is set when a close-but-not-exact name is entered', async () => {
      const { result } = renderTagHook();

      act(() => {
        result.current.tagOps.addTag('Quik Meels');
      });

      await waitFor(() => {
        expect(result.current.dialogs.validationQueue).not.toBeNull();
      });

      expect(result.current.dialogs.validationQueue?.type).toBe('Tag');
      expect(result.current.form.form.getValues('recipeTags')!).toHaveLength(0);
    });
  });

  describe('addTag — no DB match', () => {
    test('brand-new tag with no similar entry is queued for validation', async () => {
      const { result } = renderTagHook();

      act(() => {
        result.current.tagOps.addTag('Completely Unique Tag XYZABC');
      });

      await waitFor(() => {
        expect(result.current.dialogs.validationQueue).not.toBeNull();
      });

      expect(result.current.dialogs.validationQueue?.type).toBe('Tag');
    });
  });

  describe('addTag — empty string', () => {
    test('empty tag name is a no-op', () => {
      const { result } = renderTagHook();

      act(() => {
        result.current.tagOps.addTag('');
      });

      expect(result.current.form.form.getValues('recipeTags')!).toHaveLength(0);
      expect(result.current.dialogs.validationQueue).toBeNull();
    });
  });

  describe('addTag — duplicate', () => {
    test('adding a tag that already exists in form is a no-op (case-insensitive)', async () => {
      const { result } = renderTagHook();

      act(() => {
        result.current.tagOps.addTag('Italian');
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeTags')!).toHaveLength(1);
      });

      act(() => {
        result.current.dialogs.clearValidationQueue();
        result.current.tagOps.addTag('ITALIAN');
      });

      expect(result.current.form.form.getValues('recipeTags')!).toHaveLength(1);
      expect(result.current.dialogs.validationQueue).toBeNull();
    });
  });

  describe('removeTag', () => {
    test('tag is removed from form by exact name', async () => {
      const { result } = renderTagHook();

      act(() => {
        result.current.tagOps.addTag('Italian');
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeTags')!).toHaveLength(1);
      });

      act(() => {
        result.current.tagOps.removeTag('Italian');
      });

      expect(result.current.form.form.getValues('recipeTags')!).toHaveLength(0);
    });
  });

  describe('addTagIfNotDuplicate', () => {
    test('does not add when tag already exists in form (case-insensitive)', async () => {
      const { result } = renderTagHook();

      act(() => {
        result.current.tagOps.addTag('Italian');
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeTags')!).toHaveLength(1);
      });

      act(() => {
        result.current.tagOps.addTagIfNotDuplicate({ id: 1, name: 'ITALIAN' });
      });

      expect(result.current.form.form.getValues('recipeTags')!).toHaveLength(1);
    });

    test('adds tag when it is genuinely new', async () => {
      const { result } = renderTagHook();

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeTags')!).toHaveLength(0);
      });

      act(() => {
        result.current.tagOps.addTagIfNotDuplicate({ id: 5, name: 'Vegan' });
      });

      expect(result.current.form.form.getValues('recipeTags')!).toHaveLength(1);
      expect(result.current.form.form.getValues('recipeTags')![0].name).toBe('Vegan');
    });
  });
});
