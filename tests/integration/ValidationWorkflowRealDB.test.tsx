import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useValidationWorkflow } from '@hooks/useValidationWorkflow';
import { useIngredients } from '@hooks/useIngredients';
import { useTags } from '@hooks/useTags';
import { RecipeDatabase } from '@utils/RecipeDatabase';
import {
  ingredientTableElement,
  ingredientType,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { ConvertedImportRecipe } from '@customTypes/BulkImportTypes';

const DEFAULT_PERSONS = 4;

function buildRecipe(
  title: string,
  tagNames: string[],
  ingredientNames: string[]
): ConvertedImportRecipe {
  return {
    title,
    description: `${title} description`,
    imageUrl: 'https://example.com/image.jpg',
    persons: DEFAULT_PERSONS,
    time: 30,
    tags: tagNames.map(name => ({ id: 0, name })),
    ingredients: ingredientNames.map(name => ({
      id: 0,
      name,
      unit: 'g',
      quantity: '100',
      type: ingredientType.vegetable,
      season: [],
    })),
    preparation: [{ title: 'Step 1', description: 'Cook it' }],
    sourceUrl: `https://example.com/${title.toLowerCase().replace(/\s/g, '-')}`,
    sourceProvider: 'test',
  };
}

function buildIngredient(name: string): ingredientTableElement {
  return { name, unit: 'g', type: ingredientType.vegetable, season: [] };
}

function buildTag(name: string): tagTableElement {
  return { name };
}

function renderWorkflow(recipes: ConvertedImportRecipe[], db: RecipeDatabase) {
  const { result: tagResult } = renderHook(() => useTags());
  const { result: ingredientResult } = renderHook(() => useIngredients());

  const findSimilarTags = (name: string) => tagResult.current.findSimilarTags(name);
  const findSimilarIngredients = (name: string) =>
    ingredientResult.current.findSimilarIngredients(name);

  const { result } = renderHook(() =>
    useValidationWorkflow(
      recipes,
      db.addMultipleRecipes.bind(db),
      DEFAULT_PERSONS,
      findSimilarTags,
      findSimilarIngredients
    )
  );

  return result;
}

describe('useValidationWorkflow with real DB', () => {
  let db: RecipeDatabase;

  beforeEach(async () => {
    db = RecipeDatabase.getInstance();
    await db.init();
  });

  afterEach(async () => {
    await db.closeAndReset();
  });

  describe('exact match bypass', () => {
    test('ingredient with exact DB name skips validation queue and goes to complete', async () => {
      await db.addMultipleIngredients([buildIngredient('Tomato')]);

      const recipes = [buildRecipe('Pasta', [], ['Tomato'])];
      const result = renderWorkflow(recipes, db);

      await waitFor(
        () => {
          expect(['importing', 'complete']).toContain(result.current.phase);
        },
        { timeout: 5000 }
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(result.current.validationState?.ingredientsToValidate).toHaveLength(0);
      expect(result.current.validationState?.ingredientMappings.size).toBeGreaterThan(0);
    });

    test('tag with exact DB name skips validation queue', async () => {
      await db.addMultipleIngredients([buildIngredient('Chicken')]);
      await db.addMultipleTags([buildTag('Italian')]);

      const recipes = [buildRecipe('Pasta', ['Italian'], ['Chicken'])];
      const result = renderWorkflow(recipes, db);

      await waitFor(
        () => {
          expect(['importing', 'complete']).toContain(result.current.phase);
        },
        { timeout: 5000 }
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(result.current.validationState?.tagsToValidate).toHaveLength(0);
      expect(result.current.validationState?.tagMappings.has('italian')).toBe(true);
    });

    test('exact match is case-insensitive', async () => {
      await db.addMultipleIngredients([buildIngredient('tomato')]);

      const recipes = [buildRecipe('Pasta', [], ['Tomato'])];
      const result = renderWorkflow(recipes, db);

      await waitFor(
        () => {
          expect(result.current.phase).toBe('complete');
        },
        { timeout: 5000 }
      );

      expect(result.current.validationState?.ingredientsToValidate).toHaveLength(0);
    });
  });

  describe('fuzzy match routing', () => {
    test('fuzzy-only ingredient match routes to reviewing phase', async () => {
      await db.addMultipleIngredients([buildIngredient('Tomato')]);

      const recipes = [buildRecipe('Pasta', [], ['Tomatoe'])];
      const result = renderWorkflow(recipes, db);

      await waitFor(
        () => {
          expect(result.current.phase).toBe('reviewing');
        },
        { timeout: 5000 }
      );

      expect(result.current.validationState?.ingredientsToValidate).toHaveLength(1);
      const fuzzyItem = result.current.validationState!.ingredientsToValidate[0];
      expect(fuzzyItem.similarItems.length).toBeGreaterThan(0);
    });

    test('fuzzy-only tag match routes to reviewing phase', async () => {
      await db.addMultipleTags([buildTag('Italian')]);
      await db.addMultipleIngredients([buildIngredient('Chicken')]);

      const recipes = [buildRecipe('Pasta', ['Italyan'], ['Chicken'])];
      const result = renderWorkflow(recipes, db);

      await waitFor(
        () => {
          expect(result.current.phase).toBe('reviewing');
        },
        { timeout: 5000 }
      );

      expect(result.current.validationState?.tagsToValidate).toHaveLength(1);
      const fuzzyTag = result.current.validationState!.tagsToValidate[0];
      expect(fuzzyTag.similarItems.length).toBeGreaterThan(0);
    });
  });

  describe('no match at all', () => {
    test('brand new ingredient with empty DB routes to reviewing', async () => {
      const recipes = [buildRecipe('Pasta', [], ['XyzUnknownIngredient99'])];
      const result = renderWorkflow(recipes, db);

      await waitFor(
        () => {
          expect(result.current.phase).toBe('reviewing');
        },
        { timeout: 5000 }
      );

      expect(result.current.validationState?.ingredientsToValidate).toHaveLength(1);
      expect(result.current.validationState?.ingredientsToValidate[0].similarItems).toHaveLength(0);
    });

    test('brand new tag with empty DB routes to reviewing', async () => {
      await db.addMultipleIngredients([buildIngredient('Chicken')]);

      const recipes = [buildRecipe('Pasta', ['XyzBrandNewTag99'], ['Chicken'])];
      const result = renderWorkflow(recipes, db);

      await waitFor(
        () => {
          expect(result.current.phase).toBe('reviewing');
        },
        { timeout: 5000 }
      );

      expect(result.current.validationState?.tagsToValidate).toHaveLength(1);
      expect(result.current.validationState?.tagsToValidate[0].similarItems).toHaveLength(0);
    });
  });

  describe('full import flow', () => {
    test('startImport persists recipes to DB after fuzzy-match validation', async () => {
      const dbIngredient = await db.addIngredient(buildIngredient('Tomato'));

      const recipes = [buildRecipe('Pasta', [], ['Tomatoe'])];
      const result = renderWorkflow(recipes, db);

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      act(() => {
        result.current.handlers.onIngredientValidated('Tomatoe', dbIngredient);
      });

      act(() => {
        result.current.handlers.startImport();
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      const savedRecipes = db.get_recipes();
      expect(savedRecipes).toHaveLength(1);
      expect(savedRecipes[0].title).toBe('Pasta');
      expect(result.current.importedCount).toBe(1);
    });

    test('multiple recipes all saved after validation with real DB ingredients', async () => {
      const dbIngredient1 = await db.addIngredient(buildIngredient('Chicken'));
      const dbIngredient2 = await db.addIngredient(buildIngredient('Rice'));

      const recipes = [buildRecipe('Pasta', [], ['Chickin']), buildRecipe('Pizza', [], ['Ryce'])];
      const result = renderWorkflow(recipes, db);

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      act(() => {
        result.current.handlers.onIngredientValidated('Chickin', dbIngredient1);
        result.current.handlers.onIngredientValidated('Ryce', dbIngredient2);
      });

      act(() => {
        result.current.handlers.startImport();
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(db.get_recipes()).toHaveLength(2);
      expect(result.current.importedCount).toBe(2);
    });
  });

  describe('phase transitions', () => {
    test('starts as initializing then moves to reviewing for unknown ingredients', async () => {
      const recipes = [buildRecipe('Pasta', [], ['UnknownIngredient'])];

      const { result: tagResult } = renderHook(() => useTags());
      const { result: ingredientResult } = renderHook(() => useIngredients());

      const findSimilarTags = (name: string) => tagResult.current.findSimilarTags(name);
      const findSimilarIngredients = (name: string) =>
        ingredientResult.current.findSimilarIngredients(name);

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          db.addMultipleRecipes.bind(db),
          DEFAULT_PERSONS,
          findSimilarTags,
          findSimilarIngredients
        )
      );

      expect(result.current.phase).toBe('initializing');

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });
    });

    test('full phase sequence: initializing → reviewing → importing → complete', async () => {
      const recipes = [buildRecipe('Pasta', [], ['SomeNewIng'])];
      const result = renderWorkflow(recipes, db);

      expect(result.current.phase).toBe('initializing');

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      const validatedIngredient: ingredientTableElement = {
        id: 1,
        name: 'SomeNewIng',
        unit: 'g',
        type: ingredientType.vegetable,
        season: [],
      };

      act(() => {
        result.current.handlers.onIngredientValidated('SomeNewIng', validatedIngredient);
      });

      act(() => {
        result.current.handlers.startImport();
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });
    });
  });

  describe('handlers', () => {
    test('onTagValidated adds mapping to validation state', async () => {
      await db.addMultipleIngredients([buildIngredient('Chicken')]);

      const recipes = [buildRecipe('Pasta', ['NewTagHere'], ['Chicken'])];
      const result = renderWorkflow(recipes, db);

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      const originalTag: tagTableElement = { id: 0, name: 'NewTagHere' };
      const validatedTag: tagTableElement = { id: 99, name: 'Italian' };

      act(() => {
        result.current.handlers.onTagValidated(originalTag, validatedTag);
      });

      expect(result.current.validationState?.tagMappings.size).toBeGreaterThan(0);
    });

    test('onIngredientValidated adds mapping to validation state', async () => {
      const recipes = [buildRecipe('Pasta', [], ['NewIngHere'])];
      const result = renderWorkflow(recipes, db);

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      const validatedIngredient: ingredientTableElement = {
        id: 99,
        name: 'ValidatedIng',
        unit: 'g',
        type: ingredientType.vegetable,
        season: [],
      };

      act(() => {
        result.current.handlers.onIngredientValidated('NewIngHere', validatedIngredient);
      });

      expect(result.current.validationState?.ingredientMappings.size).toBeGreaterThan(0);
    });

    test('after validating all items startImport completes the workflow', async () => {
      const dbIngredient = await db.addIngredient(buildIngredient('IngA'));
      const dbTag = await db.addTag(buildTag('TagA'));

      const recipes = [buildRecipe('Pasta', ['TagX'], ['IngX'])];
      const result = renderWorkflow(recipes, db);

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      act(() => {
        result.current.handlers.onTagValidated({ id: 0, name: 'TagX' }, dbTag);
        result.current.handlers.onIngredientValidated('IngX', dbIngredient);
      });

      act(() => {
        result.current.handlers.startImport();
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(db.get_recipes()).toHaveLength(1);
    });
  });

  describe('progress tracking', () => {
    test('progress is null during initializing and populated during reviewing', async () => {
      const recipes = [buildRecipe('Pasta', ['TagX', 'TagY'], ['IngX'])];

      const { result: tagResult } = renderHook(() => useTags());
      const { result: ingredientResult } = renderHook(() => useIngredients());

      const findSimilarTags = (name: string) => tagResult.current.findSimilarTags(name);
      const findSimilarIngredients = (name: string) =>
        ingredientResult.current.findSimilarIngredients(name);

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          db.addMultipleRecipes.bind(db),
          DEFAULT_PERSONS,
          findSimilarTags,
          findSimilarIngredients
        )
      );

      expect(result.current.progress).toBeNull();

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      expect(result.current.progress).not.toBeNull();
      expect(result.current.progress?.totalTags).toBe(2);
      expect(result.current.progress?.totalIngredients).toBe(1);
    });
  });
});
