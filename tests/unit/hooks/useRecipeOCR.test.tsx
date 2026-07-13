import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { UseFormReturn } from 'react-hook-form';
import { useRecipeOCR } from '@hooks/useRecipeOCR';
import { RecipeFormProvider, useRecipeForm } from '@test-helpers/recipeFormTestProvider';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';
import { createMockRecipeProp } from '@test-helpers/recipeHookTestWrapper';
import {
  FormIngredientElement,
  ingredientTableElement,
  ingredientType,
  recipeColumnsNames,
  recipeTableElement,
} from '@customTypes/DatabaseElementTypes';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import { testTags } from '@data/tagsDataset';
import { testIngredients } from '@data/ingredientsDataset';
import { IngredientValidationProps, TagValidationProps } from '@components/dialogs/ValidationQueue';
import { ApplyIngredientEditPatch } from '@hooks/useRecipeIngredients';
import { RecipeFormInput } from '@schemas/recipeFormSchema';
import {
  IngredientArrayActionsProvider,
  useIngredientArrayActionsRegister,
} from '@screens/recipe/fields/IngredientArrayActionsContext';

import {
  mockFindSimilarIngredients,
  mockAddIngredient,
  setMockIngredients,
} from '@mocks/hooks/useIngredients-mock';
import { mockFindSimilarTags, mockAddTag, setMockTags } from '@mocks/hooks/useTags-mock';

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

const mockExtractFieldFromImage = jest.fn();

jest.mock('@utils/OCR', () => ({
  extractFieldFromImage: (...args: unknown[]) => mockExtractFieldFromImage(...args),
}));

jest.mock('@hooks/useIngredients', () => ({
  useIngredients: require('@mocks/hooks/useIngredients-mock').useIngredientsMock,
}));

jest.mock('@hooks/useTags', () => ({
  useTags: require('@mocks/hooks/useTags-mock').useTagsMock,
}));

