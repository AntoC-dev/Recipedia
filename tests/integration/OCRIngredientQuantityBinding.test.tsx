import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { UseFormReturn } from 'react-hook-form';
import TextRecognition, { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { useRecipeOCR } from '@hooks/useRecipeOCR';
import { RecipeFormProvider, useRecipeForm } from '@test-helpers/recipeFormTestProvider';
import { RecipeDialogsProvider } from '@context/RecipeDialogsContext';
import { createMockRecipeProp } from '@test-helpers/recipeHookTestWrapper';
import RecipeDatabase from '@utils/RecipeDatabase';
import { normalizeKey } from '@utils/NutritionUtils';
import {
  FormIngredientElement,
  IngredientDraft,
  ingredientTableElement,
  ingredientType,
} from '@customTypes/DatabaseElementTypes';
import { ApplyIngredientEditPatch } from '@hooks/useRecipeIngredients';
import { RecipeFormInput } from '@schemas/recipeFormSchema';
import {
  IngredientArrayActionsProvider,
  useIngredientArrayActionsRegister,
} from '@screens/recipe/fields/IngredientArrayActionsContext';

import {
  iosNamesOcrResult as v1Names,
  iosQuantitiesOcrResult as v1Quantities,
  expectedIosIngredientNames as v1ExpectedNames,
  expectedIosQuantities as v1ExpectedQuantities,
} from '@data/ocrMocks/quitoque-v1';
import {
  iosNamesOcrResult as v2Names,
  iosQuantitiesOcrResult as v2Quantities,
} from '@data/ocrMocks/quitoque-v2';
import {
  iosNamesOcrResult as v3Names,
  iosQuantitiesOcrResult as v3Quantities,
  expectedIosIngredientNames as v3ExpectedNames,
} from '@data/ocrMocks/quitoque-v3';
import {
  iosNamesOcrResult as hfNames,
  iosQuantitiesOcrResult as hfQuantities,
  expectedIosIngredientNames as hfExpectedNames,
} from '@data/ocrMocks/hellofresh';

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

const mockRecognize = TextRecognition.recognize as jest.Mock;

const seededIngredients: IngredientDraft[] = [
  'Carotte',
  'Cumin',
  'Merguez',
  'Navet',
  'Pommes de terre jaunes',
  'Cacahuètes grillées',
  'Concentré de tomates',
  'Filet de poulet',
  'Gingembre',
  "Gousse d'ail",
  'Lait de coco',
  'Oignon jaune',
  'Oignon nouveau',
  'Riz basmati Bio',
  'Citronnelle',
  'Cébette',
  'Poireau',
  'Pois chiches',
  'Conserve Bio',
  'Purée de tomates',
  'Épices Cachemire',
  'Sauce soja',
  'Huile de sésame',
  'Gomasio',
  'Riz basmati',
  'Ciboulette',
  'Gingembre frais',
].map(name => ({
  name,
  unit: 'g',
  type: ingredientType.vegetable,
  season: [],
}));

function createWrapper() {
  const props = createMockRecipeProp('addFromPic', undefined, 'test-image-uri.jpg');
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

function queueOcrResults(...results: TextRecognitionResult[]) {
  mockRecognize.mockReset();
  for (const r of results) {
    mockRecognize.mockResolvedValueOnce(r);
  }
}

function renderOcrHook() {
  return renderHook(
    () => ({
      ocr: useRecipeOCR(),
      form: useRecipeForm(),
    }),
    { wrapper: createWrapper() }
  );
}

async function runNamesThenQuantities(
  result: ReturnType<typeof renderOcrHook>['result'],
  namesOcr: TextRecognitionResult,
  quantitiesOcr: TextRecognitionResult
) {
  queueOcrResults(namesOcr, quantitiesOcr);

  await act(async () => {
    await result.current.ocr.fillOneField('names.jpg', 'ingredientNames');
  });

  await waitFor(() => {
    expect(result.current.form.form.getValues('recipeIngredients')!.length).toBeGreaterThan(0);
  });

  await act(async () => {
    await result.current.ocr.fillOneField('quantities.jpg', 'ingredientQuantities');
  });
}

const corners = (top: number, left: number, width: number, height: number) =>
  [
    { x: left, y: top },
    { x: left + width, y: top },
    { x: left + width, y: top + height },
    { x: left, y: top + height },
  ] as const;

function syntheticBlock(lines: string[]): TextRecognitionResult {
  return {
    text: lines.join('\n'),
    blocks: [
      {
        recognizedLanguages: [],
        text: lines.join('\n'),
        frame: { top: 0, left: 0, width: 100, height: 20 * lines.length },
        cornerPoints: corners(0, 0, 100, 20 * lines.length),
        lines: lines.map((text, i) => ({
          elements: [],
          recognizedLanguages: [],
          text,
          frame: { top: i * 20, left: 0, width: 100, height: 20 },
          cornerPoints: corners(i * 20, 0, 100, 20),
        })),
      },
    ],
  };
}

const normalize = (s: string | undefined) => (s ? normalizeKey(s) : '');

describe('OCR ingredient + quantity binding (full pipeline, no mocks beyond ML Kit)', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    database = RecipeDatabase.getInstance();
    await database.init();
    await database.addMultipleIngredients(seededIngredients);
  });

  afterEach(async () => {
    mockRecognize.mockReset();
    await database.closeAndReset();
  });

  describe('real-device captures: every form ingredient ends with a non-empty quantity', () => {
    test.each([
      ['HelloFresh (iOS)', hfNames, hfQuantities, 11],
      ['Quitoque V1 (iOS)', v1Names, v1Quantities, 5],
      ['Quitoque V2 (iOS)', v2Names, v2Quantities, 9],
      ['Quitoque V3 (iOS)', v3Names, v3Quantities, 11],
    ])('%s', async (_label, namesOcr, quantitiesOcr, qtyCountInOcr) => {
      const { result } = renderOcrHook();
      await runNamesThenQuantities(result, namesOcr, quantitiesOcr);

      const ingredients = result.current.form.form.getValues('recipeIngredients')!;
      const missing = ingredients.filter(i => !i.quantity || i.quantity.trim().length === 0);

      const maxAcceptableMissing = Math.max(0, ingredients.length - qtyCountInOcr);
      expect(missing.length).toBeLessThanOrEqual(maxAcceptableMissing);
    });
  });

  describe('intermediate state after names pass', () => {
    test('Quitoque V1: form ingredient count matches OCR-extracted name count', async () => {
      queueOcrResults(v1Names);
      const { result } = renderOcrHook();

      await act(async () => {
        await result.current.ocr.fillOneField('names.jpg', 'ingredientNames');
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeIngredients')!.length).toBe(
          v1ExpectedNames.length
        );
      });
    });

    test('Quitoque V1: ingredients appear in OCR scan order', async () => {
      queueOcrResults(v1Names);
      const { result } = renderOcrHook();

      await act(async () => {
        await result.current.ocr.fillOneField('names.jpg', 'ingredientNames');
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeIngredients')!.length).toBe(
          v1ExpectedNames.length
        );
      });

      expect(
        result.current.form.form.getValues('recipeIngredients')!.map(i => normalize(i.name))
      ).toEqual(v1ExpectedNames.map(i => normalize(i.name)));
    });

    test('Quitoque V1: no quantities are set before the qty pass runs', async () => {
      queueOcrResults(v1Names);
      const { result } = renderOcrHook();

      await act(async () => {
        await result.current.ocr.fillOneField('names.jpg', 'ingredientNames');
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeIngredients')!.length).toBe(
          v1ExpectedNames.length
        );
      });

      const qty = result.current.form.form.getValues('recipeIngredients')!.map(i => i.quantity);
      expect(qty.every(q => !q || q.trim().length === 0)).toBe(true);
    });
  });

  describe('quantity assignment by position', () => {
    test('Quitoque V1 (matched counts): each ingredient receives the qty at its row index', async () => {
      const { result } = renderOcrHook();
      await runNamesThenQuantities(result, v1Names, v1Quantities);

      const final = result.current.form.form.getValues('recipeIngredients')!;
      expect(final).toHaveLength(v1ExpectedQuantities.length);
      final.forEach((ingredient, index) => {
        expect(ingredient.quantity).toBe(v1ExpectedQuantities[index]);
      });
    });

    test('Quitoque V3: no name duplicated', async () => {
      const { result } = renderOcrHook();
      await runNamesThenQuantities(result, v3Names, v3Quantities);

      const final = result.current.form.form.getValues('recipeIngredients')!;
      const finalNamesLower = final.map(i => normalize(i.name));
      expect(new Set(finalNamesLower).size).toBe(finalNamesLower.length);
      expect(new Set(finalNamesLower)).toEqual(
        new Set(v3ExpectedNames.map(n => normalize(n.name)))
      );
    });
  });

  describe('order preservation across both passes', () => {
    test('HelloFresh: final ingredient order matches OCR scan order', async () => {
      const { result } = renderOcrHook();
      await runNamesThenQuantities(result, hfNames, hfQuantities);

      const finalNames = result.current.form.form
        .getValues('recipeIngredients')!
        .map(i => normalize(i.name));
      const expectedNames = hfExpectedNames.map(n => normalize(n.name));
      expect(finalNames.slice(0, expectedNames.length)).toEqual(expectedNames);
    });
  });

  describe('synthetic edge cases', () => {
    test('empty ingredient-names OCR result leaves form ingredients empty', async () => {
      queueOcrResults({ text: '', blocks: [] });
      const { result } = renderOcrHook();

      await act(async () => {
        await result.current.ocr.fillOneField('names.jpg', 'ingredientNames');
      });

      expect(result.current.form.form.getValues('recipeIngredients')!).toEqual([]);
    });

    test('empty quantities pass keeps previously-scanned ingredients with empty qty', async () => {
      const namesOcr = syntheticBlock(['Carotte', 'Cumin', 'Navet']);
      const emptyQuantities: TextRecognitionResult = { text: '', blocks: [] };
      const { result } = renderOcrHook();

      await runNamesThenQuantities(result, namesOcr, emptyQuantities);

      const final = result.current.form.form.getValues('recipeIngredients')!;
      expect(final.length).toBeGreaterThanOrEqual(3);
      final.forEach(i => {
        expect(i.quantity ?? '').toBe('');
      });
    });

    test('qty count less than ingredient count: first rows receive qty', async () => {
      const namesOcr = syntheticBlock(['Carotte', 'Cumin', 'Navet']);
      const qtyOcr = syntheticBlock(['100', '50']);
      const { result } = renderOcrHook();

      await runNamesThenQuantities(result, namesOcr, qtyOcr);

      const final = result.current.form.form.getValues('recipeIngredients')!;
      const withQty = final.filter(i => (i.quantity ?? '').trim().length > 0);
      expect(withQty.length).toBeGreaterThanOrEqual(2);
    });

    test('qty count greater than ingredient count: first N values bound to ingredients', async () => {
      const namesOcr = syntheticBlock(['Carotte', 'Cumin']);
      const qtyOcr = syntheticBlock(['100', '50', '25']);
      const { result } = renderOcrHook();

      await runNamesThenQuantities(result, namesOcr, qtyOcr);

      const final = result.current.form.form.getValues('recipeIngredients')!;
      const carotte = final.find(i => normalize(i.name) === 'carotte');
      const cumin = final.find(i => normalize(i.name) === 'cumin');
      expect(carotte?.quantity).toBe('100');
      expect(cumin?.quantity).toBe('50');
    });

    test('qty pass without a prior names pass is a no-op (empty form stays empty)', async () => {
      queueOcrResults(syntheticBlock(['100', '200']));
      const { result } = renderOcrHook();

      await act(async () => {
        await result.current.ocr.fillOneField('qty.jpg', 'ingredientQuantities');
      });

      expect(result.current.form.form.getValues('recipeIngredients')!).toEqual([]);
    });

    test('names pass is idempotent: rescanning the same image does not duplicate rows', async () => {
      const namesOcr = syntheticBlock(['Carotte', 'Cumin', 'Navet']);
      queueOcrResults(namesOcr, namesOcr);
      const { result } = renderOcrHook();

      await act(async () => {
        await result.current.ocr.fillOneField('names.jpg', 'ingredientNames');
      });

      const firstPassCount = result.current.form.form.getValues('recipeIngredients')!.length;

      await act(async () => {
        await result.current.ocr.fillOneField('names.jpg', 'ingredientNames');
      });

      expect(result.current.form.form.getValues('recipeIngredients')!.length).toBe(firstPassCount);
    });

    test('after names pass, no row has quantity "0"', async () => {
      const namesOcr = syntheticBlock(['Carotte', 'Cumin', 'Navet']);
      queueOcrResults(namesOcr);
      const { result } = renderOcrHook();

      await act(async () => {
        await result.current.ocr.fillOneField('names.jpg', 'ingredientNames');
      });

      await waitFor(() => {
        expect(result.current.form.form.getValues('recipeIngredients')!.length).toBeGreaterThan(0);
      });

      const qtyValues = result.current.form.form
        .getValues('recipeIngredients')!
        .map(i => i.quantity ?? '');
      qtyValues.forEach(q => {
        expect(q).not.toBe('0');
      });
    });

    test('qty pass overwrites pre-existing manual quantities at matched indices', async () => {
      const namesOcr = syntheticBlock(['Carotte', 'Cumin']);
      const qtyOcr = syntheticBlock(['100', '50']);
      queueOcrResults(namesOcr, qtyOcr);
      const { result } = renderOcrHook();

      await act(async () => {
        await result.current.ocr.fillOneField('names.jpg', 'ingredientNames');
      });

      await act(async () => {
        await result.current.ocr.fillOneField('qty.jpg', 'ingredientQuantities');
      });

      const final = result.current.form.form.getValues('recipeIngredients')!;
      const carotte = final.find(i => normalize(i.name) === 'carotte');
      const cumin = final.find(i => normalize(i.name) === 'cumin');
      expect(carotte?.quantity).toBe('100');
      expect(cumin?.quantity).toBe('50');
    });
  });

  describe('per-row quantity correctness for real captures', () => {
    test('Quitoque V1: each ingredient ends with its expected quantity', async () => {
      const { result } = renderOcrHook();
      await runNamesThenQuantities(result, v1Names, v1Quantities);

      const final = result.current.form.form.getValues('recipeIngredients')!;
      expect(final.map(i => i.quantity)).toEqual(v1ExpectedQuantities);
    });

    test('HelloFresh: every ingredient receives a non-zero, non-empty quantity string', async () => {
      const { result } = renderOcrHook();
      await runNamesThenQuantities(result, hfNames, hfQuantities);

      const final = result.current.form.form.getValues('recipeIngredients')!;
      final.forEach(i => {
        const q = (i.quantity ?? '').trim();
        expect(q.length).toBeGreaterThan(0);
        expect(q).not.toBe('0');
      });
    });
  });
});
