import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useRecipePreparation } from '@hooks/useRecipePreparation';
import { RecipeFormProvider, useRecipeForm } from '@context/RecipeFormContext';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import { createMockRecipeProp } from '@test-helpers/recipeHookTestWrapper';
import { ingredientType, recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testTags } from '@data/tagsDataset';
import { testIngredients } from '@data/ingredientsDataset';
import * as logger from '@utils/logger';

jest.mock('expo-sqlite', () => require('@mocks/deps/expo-sqlite-mock').expoSqliteMock());
jest.mock('@utils/FileGestion', () =>
  require('@mocks/utils/FileGestion-mock.tsx').fileGestionMock()
);
jest.mock('@utils/settings', () => require('@mocks/utils/settings-mock').settingsMock());
jest.mock('@utils/firstLaunch', () => ({
  isFirstLaunch: jest.fn().mockResolvedValue(false),
}));

function createPreparationWrapper(props: RecipePropType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <RecipeDatabaseProvider>
        <RecipeFormProvider props={props}>{children}</RecipeFormProvider>
      </RecipeDatabaseProvider>
    );
  };
}

const recipeWithPreparation: recipeTableElement = {
  id: 1,
  image_Source: 'test.jpg',
  title: 'Test Recipe',
  description: 'Test',
  tags: [],
  persons: 4,
  ingredients: [
    { id: 1, name: 'Flour', unit: 'g', quantity: '200', type: ingredientType.cereal, season: [] },
  ],
  season: [],
  preparation: [
    { title: 'Step 1', description: 'First step description' },
    { title: 'Step 2', description: 'Second step description' },
    { title: 'Step 3', description: 'Third step description' },
  ],
  time: 30,
};

const dbInstance = RecipeDatabase.getInstance();

