import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useRecipeOCR } from '@hooks/useRecipeOCR';
import { RecipeFormProvider, useRecipeForm } from '@context/RecipeFormContext';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import { createMockRecipeProp } from '@test-helpers/recipeHookTestWrapper';
import {
  ingredientType,
  recipeColumnsNames,
  recipeTableElement,
} from '@customTypes/DatabaseElementTypes';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testTags } from '@data/tagsDataset';
import { testIngredients } from '@data/ingredientsDataset';

const mockExtractFieldFromImage = jest.fn();

jest.mock('expo-sqlite', () => require('@mocks/deps/expo-sqlite-mock').expoSqliteMock());
jest.mock('@utils/FileGestion', () =>
  require('@mocks/utils/FileGestion-mock.tsx').fileGestionMock()
);
jest.mock('@utils/settings', () => require('@mocks/utils/settings-mock').settingsMock());
jest.mock('@utils/firstLaunch', () => ({
  isFirstLaunch: jest.fn().mockResolvedValue(false),
}));
jest.mock('@utils/OCR', () => ({
  extractFieldFromImage: mockExtractFieldFromImage,
}));

function createOcrWrapper(props: RecipePropType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <RecipeDatabaseProvider>
        <RecipeFormProvider props={props}>
          <RecipeDialogsProvider>{children}</RecipeDialogsProvider>
        </RecipeFormProvider>
      </RecipeDatabaseProvider>
    );
  };
}

const recipeForOcr: recipeTableElement = {
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
  preparation: [{ title: 'Step 1', description: 'Mix' }],
  time: 30,
};

const dbInstance = RecipeDatabase.getInstance();