function createOcrWrapper(props: RecipePropType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
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

function useTestRecipeOCR() {
  return useRecipeOCR();
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

describe('useRecipeOCR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMockIngredients(testIngredients);
    setMockTags(testTags);
    mockExtractFieldFromImage.mockClear();
    mockFindSimilarIngredients.mockImplementation((name: string) => {
      const exactMatch = testIngredients.find(i => i.name.toLowerCase() === name.toLowerCase());
      if (exactMatch) return [exactMatch];
      return [];
    });
    mockFindSimilarTags.mockImplementation((name: string) => {
      const exactMatch = testTags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (exactMatch) return [exactMatch];
      return [];
    });
    mockAddIngredient.mockImplementation(async ing => ({ ...(ing as object), id: 100 }));
    mockAddTag.mockImplementation(async tag => ({ ...(tag as object), id: 100 }));
  });

  describe('fillOneField', () => {
    test('isProcessingOcrExtraction is false after extraction completes', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeTitle: 'Extracted Title' });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => useTestRecipeOCR(), { wrapper });

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
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.title);
      });

      expect(result.current.form.form.getValues('recipeTitle')).toBe('Extracted Title');
    });

    test('fills description field', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        recipeDescription: 'Extracted Description',
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.description);
      });

      expect(result.current.form.form.getValues('recipeDescription')).toBe('Extracted Description');
    });

    test('fills image field', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeImage: 'extracted-image.jpg' });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.image);
      });

      expect(result.current.form.form.getValues('recipeImage')).toBe('extracted-image.jpg');
    });

    test('fills persons field', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipePersons: 6 });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.persons);
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipePersons')).toBe(6);
      });
    });

    test('fills time field', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeTime: 45 });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.time);
      });

      expect(result.current.form.form.getValues('recipeTime')).toBe(45);
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
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.preparation);
      });

      expect(result.current.form.form.getValues('recipePreparation')).toHaveLength(2);
      expect(result.current.form.form.getValues('recipePreparation')[0]!.title).toBe('Step 1');
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
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.nutrition);
      });

      expect(result.current.form.form.getValues('recipeNutrition')).toBeDefined();
      expect(result.current.form.form.getValues('recipeNutrition')?.energyKcal).toBe(200);
      expect(result.current.form.form.getValues('recipeNutrition')?.protein).toBe(10);
    });

    test('adds tag directly when exact match found in database', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        recipeTags: [{ name: 'Italian' }],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
          dialogs: useRecipeDialogs(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.tags);
      });

      await waitFor(() => {
        expect(result.current.dialogs.validationQueue).toBeNull();
        expect(
          result.current.form.form.getValues('recipeTags')!.some(tag => tag.name === 'Italian')
        ).toBe(true);
      });
    });

    test('triggers validation queue for fuzzy tag matches', async () => {
      mockFindSimilarTags.mockImplementation((name: string) => {
        if (name.toLowerCase() === 'itallian') {
          return [{ id: 1, name: 'Italian' }];
        }
        return [];
      });

      mockExtractFieldFromImage.mockResolvedValue({
        recipeTags: [{ name: 'Itallian' }],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useTestRecipeOCR(),
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

    test('calls extractFieldFromImage with correct parameters', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeTitle: 'Test' });

      const wrapper = createOcrWrapper(createMockRecipeProp('edit', recipeForOcr));

      const { result } = renderHook(() => useTestRecipeOCR(), { wrapper });

      await act(async () => {
        await result.current.fillOneField('test-image.jpg', recipeColumnsNames.title);
      });

      expect(mockExtractFieldFromImage).toHaveBeenCalledWith(
        'test-image.jpg',
        recipeColumnsNames.title,
        expect.objectContaining({
          recipePreparation: expect.any(Array),
          recipePersons: expect.any(Number),
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
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeTags')!).toHaveLength(1);
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.tags);
      });

      await waitFor(() => {
        const italianCount = result.current.form.form
          .getValues('recipeTags')!
          .filter(t => t.name.toLowerCase() === 'italian').length;
        expect(italianCount).toBe(1);
      });
    });

    test('passes warning callback to extractFieldFromImage', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeTitle: 'Test' });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => useTestRecipeOCR(), { wrapper });

      await act(async () => {
        await result.current.fillOneField('image.jpg', recipeColumnsNames.title);
      });

      const warningCallback = mockExtractFieldFromImage.mock.calls[0][3];
      expect(typeof warningCallback).toBe('function');
    });

    test('ingredientNames exact match fills recipeIngredients', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        ingredientNames: [{ name: 'Flour', unit: 'g' }],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', 'ingredientNames');
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeIngredients').length).toBeGreaterThan(0);
      });

      expect(
        result.current.form.form.getValues('recipeIngredients').some(i => i.name === 'Flour')
      ).toBe(true);
    });

    test('ingredientNames fuzzy match goes to validation queue', async () => {
      mockFindSimilarIngredients.mockImplementation((name: string) => {
        if (name.toLowerCase() === 'suggar') {
          return [{ id: 99, name: 'Sugar', unit: '', type: ingredientType.cereal, season: [] }];
        }
        return [];
      });

      mockExtractFieldFromImage.mockResolvedValue({
        ingredientNames: [{ name: 'Suggar', unit: 'g' }],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useTestRecipeOCR(),
          dialogs: useRecipeDialogs(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', 'ingredientNames');
      });

      await waitFor(() => {
        expect(result.current.dialogs.validationQueue).not.toBeNull();
        expect(result.current.dialogs.validationQueue?.type).toBe('Ingredient');
      });
    });

    test('ingredientNames preserves OCR order even when later items have similar suggestions', async () => {
      mockFindSimilarIngredients.mockImplementation((name: string) => {
        if (name.toLowerCase() === 'cébette') {
          return [{ id: 99, name: 'Onion', unit: 'g', type: ingredientType.vegetable, season: [] }];
        }
        return [];
      });

      mockExtractFieldFromImage.mockResolvedValue({
        ingredientNames: [
          { name: 'carotte', unit: 'g' },
          { name: 'cébette', unit: 'g' },
          { name: 'citronnelle', unit: 'g' },
        ],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', 'ingredientNames');
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(3);
      });

      const names = result.current.form.form.getValues('recipeIngredients')!.map(i => i.name);
      expect(names).toEqual(['carotte', 'cébette', 'citronnelle']);
    });

    test('form order survives bucketed queue resolution', async () => {
      mockFindSimilarIngredients.mockImplementation((name: string) => {
        if (name.toLowerCase() === 'cébette') {
          return [{ id: 99, name: 'Onion', unit: 'g', type: ingredientType.vegetable, season: [] }];
        }
        return [];
      });

      mockExtractFieldFromImage.mockResolvedValue({
        ingredientNames: [
          { name: 'carotte', unit: 'g' },
          { name: 'cébette', unit: 'g' },
          { name: 'citronnelle', unit: 'g' },
        ],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
          dialogs: useRecipeDialogs(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', 'ingredientNames');
      });

      const queue = result.current.dialogs.validationQueue;
      expect(queue?.type).toBe('Ingredient');
      const queuedItems = (queue as IngredientValidationProps).items;
      expect(queuedItems.map(i => i.name)).toEqual(['carotte', 'citronnelle', 'cébette']);

      act(() => {
        for (const item of queuedItems) {
          (queue as IngredientValidationProps).onValidated(item, {
            id: 200 + queuedItems.indexOf(item),
            name: item.name!,
            unit: 'g',
            type: ingredientType.vegetable,
            season: [],
            quantity: '',
          });
        }
      });

      const names = result.current.form.form.getValues('recipeIngredients')!.map(i => i.name);
      expect(names).toEqual(['carotte', 'cébette', 'citronnelle']);
    });

    test('recipeIngredients (full data) preserves OCR order when items have similar suggestions', async () => {
      mockFindSimilarIngredients.mockImplementation((name: string) => {
        if (name.toLowerCase() === 'lait de coco') {
          return [
            { id: 99, name: 'Cocoa Powder', unit: 'g', type: ingredientType.baking, season: [] },
          ];
        }
        return [];
      });

      mockExtractFieldFromImage.mockResolvedValue({
        recipeIngredients: [
          { name: 'carotte', unit: 'g', quantity: '2', type: ingredientType.vegetable, season: [] },
          {
            name: 'lait de coco',
            unit: 'mL',
            quantity: '400',
            type: ingredientType.baking,
            season: [],
          },
          {
            name: 'riz basmati',
            unit: 'g',
            quantity: '300',
            type: ingredientType.cereal,
            season: [],
          },
        ],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.ingredients);
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(3);
      });

      const names = result.current.form.form.getValues('recipeIngredients')!.map(i => i.name);
      expect(names).toEqual(['carotte', 'lait de coco', 'riz basmati']);
    });

    test('recipeIngredients (full data) does not double-count quantities for exact matches', async () => {
      const flourMatch = testIngredients.find(i => i.name.toLowerCase() === 'flour');
      mockFindSimilarIngredients.mockImplementation((name: string) =>
        name.toLowerCase() === 'flour' && flourMatch ? [flourMatch] : []
      );

      mockExtractFieldFromImage.mockResolvedValue({
        recipeIngredients: [
          { name: 'Flour', unit: 'g', quantity: '200', type: ingredientType.cereal, season: [] },
        ],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.ingredients);
      });

      const ingredients = result.current.form.form.getValues('recipeIngredients')!;
      const flour = ingredients.find(i => i.name?.toLowerCase() === 'flour');
      expect(flour?.quantity).toBe('200');
    });

    test('prepopulate skips OCR items whose name is empty or undefined', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        ingredientNames: [
          { name: '', unit: 'g' },
          { name: undefined as unknown as string, unit: 'g' },
          { name: 'Cinnamon', unit: 'g' },
        ],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', 'ingredientNames');
      });

      const names = result.current.form.form.getValues('recipeIngredients')!.map(i => i.name);
      expect(names).toEqual(['Cinnamon']);
    });

    test('prepopulate skips items whose name already exists in the form', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        ingredientNames: [
          { name: 'Flour', unit: 'g' },
          { name: 'carotte', unit: 'g' },
        ],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('edit', recipeForOcr));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', 'ingredientNames');
      });

      const names = result.current.form.form.getValues('recipeIngredients')!.map(i => i.name);
      expect(names.filter(n => n === 'Flour')).toHaveLength(1);
      expect(names).toContain('carotte');
    });

    test('ingredientNames empty result does not change recipeIngredients', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ ingredientNames: [] });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(
        () => ({
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', 'ingredientNames');
      });

      expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(0);
    });

    test('ingredientQuantities applied positionally when count matches', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ ingredientQuantities: ['350'] });

      const wrapper = createOcrWrapper(createMockRecipeProp('edit', recipeForOcr));

      const { result } = renderHook(
        () => ({
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', 'ingredientQuantities');
      });

      expect(result.current.form.form.getValues('recipeIngredients')[0]!.quantity).toBe('350');
    });

    test('ingredientQuantities count mismatch still pairs by position up to min(len)', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ ingredientQuantities: ['100', '200'] });

      const wrapper = createOcrWrapper(createMockRecipeProp('edit', recipeForOcr));

      const { result } = renderHook(
        () => ({
          ocr: useTestRecipeOCR(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeIngredients')).toHaveLength(1);
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', 'ingredientQuantities');
      });

      expect(result.current.form.form.getValues('recipeIngredients')[0]!.quantity).toBe('100');
    });

    test('ingredientNames OCR processes each name exactly once (no duplicate runs)', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        ingredientNames: [
          { name: 'BrandNewIngredient', unit: 'g' },
          { name: 'AnotherUnknown', unit: 'mL' },
        ],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => useTestRecipeOCR(), { wrapper });

      await act(async () => {
        await result.current.fillOneField('image.jpg', 'ingredientNames');
      });

      const calledNames = mockFindSimilarIngredients.mock.calls.map(call => call[0]);
      expect(calledNames.filter(n => n === 'BrandNewIngredient')).toHaveLength(1);
      expect(calledNames.filter(n => n === 'AnotherUnknown')).toHaveLength(1);
    });

    test('combined ingredientNames + ingredientQuantities applies quantities to freshly-populated names', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        ingredientNames: [
          { name: 'AlphaUnknown', unit: 'g' },
          { name: 'BetaUnknown', unit: 'g' },
        ],
        ingredientQuantities: ['100', '250'],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', 'ingredientNames');
      });

      const ings = result.current.form.form.getValues('recipeIngredients');
      expect(ings).toHaveLength(2);
      expect(ings.map(i => i.quantity)).toEqual(['100', '250']);
    });

    test('clears isProcessingOcrExtraction when extractFieldFromImage throws', async () => {
      mockExtractFieldFromImage.mockRejectedValueOnce(new Error('OCR failure'));

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => useTestRecipeOCR(), { wrapper });

      await act(async () => {
        await expect(
          result.current.fillOneField('image.jpg', recipeColumnsNames.title)
        ).rejects.toThrow('OCR failure');
      });

      expect(result.current.isProcessingOcrExtraction).toBe(false);
    });

    test('does not overwrite recipePersons when OCR returns 0', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipePersons: 0 });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      await act(async () => {
        result.current.form.form.setValue('recipePersons', 4);
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.persons);
      });

      expect(result.current.form.form.getValues('recipePersons')).toBe(4);
    });

    test('does not trigger full-form validation after fillOneField writes', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeTitle: 'Extracted' });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      const triggerSpy = jest.spyOn(result.current.form.form, 'trigger');

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.title);
      });

      expect(triggerSpy).not.toHaveBeenCalled();
      triggerSpy.mockRestore();
    });

    test('does not overwrite recipeTime when OCR returns 0', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeTime: 0 });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      await act(async () => {
        result.current.form.form.setValue('recipeTime', 30);
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.time);
      });

      expect(result.current.form.form.getValues('recipeTime')).toBe(30);
    });

    test('writes recipePersons when OCR returns a positive number', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipePersons: 6 });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.persons);
      });

      expect(result.current.form.form.getValues('recipePersons')).toBe(6);
    });

    test('does not mark any field touched after fillOneField writes', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ recipeTitle: 'Extracted Title' });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.title);
      });

      const touched = (
        result.current.form.form.control as unknown as {
          _formState: { touchedFields: Record<string, unknown> };
        }
      )._formState.touchedFields;
      expect(touched.recipeTitle).toBeFalsy();
      expect(touched.recipeIngredients).toBeFalsy();
      expect(touched.recipePreparation).toBeFalsy();
      expect(touched.recipePersons).toBeFalsy();
      expect(touched.recipeTime).toBeFalsy();
      expect(touched.recipeDescription).toBeFalsy();
    });

    test('ingredient-names-only OCR does not mark recipeIngredients touched', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        ingredientNames: [{ name: 'Flour', unit: '' }],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', 'ingredientNames');
      });

      const touched = (
        result.current.form.form.control as unknown as {
          _formState: { touchedFields: Record<string, unknown> };
        }
      )._formState.touchedFields;
      expect(touched.recipeIngredients).toBeFalsy();
    });

    test('ingredientQuantities OCR does not mark recipeIngredients touched', async () => {
      mockExtractFieldFromImage.mockResolvedValue({ ingredientQuantities: ['200'] });

      const wrapper = createOcrWrapper(createMockRecipeProp('edit', recipeForOcr));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', 'ingredientQuantities');
      });

      const touched = (
        result.current.form.form.control as unknown as {
          _formState: { touchedFields: Record<string, unknown> };
        }
      )._formState.touchedFields;
      expect(touched.recipeIngredients).toBeFalsy();
    });

    test('full-ingredients OCR does not mark recipeIngredients touched', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        recipeIngredients: [{ name: 'Flour', unit: 'g', quantity: '200' }],
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.ingredients);
      });

      const touched = (
        result.current.form.form.control as unknown as {
          _formState: { touchedFields: Record<string, unknown> };
        }
      )._formState.touchedFields;
      expect(touched.recipeIngredients).toBeFalsy();
    });

    test('does not mark any field dirty after fillOneField writes', async () => {
      mockExtractFieldFromImage.mockResolvedValue({
        recipeTitle: 'Extracted Title',
        recipeDescription: 'Extracted Description',
        recipePersons: 6,
        recipeTime: 45,
      });

      const wrapper = createOcrWrapper(createMockRecipeProp('addFromPic', undefined, 'test.jpg'));

      const { result } = renderHook(() => ({ ocr: useTestRecipeOCR(), form: useRecipeForm() }), {
        wrapper,
      });

      await act(async () => {
        await result.current.ocr.fillOneField('image.jpg', recipeColumnsNames.title);
      });

      const dirty = (
        result.current.form.form.control as unknown as {
          _formState: { dirtyFields: Record<string, unknown>; isDirty: boolean };
        }
      )._formState;
      expect(dirty.dirtyFields.recipeTitle).toBeFalsy();
      expect(dirty.dirtyFields.recipeDescription).toBeFalsy();
      expect(dirty.dirtyFields.recipePersons).toBeFalsy();
      expect(dirty.dirtyFields.recipeTime).toBeFalsy();
      expect(dirty.isDirty).toBe(false);
    });

    test.each([
      ['1à3', '1'],
      ['0,5', '0.5'],
      ['100kcal', '100'],
      ['200 g égoutté', '200'],
      ['  42  ', '42'],
    ])(
      'normalizes raw OCR quantity %p to %p via parseQuantity before storing',
      async (raw, expected) => {
        mockExtractFieldFromImage.mockResolvedValue({ ingredientQuantities: [raw] });

        const wrapper = createOcrWrapper(createMockRecipeProp('edit', recipeForOcr));

        const { result } = renderHook(
          () => ({
            ocr: useTestRecipeOCR(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
        });

        await act(async () => {
          await result.current.ocr.fillOneField('image.jpg', 'ingredientQuantities');
        });

        expect(result.current.form.form.getValues('recipeIngredients')![0]!.quantity).toBe(
          expected
        );
      }
    );

    test.each([['abc'], ['à3'], ['']])(
      'normalizes non-parseable OCR quantity %p to empty string',
      async raw => {
        mockExtractFieldFromImage.mockResolvedValue({ ingredientQuantities: [raw] });

        const wrapper = createOcrWrapper(createMockRecipeProp('edit', recipeForOcr));

        const { result } = renderHook(
          () => ({
            ocr: useTestRecipeOCR(),
            form: useRecipeForm(),
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.form.form.getValues('recipeIngredients')!).toHaveLength(1);
        });

        await act(async () => {
          await result.current.ocr.fillOneField('image.jpg', 'ingredientQuantities');
        });

        expect(result.current.form.form.getValues('recipeIngredients')![0]!.quantity).toBe('');
      }
    );
  });
});
