import { computeOcrFieldStatus } from '@utils/OCR';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';

describe('computeOcrFieldStatus', () => {
  describe('ingredientQuantities', () => {
    test('empty when no quantities extracted', () => {
      expect(computeOcrFieldStatus('ingredientQuantities', { ingredientQuantities: [] }, 3)).toBe(
        'empty'
      );
    });

    test('empty when quantities key absent', () => {
      expect(computeOcrFieldStatus('ingredientQuantities', {}, 3)).toBe('empty');
    });

    test('mismatch when count differs from ingredient rows', () => {
      expect(
        computeOcrFieldStatus('ingredientQuantities', { ingredientQuantities: ['1', '2'] }, 3)
      ).toBe('mismatch');
    });

    test('success when count matches ingredient rows', () => {
      expect(
        computeOcrFieldStatus('ingredientQuantities', { ingredientQuantities: ['1', '2', '3'] }, 3)
      ).toBe('success');
    });

    test('mismatch when quantities scanned but no ingredient rows exist', () => {
      expect(
        computeOcrFieldStatus('ingredientQuantities', { ingredientQuantities: ['1', '2'] }, 0)
      ).toBe('mismatch');
    });
  });

  describe('non-quantity fields', () => {
    test('empty for empty payload', () => {
      expect(computeOcrFieldStatus(recipeColumnsNames.title, {}, 0)).toBe('empty');
    });

    test('empty for blank string value', () => {
      expect(computeOcrFieldStatus(recipeColumnsNames.title, { recipeTitle: '' }, 0)).toBe('empty');
    });

    test('empty for empty array value', () => {
      expect(computeOcrFieldStatus(recipeColumnsNames.tags, { recipeTags: [] }, 0)).toBe('empty');
    });

    test('empty when the only value is undefined', () => {
      expect(computeOcrFieldStatus(recipeColumnsNames.title, { recipeTitle: undefined }, 0)).toBe(
        'empty'
      );
    });

    test('success for populated string value', () => {
      expect(computeOcrFieldStatus(recipeColumnsNames.title, { recipeTitle: 'Cake' }, 0)).toBe(
        'success'
      );
    });

    test('success for numeric value', () => {
      expect(computeOcrFieldStatus(recipeColumnsNames.persons, { recipePersons: 4 }, 0)).toBe(
        'success'
      );
    });

    test('success for zero numeric value', () => {
      expect(computeOcrFieldStatus(recipeColumnsNames.time, { recipeTime: 0 }, 0)).toBe('success');
    });

    test('success for non-empty array value', () => {
      expect(
        computeOcrFieldStatus(
          recipeColumnsNames.preparation,
          { recipePreparation: [{ title: 'Step', description: 'Mix' }] },
          0
        )
      ).toBe('success');
    });
  });
});
