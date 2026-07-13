import { ingredientDialogSchema, tagDialogSchema } from '@schemas/itemDialogSchema';
import { ingredientType } from '@customTypes/DatabaseElementTypes';

describe('tagDialogSchema', () => {
  test('fails when name is empty', () => {
    const result = tagDialogSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  test('fails when name is whitespace only', () => {
    const result = tagDialogSchema.safeParse({ name: '   ' });
    expect(result.success).toBe(false);
  });

  test('passes with valid name', () => {
    const result = tagDialogSchema.safeParse({ name: 'Italian' });
    expect(result.success).toBe(true);
  });

  test('trims name before validation', () => {
    const result = tagDialogSchema.safeParse({ name: '  Italian  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Italian');
    }
  });

  test('error message key matches i18n key for empty name', () => {
    const result = tagDialogSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe('name_required');
    }
  });
});

describe('ingredientDialogSchema', () => {
  const validIngredient = {
    name: 'Flour',
    type: ingredientType.cereal,
    unit: 'cups',
    season: ['1', '2'],
  };

  test('fails when name is empty', () => {
    const result = ingredientDialogSchema.safeParse({ ...validIngredient, name: '' });
    expect(result.success).toBe(false);
  });

  test('fails when name is whitespace only', () => {
    const result = ingredientDialogSchema.safeParse({ ...validIngredient, name: '   ' });
    expect(result.success).toBe(false);
  });

  test('trims name before validation', () => {
    const result = ingredientDialogSchema.safeParse({ ...validIngredient, name: '  Flour  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Flour');
    }
  });

  test('fails when type is missing', () => {
    const { type: _type, ...withoutType } = validIngredient;
    const result = ingredientDialogSchema.safeParse(withoutType);
    expect(result.success).toBe(false);
  });

  test('fails when type is not a valid ingredientType', () => {
    const result = ingredientDialogSchema.safeParse({ ...validIngredient, type: 'invalid_type' });
    expect(result.success).toBe(false);
  });

  test('passes with valid ingredient', () => {
    const result = ingredientDialogSchema.safeParse(validIngredient);
    expect(result.success).toBe(true);
  });

  test('defaults unit to empty string when not provided', () => {
    const { unit: _unit, ...withoutUnit } = validIngredient;
    const result = ingredientDialogSchema.safeParse(withoutUnit);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unit).toBe('');
    }
  });

  test('defaults season to empty array when not provided', () => {
    const { season: _season, ...withoutSeason } = validIngredient;
    const result = ingredientDialogSchema.safeParse(withoutSeason);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.season).toEqual([]);
    }
  });

  test('passes with empty unit', () => {
    const result = ingredientDialogSchema.safeParse({ ...validIngredient, unit: '' });
    expect(result.success).toBe(true);
  });

  test('accepts all valid ingredientType values', () => {
    const result = ingredientDialogSchema.safeParse({
      ...validIngredient,
      type: ingredientType.vegetable,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe(ingredientType.vegetable);
    }
  });
});
