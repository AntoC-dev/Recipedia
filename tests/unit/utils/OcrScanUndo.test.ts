import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import { defaultValueNumber } from '@utils/Constants';
import type { OcrModalTarget } from '@utils/OCR';
import {
  hasOcrUndoableValue,
  isOcrScanUndoable,
  OcrUndoableField,
  undoableFieldForTarget,
} from '@utils/OcrScanUndo';

describe('OcrScanUndo', () => {
  describe('undoableFieldForTarget', () => {
    test.each<[OcrModalTarget, OcrUndoableField]>([
      [recipeColumnsNames.image, 'recipeImage'],
      [recipeColumnsNames.title, 'recipeTitle'],
      [recipeColumnsNames.description, 'recipeDescription'],
      [recipeColumnsNames.persons, 'recipePersons'],
      [recipeColumnsNames.time, 'recipeTime'],
      [recipeColumnsNames.nutrition, 'recipeNutrition'],
      ['ingredientQuantities', 'recipeIngredients'],
    ])('maps %s to %s', (target, expectedField) => {
      expect(undoableFieldForTarget(target)).toBe(expectedField);
    });

    test.each<OcrModalTarget>([
      recipeColumnsNames.tags,
      recipeColumnsNames.preparation,
      recipeColumnsNames.ingredients,
      recipeColumnsNames.sourceUrl,
      recipeColumnsNames.sourceProvider,
      'ingredientNames',
    ])('returns undefined for appending target %s', target => {
      expect(undoableFieldForTarget(target)).toBeUndefined();
    });
  });

  describe('hasOcrUndoableValue', () => {
    describe.each<OcrUndoableField>(['recipeImage', 'recipeTitle', 'recipeDescription'])(
      'text field %s',
      field => {
        test('is filled with a non-blank string', () => {
          expect(hasOcrUndoableValue(field, 'Pasta')).toBe(true);
        });

        test.each<[string, unknown]>([
          ['empty string', ''],
          ['whitespace only', '   '],
        ])('is empty for %s', (_label, value) => {
          expect(hasOcrUndoableValue(field, value)).toBe(false);
        });
      }
    );

    describe.each<OcrUndoableField>(['recipePersons', 'recipeTime'])('number field %s', field => {
      test('is filled with a number', () => {
        expect(hasOcrUndoableValue(field, 4)).toBe(true);
      });

      test('is empty for the defaultValueNumber sentinel', () => {
        expect(hasOcrUndoableValue(field, defaultValueNumber)).toBe(false);
      });
    });

    describe('recipeNutrition', () => {
      test('is filled when the table exists', () => {
        expect(hasOcrUndoableValue('recipeNutrition', { energyKcal: 250 })).toBe(true);
      });

      test('is empty when the table is undefined', () => {
        expect(hasOcrUndoableValue('recipeNutrition', undefined)).toBe(false);
      });
    });

    describe('recipeIngredients', () => {
      test('is filled when one row has a quantity', () => {
        expect(
          hasOcrUndoableValue('recipeIngredients', [
            { name: 'Flour', quantity: '' },
            { name: 'Sugar', quantity: '200' },
          ])
        ).toBe(true);
      });

      test.each<[string, unknown]>([
        ['blank quantity', [{ name: 'Flour', quantity: '   ' }]],
        ['missing quantity', [{ name: 'Flour' }]],
        ['empty array', []],
      ])('is empty for %s', (_label, value) => {
        expect(hasOcrUndoableValue('recipeIngredients', value)).toBe(false);
      });
    });
  });

  describe('isOcrScanUndoable', () => {
    test('is true when a filled field changes', () => {
      expect(isOcrScanUndoable('recipeTitle', 'Old title', 'New title')).toBe(true);
    });

    test('is false when the field was empty before the scan', () => {
      expect(isOcrScanUndoable('recipeTitle', '', 'New title')).toBe(false);
    });

    test('is false when the scan kept the same value', () => {
      expect(isOcrScanUndoable('recipeTitle', 'Same title', 'Same title')).toBe(false);
    });

    test('is false when the persons sentinel was replaced', () => {
      expect(isOcrScanUndoable('recipePersons', defaultValueNumber, 4)).toBe(false);
    });

    test('compares nutrition structurally', () => {
      expect(isOcrScanUndoable('recipeNutrition', { energyKcal: 100 }, { energyKcal: 100 })).toBe(
        false
      );
      expect(isOcrScanUndoable('recipeNutrition', { energyKcal: 100 }, { energyKcal: 200 })).toBe(
        true
      );
    });

    test('compares ingredient rows structurally', () => {
      const rowsBefore = [{ name: 'Flour', quantity: '100' }];

      expect(
        isOcrScanUndoable('recipeIngredients', rowsBefore, [{ name: 'Flour', quantity: '100' }])
      ).toBe(false);
      expect(
        isOcrScanUndoable('recipeIngredients', rowsBefore, [{ name: 'Flour', quantity: '250' }])
      ).toBe(true);
    });
  });
});