describe('useRecipeOCR', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockExtractFieldFromImage.mockClear();
    await dbInstance.init();
    await dbInstance.addMultipleIngredients(testIngredients);
    await dbInstance.addMultipleTags(testTags);
  });

  afterEach(async () => {
    await dbInstance.reset();
  });

  describe('modal state management', () => {
    test('openModalForField sets modalField', async () => {
      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => useRecipeOCR(), { wrapper });

      await waitFor(() => {
        expect(result.current.modalField).toBeUndefined();
      });

      act(() => {
        result.current.openModalForField(recipeColumnsNames.title);
      });

      expect(result.current.modalField).toBe(recipeColumnsNames.title);
    });

    test('closeModal resets modalField', async () => {
      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => useRecipeOCR(), { wrapper });

      act(() => {
        result.current.openModalForField(recipeColumnsNames.title);
      });

      expect(result.current.modalField).toBe(recipeColumnsNames.title);

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.modalField).toBeUndefined();
    });

    test('can switch between different fields', async () => {
      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => useRecipeOCR(), { wrapper });

      act(() => {
        result.current.openModalForField(recipeColumnsNames.title);
      });

      expect(result.current.modalField).toBe(recipeColumnsNames.title);

      act(() => {
        result.current.openModalForField(recipeColumnsNames.description);
      });

      expect(result.current.modalField).toBe(recipeColumnsNames.description);
    });
  });

  describe('addImageUri', () => {
    test('adds image to OCR images list', async () => {
      const wrapper = createOcrWrapper(
        createMockRecipeProp('addFromPic', undefined, 'initial.jpg')
      );

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.imgForOCR).toContain('initial.jpg');
      });

      act(() => {
        result.current.ocr.addImageUri('new-image.jpg');
      });

      expect(result.current.form.state.imgForOCR).toHaveLength(2);
      expect(result.current.form.state.imgForOCR).toContain('new-image.jpg');
    });

    test('can add multiple images', async () => {
      const wrapper = createOcrWrapper(
        createMockRecipeProp('addFromPic', undefined, 'initial.jpg')
      );

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.imgForOCR).toHaveLength(1);
      });

      act(() => {
        result.current.ocr.addImageUri('image2.jpg');
      });

      act(() => {
        result.current.ocr.addImageUri('image3.jpg');
      });

      expect(result.current.form.state.imgForOCR).toHaveLength(3);
    });
  });

  describe('fillOneField', () => {
    test('isProcessingOcrExtraction is false after extraction completes', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeTitle: 'Extracted Title' });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => useRecipeOCR(), { wrapper });

      expect(result.current.isProcessingOcrExtraction).toBe(false);

      await act(async () => {
        await result.current.fillOneField('image.jpg', recipeColumnsNames.title);
      });

      expect(result.current.isProcessingOcrExtraction).toBe(false);
    });

    test('fills title field', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeTitle: 'Extracted Title' });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.title);
      });

      expect(result.current.form.state.recipeTitle).toBe('Extracted Title');
    });

    test('fills description field', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        recipeDescription: 'Extracted Description',
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.description);
      });

      expect(result.current.form.state.recipeDescription).toBe('Extracted Description');
    });

    test('fills image field', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeImage: 'extracted-image.jpg' });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.image);
      });

      expect(result.current.form.state.recipeImage).toBe('extracted-image.jpg');
    });

    test('fills persons field', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipePersons: 6 });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.persons);
      });

      await waitFor(() => {
        expect(result.current.form.state.recipePersons).toBe(6);
      });
    });

    test('fills time field', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeTime: 45 });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.time);
      });

      expect(result.current.form.state.recipeTime).toBe(45);
    });

    test('fills preparation field', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        recipePreparation: [
          { title: 'Step 1', description: 'First step' },
          { title: 'Step 2', description: 'Second step' },
        ],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.preparation);
      });

      expect(result.current.form.state.recipePreparation).toHaveLength(2);
      expect(result.current.form.state.recipePreparation[0].title).toBe('Step 1');
    });

    test('fills nutrition field with defaults for missing values', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        recipeNutrition: {
          energyKcal: 200,
          protein: 10,
        },
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.nutrition);
      });

      expect(result.current.form.state.recipeNutrition).toBeDefined();
      expect(result.current.form.state.recipeNutrition?.energyKcal).toBe(200);
      expect(result.current.form.state.recipeNutrition?.protein).toBe(10);
    });

    test('adds tags with exact match directly', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        recipeTags: [{ name: 'Italian' }],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.tags);
      });

      await waitFor(() => {
        expect(result.current.form.state.recipeTags.length).toBeGreaterThan(0);
      });

      expect(result.current.form.state.recipeTags.some(t => t.name === 'Italian')).toBe(true);
    });

    test('triggers validation queue for fuzzy tag matches', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        recipeTags: [{ name: 'Itallian' }],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
          dialogs: useRecipeDialogs(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.tags);
      });

      await waitFor(() => {
        expect(result.current.dialogs.validationQueue).not.toBeNull();
        expect(result.current.dialogs.validationQueue?.type).toBe('Tag');
      });
    });

    test('adds ingredients with exact match directly', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        recipeIngredients: [{ name: 'Spaghetti', quantity: '200', unit: 'g', season: [] }],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.ingredients);
      });

      await waitFor(() => {
        expect(result.current.form.state.recipeIngredients.length).toBeGreaterThan(0);
      });

      expect(result.current.form.state.recipeIngredients.some(i => i.name === 'Spaghetti')).toBe(
        true
      );
    });

    test('triggers validation queue for fuzzy ingredient matches', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        recipeIngredients: [{ name: 'Spaghettis', quantity: '200', unit: 'g', season: [] }],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
          dialogs: useRecipeDialogs(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.ingredients);
      });

      await waitFor(() => {
        expect(result.current.dialogs.validationQueue).not.toBeNull();
        expect(result.current.dialogs.validationQueue?.type).toBe('Ingredient');
      });
    });

    test('calls extractFieldFromImage with correct parameters', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeTitle: 'Test' });

      const wrapper = createOcrWrapper(createMockRecipeProp('edit', recipeForOcr));

      const { result } = renderHook(() => useRecipeOCR(), { wrapper });

      await act(async () => {
        await result.current.fillOneField('test-image.jpg', recipeColumnsNames.title);
      });

      expect(mockExtractFieldFromImage).toHaveBeenCalledWith(
        'test-image.jpg',
        recipeColumnsNames.title,
        expect.objectContaining({
          recipePreparation: expect.any(Array),
          recipePersons: expect.any(Number),
          recipeIngredients: expect.any(Array),
          recipeTags: expect.any(Array),
        }),
        expect.any(Function)
      );
    });

    test('filters duplicate tags during OCR extraction', async () => {
      const recipeWithExistingTags: recipeTableElement = {
        ...recipeForOcr,
        tags: [{ id: 1, name: 'Italian' }],
      };

      mockExtractFieldFromImage.mockResolvedValue({
        recipeTags: [{ name: 'Italian' }, { name: 'Dinner' }],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('edit', recipeWithExistingTags));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(1);
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.tags);
      });

      await waitFor(() => {
        const italianCount = result.current.form.state.recipeTags.filter(
          t => t.name.toLowerCase() === 'italian'
        ).length;
        expect(italianCount).toBe(1);
      });
    });

    test('merges ingredient quantities when same unit exists', async () => {
      const recipeWithExistingIngredient: recipeTableElement = {
        ...recipeForOcr,
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
      };

      mockExtractFieldFromImage.mockResolvedValue({
        recipeIngredients: [{ name: 'Flour', quantity: '100', unit: 'g', season: [] }],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('edit', recipeWithExistingIngredient));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeIngredients).toHaveLength(1);
        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('200');
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.ingredients);
      });

      await waitFor(() => {
        expect(result.current.form.state.recipeIngredients).toHaveLength(1);
        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('300');
      });
    });

    test('replaces ingredient when different unit exists', async () => {
      const recipeWithExistingIngredient: recipeTableElement = {
        ...recipeForOcr,
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
      };

      mockExtractFieldFromImage.mockResolvedValue({
        recipeIngredients: [{ name: 'Flour', quantity: '0.5', unit: 'kg', season: [] }],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('edit', recipeWithExistingIngredient));

      const { result } = renderHook(
        () => ({
          ocr: useRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeIngredients).toHaveLength(1);
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.ingredients);
      });

      await waitFor(() => {
        expect(result.current.form.state.recipeIngredients).toHaveLength(1);
        expect(result.current.form.state.recipeIngredients[0].unit).toBe('kg');
        expect(result.current.form.state.recipeIngredients[0].quantity).toBe('0.5');
      });
    });

    test('passes warning callback to extractFieldFromImage', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeTitle: 'Test' });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => useRecipeOCR(), { wrapper });

      await act(async () => {
        await result.current.fillOneField('image.jpg', recipeColumnsNames.title);
      });

      const warningCallback = mockExtractFieldFromImage.mock.calls[0][3];
      expect(typeof warningCallback).toBe('function');
    });
  });
});
