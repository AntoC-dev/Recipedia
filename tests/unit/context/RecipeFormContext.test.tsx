import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { RecipeFormProvider, useRecipeForm } from '@context/RecipeFormContext';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import { createMockRecipeProp, defaultTestRecipe } from '@test-helpers/recipeHookTestWrapper';
import { recipeStateType } from '@customTypes/ScreenTypes';
import { ingredientType, recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testTags } from '@data/tagsDataset';
import { testIngredients } from '@data/ingredientsDataset';

jest.mock('expo-sqlite', () => require('@mocks/deps/expo-sqlite-mock').expoSqliteMock());
jest.mock('@utils/FileGestion', () =>
  require('@mocks/utils/FileGestion-mock.tsx').fileGestionMock()
);
jest.mock('@utils/settings', () => require('@mocks/utils/settings-mock').settingsMock());
jest.mock('@utils/firstLaunch', () => ({
  isFirstLaunch: jest.fn().mockResolvedValue(false),
}));

function createFormWrapper(props: RecipePropType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <RecipeDatabaseProvider>
        <RecipeFormProvider props={props}>{children}</RecipeFormProvider>
      </RecipeDatabaseProvider>
    );
  };
}

const dbInstance = RecipeDatabase.getInstance();

describe('RecipeFormContext', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await dbInstance.init();
    await dbInstance.addMultipleIngredients(testIngredients);
    await dbInstance.addMultipleTags(testTags);
  });

  afterEach(async () => {
    await dbInstance.reset();
  });

  describe('initialization from props', () => {
    test('initializes state from recipe in readOnly mode', async () => {
      const wrapper = createFormWrapper(createMockRecipeProp('readOnly', defaultTestRecipe));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.recipeTitle).toBe(defaultTestRecipe.title);
      });

      expect(result.current.state.recipeImage).toBe(defaultTestRecipe.image_Source);
      expect(result.current.state.recipeDescription).toBe(defaultTestRecipe.description);
      expect(result.current.state.recipePersons).toBe(defaultTestRecipe.persons);
      expect(result.current.state.recipeTime).toBe(defaultTestRecipe.time);
      expect(result.current.state.stackMode).toBe(recipeStateType.readOnly);
      expect(result.current.initStateFromProp).toBe(true);
    });

    test('initializes state from recipe in edit mode', async () => {
      const wrapper = createFormWrapper(createMockRecipeProp('edit', defaultTestRecipe));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.recipeTitle).toBe(defaultTestRecipe.title);
      });

      expect(result.current.state.stackMode).toBe(recipeStateType.edit);
      expect(result.current.initStateFromProp).toBe(true);
    });

    test('initializes empty state for addManually mode', async () => {
      const wrapper = createFormWrapper(createMockRecipeProp('addManually'));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.stackMode).toBe(recipeStateType.addManual);
      });

      expect(result.current.state.recipeTitle).toBe('');
      expect(result.current.state.recipeDescription).toBe('');
      expect(result.current.state.recipeImage).toBe('');
      expect(result.current.state.recipeIngredients).toEqual([]);
      expect(result.current.state.recipePreparation).toEqual([]);
      expect(result.current.state.recipeTags).toEqual([]);
      expect(result.current.initStateFromProp).toBe(false);
    });

    test('initializes with imgUri for addFromPic mode', async () => {
      const testImgUri = 'file://test-ocr-image.jpg';
      const wrapper = createFormWrapper(createMockRecipeProp('addFromPic', undefined, testImgUri));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.stackMode).toBe(recipeStateType.addOCR);
      });

      expect(result.current.state.imgForOCR).toContain(testImgUri);
      expect(result.current.initStateFromProp).toBe(false);
    });

    test('loads default persons for add modes', async () => {
      const wrapper = createFormWrapper(createMockRecipeProp('addManually'));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.recipePersons).toBe(2);
      });
    });
  });

  describe('ingredient scaling', () => {
    test('scales ingredient quantities when persons changes', async () => {
      const recipeWith4Persons: recipeTableElement = {
        ...defaultTestRecipe,
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
          {
            id: 2,
            name: 'Sugar',
            unit: 'g',
            quantity: '100',
            type: ingredientType.sugar,
            season: [],
          },
        ],
      };

      const wrapper = createFormWrapper(createMockRecipeProp('edit', recipeWith4Persons));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.recipePersons).toBe(4);
      });

      act(() => {
        result.current.setters.setRecipePersons(8);
      });

      await waitFor(() => {
        expect(result.current.state.recipePersons).toBe(8);
        expect(result.current.state.recipeIngredients[0].quantity).toBe('400');
        expect(result.current.state.recipeIngredients[1].quantity).toBe('200');
      });
    });

    test('handles ingredients without quantity during scaling', async () => {
      const recipeWithNoQuantity: recipeTableElement = {
        ...defaultTestRecipe,
        persons: 4,
        ingredients: [
          {
            id: 1,
            name: 'Salt',
            unit: 'pinch',
            quantity: undefined,
            type: ingredientType.condiment,
            season: [],
          },
        ],
      };

      const wrapper = createFormWrapper(createMockRecipeProp('edit', recipeWithNoQuantity));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.recipePersons).toBe(4);
      });

      act(() => {
        result.current.setters.setRecipePersons(8);
      });

      await waitFor(() => {
        expect(result.current.state.recipeIngredients[0].quantity).toBeUndefined();
      });
    });
  });

  describe('resetToOriginal', () => {
    test('resets all fields to original values from props', async () => {
      const wrapper = createFormWrapper(createMockRecipeProp('edit', defaultTestRecipe));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.recipeTitle).toBe(defaultTestRecipe.title);
      });

      act(() => {
        result.current.setters.setRecipeTitle('Modified Title');
        result.current.setters.setRecipeDescription('Modified Description');
        result.current.setters.setRecipePersons(10);
      });

      expect(result.current.state.recipeTitle).toBe('Modified Title');
      expect(result.current.state.recipeDescription).toBe('Modified Description');
      expect(result.current.state.recipePersons).toBe(10);

      act(() => {
        result.current.actions.resetToOriginal();
      });

      await waitFor(() => {
        expect(result.current.state.recipeTitle).toBe(defaultTestRecipe.title);
        expect(result.current.state.recipeDescription).toBe(defaultTestRecipe.description);
        expect(result.current.state.recipePersons).toBe(defaultTestRecipe.persons);
        expect(result.current.state.stackMode).toBe(recipeStateType.readOnly);
      });
    });

    test('switches to readOnly mode after reset', async () => {
      const wrapper = createFormWrapper(createMockRecipeProp('edit', defaultTestRecipe));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.stackMode).toBe(recipeStateType.edit);
      });

      act(() => {
        result.current.actions.resetToOriginal();
      });

      expect(result.current.state.stackMode).toBe(recipeStateType.readOnly);
    });
  });

  describe('createRecipeSnapshot', () => {
    test('creates complete recipe object from current state', async () => {
      const wrapper = createFormWrapper(createMockRecipeProp('edit', defaultTestRecipe));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.recipeTitle).toBe(defaultTestRecipe.title);
      });

      const snapshot = result.current.actions.createRecipeSnapshot();

      expect(snapshot.id).toBe(defaultTestRecipe.id);
      expect(snapshot.title).toBe(defaultTestRecipe.title);
      expect(snapshot.description).toBe(defaultTestRecipe.description);
      expect(snapshot.image_Source).toBe(defaultTestRecipe.image_Source);
      expect(snapshot.persons).toBe(defaultTestRecipe.persons);
      expect(snapshot.time).toBe(defaultTestRecipe.time);
      expect(snapshot.ingredients).toEqual(defaultTestRecipe.ingredients);
      expect(snapshot.preparation).toEqual(defaultTestRecipe.preparation);
      expect(snapshot.tags).toEqual(defaultTestRecipe.tags);
    });

    test('includes modified state in snapshot', async () => {
      const wrapper = createFormWrapper(createMockRecipeProp('edit', defaultTestRecipe));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.recipeTitle).toBe(defaultTestRecipe.title);
      });

      act(() => {
        result.current.setters.setRecipeTitle('Updated Title');
        result.current.setters.setRecipePersons(6);
      });

      const snapshot = result.current.actions.createRecipeSnapshot();

      expect(snapshot.title).toBe('Updated Title');
      expect(snapshot.persons).toBe(6);
      expect(snapshot.id).toBe(defaultTestRecipe.id);
    });

    test('creates recipe without id for new recipes', async () => {
      const wrapper = createFormWrapper(createMockRecipeProp('addManually'));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.stackMode).toBe(recipeStateType.addManual);
      });

      act(() => {
        result.current.setters.setRecipeTitle('New Recipe');
        result.current.setters.setRecipeDescription('New Description');
      });

      const snapshot = result.current.actions.createRecipeSnapshot();

      expect(snapshot.id).toBeUndefined();
      expect(snapshot.title).toBe('New Recipe');
      expect(snapshot.description).toBe('New Description');
    });
  });

  describe('setters', () => {
    test('all setters update state correctly', async () => {
      const wrapper = createFormWrapper(createMockRecipeProp('addManually'));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.stackMode).toBe(recipeStateType.addManual);
      });

      act(() => {
        result.current.setters.setRecipeImage('new-image.jpg');
        result.current.setters.setRecipeTitle('New Title');
        result.current.setters.setRecipeDescription('New Desc');
        result.current.setters.setRecipeTime(45);
        result.current.setters.setRecipeTags([{ id: 1, name: 'TestTag' }]);
        result.current.setters.setRecipePreparation([{ title: 'Step', description: 'Do it' }]);
      });

      expect(result.current.state.recipeImage).toBe('new-image.jpg');
      expect(result.current.state.recipeTitle).toBe('New Title');
      expect(result.current.state.recipeDescription).toBe('New Desc');
      expect(result.current.state.recipeTime).toBe(45);
      expect(result.current.state.recipeTags).toHaveLength(1);
      expect(result.current.state.recipePreparation).toHaveLength(1);
    });

    test('setStackMode changes mode', async () => {
      const wrapper = createFormWrapper(createMockRecipeProp('readOnly', defaultTestRecipe));
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.stackMode).toBe(recipeStateType.readOnly);
      });

      act(() => {
        result.current.setters.setStackMode(recipeStateType.edit);
      });

      expect(result.current.state.stackMode).toBe(recipeStateType.edit);
    });

    test('setImgForOCR updates OCR images', async () => {
      const wrapper = createFormWrapper(
        createMockRecipeProp('addFromPic', undefined, 'initial.jpg')
      );
      const { result } = renderHook(() => useRecipeForm(), { wrapper });

      await waitFor(() => {
        expect(result.current.state.imgForOCR).toContain('initial.jpg');
      });

      act(() => {
        result.current.setters.setImgForOCR(['new1.jpg', 'new2.jpg']);
      });

      expect(result.current.state.imgForOCR).toEqual(['new1.jpg', 'new2.jpg']);
    });
  });

  describe('error handling', () => {
    test('throws error when useRecipeForm is used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useRecipeForm());
      }).toThrow('useRecipeForm must be used within a RecipeFormProvider');

      consoleError.mockRestore();
    });
  });
});
