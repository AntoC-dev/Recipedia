import { buildItemFormValues } from '@customTypes/ItemDialogTypes';
import {
  ingredientTableElement,
  ingredientType,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';

describe('buildItemFormValues', () => {
  describe('tag item', () => {
    const tag: tagTableElement = { id: 1, name: 'Italian' };

    test('maps name from tag value', () => {
      const result = buildItemFormValues({ type: 'Tag', value: tag });
      expect(result.name).toBe('Italian');
    });

    test('sets ingredient-only fields to empty defaults', () => {
      const result = buildItemFormValues({ type: 'Tag', value: tag });
      expect(result.type).toBeUndefined();
      expect(result.unit).toBe('');
      expect(result.season).toEqual([]);
    });

    test('defaults name to empty string when tag name is undefined', () => {
      const result = buildItemFormValues({
        type: 'Tag',
        value: { name: undefined as unknown as string },
      });
      expect(result.name).toBe('');
    });
  });

  describe('ingredient item', () => {
    const ingredient: ingredientTableElement = {
      id: 2,
      name: 'Flour',
      type: ingredientType.cereal,
      unit: 'cups',
      season: ['1', '2', '3'],
    };

    test('maps all ingredient fields', () => {
      const result = buildItemFormValues({ type: 'Ingredient', value: ingredient });
      expect(result.name).toBe('Flour');
      expect(result.type).toBe(ingredientType.cereal);
      expect(result.unit).toBe('cups');
      expect(result.season).toEqual(['1', '2', '3']);
    });

    test('defaults unit to empty string when undefined', () => {
      const result = buildItemFormValues({
        type: 'Ingredient',
        value: { name: 'Salt', type: ingredientType.spice },
      });
      expect(result.unit).toBe('');
    });

    test('defaults season to empty array when undefined', () => {
      const result = buildItemFormValues({
        type: 'Ingredient',
        value: { name: 'Salt', type: ingredientType.spice },
      });
      expect(result.season).toEqual([]);
    });

    test('type is undefined when ingredient type not set', () => {
      const result = buildItemFormValues({
        type: 'Ingredient',
        value: { name: 'Salt' },
      });
      expect(result.type).toBeUndefined();
    });

    test('defaults name to empty string when ingredient name is undefined', () => {
      const result = buildItemFormValues({
        type: 'Ingredient',
        value: { type: ingredientType.cereal },
      });
      expect(result.name).toBe('');
    });
  });
});