describe('useRecipePreparation', () => {
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    loggerWarnSpy = jest.spyOn(logger.recipeLogger, 'warn').mockImplementation(() => {});
    await dbInstance.init();
    await dbInstance.addMultipleIngredients(testIngredients);
    await dbInstance.addMultipleTags(testTags);
  });

  afterEach(async () => {
    loggerWarnSpy.mockRestore();
    await dbInstance.reset();
  });

  describe('editPreparationTitle', () => {
    test('updates title at valid index', async () => {
      const wrapper = createPreparationWrapper(createMockRecipeProp('edit', recipeWithPreparation));

      const { result } = renderHook(
        () => ({
          preparation: useRecipePreparation(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipePreparation).toHaveLength(3);
      });

      act(() => {
        result.current.preparation.editPreparationTitle(1, 'Updated Step 2');
      });

      expect(result.current.form.state.recipePreparation[1].title).toBe('Updated Step 2');
      expect(result.current.form.state.recipePreparation[1].description).toBe(
        'Second step description'
      );
    });

    test('updates first step title', async () => {
      const wrapper = createPreparationWrapper(createMockRecipeProp('edit', recipeWithPreparation));

      const { result } = renderHook(
        () => ({
          preparation: useRecipePreparation(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipePreparation).toHaveLength(3);
      });

      act(() => {
        result.current.preparation.editPreparationTitle(0, 'New First Step');
      });

      expect(result.current.form.state.recipePreparation[0].title).toBe('New First Step');
    });

    test('logs warning for negative index', async () => {
      const wrapper = createPreparationWrapper(createMockRecipeProp('edit', recipeWithPreparation));

      const { result } = renderHook(() => useRecipePreparation(), { wrapper });

      await waitFor(() => {
        expect(result.current.editPreparationTitle).toBeDefined();
      });

      act(() => {
        result.current.editPreparationTitle(-1, 'Invalid');
      });

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Cannot edit preparation step title - invalid index',
        expect.objectContaining({ stepIndex: -1 })
      );
    });

    test('logs warning for index beyond array length', async () => {
      const wrapper = createPreparationWrapper(createMockRecipeProp('edit', recipeWithPreparation));

      const { result } = renderHook(() => useRecipePreparation(), { wrapper });

      await waitFor(() => {
        expect(result.current.editPreparationTitle).toBeDefined();
      });

      act(() => {
        result.current.editPreparationTitle(10, 'Invalid');
      });

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Cannot edit preparation step title - invalid index',
        expect.objectContaining({ stepIndex: 10 })
      );
    });
  });

  describe('editPreparationDescription', () => {
    test('updates description at valid index', async () => {
      const wrapper = createPreparationWrapper(createMockRecipeProp('edit', recipeWithPreparation));

      const { result } = renderHook(
        () => ({
          preparation: useRecipePreparation(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipePreparation).toHaveLength(3);
      });

      act(() => {
        result.current.preparation.editPreparationDescription(1, 'Updated description for step 2');
      });

      expect(result.current.form.state.recipePreparation[1].description).toBe(
        'Updated description for step 2'
      );
      expect(result.current.form.state.recipePreparation[1].title).toBe('Step 2');
    });

    test('updates last step description', async () => {
      const wrapper = createPreparationWrapper(createMockRecipeProp('edit', recipeWithPreparation));

      const { result } = renderHook(
        () => ({
          preparation: useRecipePreparation(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipePreparation).toHaveLength(3);
      });

      act(() => {
        result.current.preparation.editPreparationDescription(2, 'Final step updated');
      });

      expect(result.current.form.state.recipePreparation[2].description).toBe('Final step updated');
    });

    test('logs warning for negative index', async () => {
      const wrapper = createPreparationWrapper(createMockRecipeProp('edit', recipeWithPreparation));

      const { result } = renderHook(() => useRecipePreparation(), { wrapper });

      await waitFor(() => {
        expect(result.current.editPreparationDescription).toBeDefined();
      });

      act(() => {
        result.current.editPreparationDescription(-5, 'Invalid');
      });

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Cannot edit preparation step description - invalid index',
        expect.objectContaining({ stepIndex: -5 })
      );
    });

    test('logs warning for index beyond array length', async () => {
      const wrapper = createPreparationWrapper(createMockRecipeProp('edit', recipeWithPreparation));

      const { result } = renderHook(() => useRecipePreparation(), { wrapper });

      await waitFor(() => {
        expect(result.current.editPreparationDescription).toBeDefined();
      });

      act(() => {
        result.current.editPreparationDescription(100, 'Invalid');
      });

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Cannot edit preparation step description - invalid index',
        expect.objectContaining({ stepIndex: 100 })
      );
    });
  });

  describe('addNewPreparationStep', () => {
    test('adds empty preparation step', async () => {
      const wrapper = createPreparationWrapper(createMockRecipeProp('edit', recipeWithPreparation));

      const { result } = renderHook(
        () => ({
          preparation: useRecipePreparation(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipePreparation).toHaveLength(3);
      });

      act(() => {
        result.current.preparation.addNewPreparationStep();
      });

      expect(result.current.form.state.recipePreparation).toHaveLength(4);
      expect(result.current.form.state.recipePreparation[3]).toEqual({
        title: '',
        description: '',
      });
    });

    test('adds step to empty preparation array', async () => {
      const recipeWithNoPreparation: recipeTableElement = {
        ...recipeWithPreparation,
        preparation: [],
      };
      const wrapper = createPreparationWrapper(
        createMockRecipeProp('edit', recipeWithNoPreparation)
      );

      const { result } = renderHook(
        () => ({
          preparation: useRecipePreparation(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipePreparation).toHaveLength(0);
      });

      act(() => {
        result.current.preparation.addNewPreparationStep();
      });

      expect(result.current.form.state.recipePreparation).toHaveLength(1);
      expect(result.current.form.state.recipePreparation[0]).toEqual({
        title: '',
        description: '',
      });
    });

    test('can add multiple steps sequentially', async () => {
      const wrapper = createPreparationWrapper(createMockRecipeProp('addManually'));

      const { result } = renderHook(
        () => ({
          preparation: useRecipePreparation(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipePreparation).toEqual([]);
      });

      act(() => {
        result.current.preparation.addNewPreparationStep();
      });

      act(() => {
        result.current.preparation.addNewPreparationStep();
      });

      act(() => {
        result.current.preparation.addNewPreparationStep();
      });

      expect(result.current.form.state.recipePreparation).toHaveLength(3);
    });
  });
});
