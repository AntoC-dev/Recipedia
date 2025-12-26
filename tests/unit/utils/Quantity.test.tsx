import {
  calculateNutritionPerPortion,
  formatIngredientForCallback,
  formatQuantityForDisplay,
  parseIngredientQuantity,
  scaleQuantityForPersons,
} from '@utils/Quantity';
import { nutritionTableElement } from '@customTypes/DatabaseElementTypes';
import { defaultValueNumber } from '@utils/Constants';

describe('scaleQuantityForPersons', () => {
  test('returns original when persons are equal', () => {
    expect(scaleQuantityForPersons('200', 4, 4)).toBe('200');
  });

  test('scales integers up and down', () => {
    expect(scaleQuantityForPersons('200', 2, 4)).toBe('400');
    expect(scaleQuantityForPersons('200', 4, 2)).toBe('100');
  });

  test('scales decimals with dot and outputs comma (4 decimals)', () => {
    expect(scaleQuantityForPersons('0.5', 2, 3)).toBe('0,75');
  });

  test('scales decimals with comma and outputs comma (4 decimals)', () => {
    expect(scaleQuantityForPersons('1,5', 6, 4)).toBe('1');
  });

  test('preserves non-numeric strings', () => {
    expect(scaleQuantityForPersons('some salt', 2, 4)).toBe('some salt');
  });

  test('does not scale ranges (multiple numbers)', () => {
    expect(scaleQuantityForPersons('1à3', 2, 4)).toBe('1à3');
    expect(scaleQuantityForPersons('1 - 3', 2, 4)).toBe('1 - 3');
  });

  test('preserves surrounding text and unit', () => {
    expect(scaleQuantityForPersons('200 g', 2, 3)).toBe('300 g');
    expect(scaleQuantityForPersons('1,5 cup', 3, 2)).toBe('1 cup');
  });

  describe('rounding precision for repeating decimals (4 decimals)', () => {
    test('scales 200 from 6 to 4 persons to 133,3333', () => {
      expect(scaleQuantityForPersons('200', 6, 4)).toBe('133,3333');
    });

    test('scales 100 from 3 to 4 persons to 133,3333', () => {
      expect(scaleQuantityForPersons('100', 3, 4)).toBe('133,3333');
    });

    test('scales 200 from 3 to 4 persons to 266,6667', () => {
      expect(scaleQuantityForPersons('200', 3, 4)).toBe('266,6667');
    });

    test('scales 100 from 6 to 4 persons to 66,6667', () => {
      expect(scaleQuantityForPersons('100', 6, 4)).toBe('66,6667');
    });

    test('scales 1 from 3 to 1 persons to 0,3333', () => {
      expect(scaleQuantityForPersons('1', 3, 1)).toBe('0,3333');
    });

    test('scales 1 from 6 to 1 persons to 0,1667', () => {
      expect(scaleQuantityForPersons('1', 6, 1)).toBe('0,1667');
    });

    test('scales 2 from 3 to 1 persons to 0,6667', () => {
      expect(scaleQuantityForPersons('2', 3, 1)).toBe('0,6667');
    });
  });

  describe('floating point accumulation (4 decimal precision)', () => {
    test('scales back and forth without errors', () => {
      const original = '200';
      const scaled = scaleQuantityForPersons(original, 4, 2);
      const scaledBack = scaleQuantityForPersons(scaled, 2, 4);
      expect(scaledBack).toBe('200');
    });

    test('multiple scaling operations remain consistent', () => {
      const start = '300';
      const step1 = scaleQuantityForPersons(start, 6, 4);
      const step2 = scaleQuantityForPersons(step1, 4, 2);
      const step3 = scaleQuantityForPersons(step2, 2, 6);
      expect(step3).toBe('300');
    });

    test('chain scaling with 4-decimal precision has minimal drift', () => {
      const original = '200';
      const to4 = scaleQuantityForPersons(original, 6, 4);
      expect(to4).toBe('133,3333');
      const to2 = scaleQuantityForPersons(to4, 4, 2);
      expect(to2).toBe('66,6667');
      const backTo4 = scaleQuantityForPersons(to2, 2, 4);
      expect(backTo4).toBe('133,3334');
      const backTo6 = scaleQuantityForPersons(backTo4, 4, 6);
      expect(backTo6).toBe('200,0001');
    });
  });

  describe('edge cases for no change', () => {
    test('returns same when fromPersons is 0', () => {
      expect(scaleQuantityForPersons('200', 0, 4)).toBe('200');
    });

    test('returns same when toPersons is 0', () => {
      expect(scaleQuantityForPersons('200', 4, 0)).toBe('200');
    });

    test('returns same when fromPersons is negative', () => {
      expect(scaleQuantityForPersons('200', -2, 4)).toBe('200');
    });

    test('returns same when toPersons is negative', () => {
      expect(scaleQuantityForPersons('200', 4, -2)).toBe('200');
    });

    test('handles empty string', () => {
      expect(scaleQuantityForPersons('', 4, 2)).toBe('');
    });

    test('handles zero quantity', () => {
      expect(scaleQuantityForPersons('0', 4, 2)).toBe('0');
    });
  });
});

describe('formatQuantityForDisplay', () => {
  test('formats 4 decimals to 2 for display', () => {
    expect(formatQuantityForDisplay('133,3333')).toBe('133,33');
    expect(formatQuantityForDisplay('66,6667')).toBe('66,67');
  });

  test('rounds correctly when formatting', () => {
    expect(formatQuantityForDisplay('133,3334')).toBe('133,33');
    expect(formatQuantityForDisplay('133,3366')).toBe('133,34');
  });

  test('preserves unit suffix', () => {
    expect(formatQuantityForDisplay('133,3333 g')).toBe('133,33 g');
    expect(formatQuantityForDisplay('66,6667 cup')).toBe('66,67 cup');
  });

  test('handles integer values', () => {
    expect(formatQuantityForDisplay('200')).toBe('200');
    expect(formatQuantityForDisplay('100')).toBe('100');
  });

  test('handles dot decimal input', () => {
    expect(formatQuantityForDisplay('133.3333')).toBe('133,33');
  });

  test('returns empty string unchanged', () => {
    expect(formatQuantityForDisplay('')).toBe('');
  });

  test('returns non-numeric strings unchanged', () => {
    expect(formatQuantityForDisplay('some salt')).toBe('some salt');
  });

  test('returns ranges unchanged (multiple numbers)', () => {
    expect(formatQuantityForDisplay('1-2')).toBe('1-2');
    expect(formatQuantityForDisplay('1 à 3')).toBe('1 à 3');
  });
});

describe('calculateNutritionPerPortion', () => {
  const mockNutrition: nutritionTableElement = {
    energyKcal: 250,
    energyKj: 1046,
    fat: 15.0,
    saturatedFat: 8.0,
    carbohydrates: 25.0,
    sugars: 12.0,
    fiber: 2.5,
    protein: 6.0,
    salt: 0.8,
    portionWeight: 100,
  };

  test('calculates nutrition per portion for 100g portion', () => {
    const result = calculateNutritionPerPortion(mockNutrition);

    expect(result.energyKcal).toBe(250);
    expect(result.energyKj).toBe(1046);
    expect(result.fat).toBe(15.0);
    expect(result.saturatedFat).toBe(8.0);
    expect(result.carbohydrates).toBe(25.0);
    expect(result.sugars).toBe(12.0);
    expect(result.fiber).toBe(2.5);
    expect(result.protein).toBe(6.0);
    expect(result.salt).toBe(0.8);
  });

  test('calculates nutrition per portion for 150g portion', () => {
    const nutritionWith150g = { ...mockNutrition, portionWeight: 150 };
    const result = calculateNutritionPerPortion(nutritionWith150g);

    expect(result.energyKcal).toBe(375);
    expect(result.energyKj).toBe(1569);
    expect(result.fat).toBe(22.5);
    expect(result.saturatedFat).toBe(12.0);
    expect(result.carbohydrates).toBe(37.5);
    expect(result.sugars).toBe(18.0);
    expect(result.fiber).toBe(3.8);
    expect(result.protein).toBe(9.0);
    expect(result.salt).toBe(1.2);
  });

  test('calculates nutrition per portion for 50g portion', () => {
    const nutritionWith50g = { ...mockNutrition, portionWeight: 50 };
    const result = calculateNutritionPerPortion(nutritionWith50g);

    expect(result.energyKcal).toBe(125);
    expect(result.energyKj).toBe(523);
    expect(result.fat).toBe(7.5);
    expect(result.saturatedFat).toBe(4.0);
    expect(result.carbohydrates).toBe(12.5);
    expect(result.sugars).toBe(6.0);
    expect(result.fiber).toBe(1.3);
    expect(result.protein).toBe(3.0);
    expect(result.salt).toBe(0.4);
  });

  test('handles decimal portion weights correctly', () => {
    const nutritionWith75g = { ...mockNutrition, portionWeight: 75 };
    const result = calculateNutritionPerPortion(nutritionWith75g);

    expect(result.energyKcal).toBe(187.5);
    expect(result.energyKj).toBe(785);
    expect(result.fat).toBe(11.3);
    expect(result.saturatedFat).toBe(6.0);
    expect(result.carbohydrates).toBe(18.8);
    expect(result.sugars).toBe(9.0);
    expect(result.fiber).toBe(1.9);
    expect(result.protein).toBe(4.5);
    expect(result.salt).toBe(0.6);
  });

  test('handles zero values correctly', () => {
    const zeroNutrition = {
      energyKcal: 0,
      energyKj: 0,
      fat: 0,
      saturatedFat: 0,
      carbohydrates: 0,
      sugars: 0,
      fiber: 0,
      protein: 0,
      salt: 0,
      portionWeight: 150,
    };
    const result = calculateNutritionPerPortion(zeroNutrition);

    expect(result.energyKcal).toBe(0);
    expect(result.energyKj).toBe(0);
    expect(result.fat).toBe(0);
    expect(result.saturatedFat).toBe(0);
    expect(result.carbohydrates).toBe(0);
    expect(result.sugars).toBe(0);
    expect(result.fiber).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.salt).toBe(0);
  });

  test('rounds values according to function specifications', () => {
    const nutritionWithDecimals = {
      energyKcal: 123.456,
      energyKj: 456.789,
      fat: 7.123,
      saturatedFat: 3.456,
      carbohydrates: 12.789,
      sugars: 5.123,
      fiber: 1.456,
      protein: 4.789,
      salt: 0.123,
      portionWeight: 133,
    };
    const result = calculateNutritionPerPortion(nutritionWithDecimals);

    expect(result.energyKcal).toBe(164.2);
    expect(result.energyKj).toBe(608);
    expect(result.fat).toBe(9.5);
    expect(result.saturatedFat).toBe(4.6);
    expect(result.carbohydrates).toBe(17.0);
    expect(result.sugars).toBe(6.8);
    expect(result.fiber).toBe(1.9);
    expect(result.protein).toBe(6.4);
    expect(result.salt).toBe(0.16);
  });
});

describe('parseIngredientQuantity', () => {
  test('parses integer quantity', () => {
    expect(parseIngredientQuantity('100')).toBe(100);
  });

  test('parses decimal quantity with dot', () => {
    expect(parseIngredientQuantity('2.5')).toBe(2.5);
  });

  test('parses decimal quantity with comma (European format)', () => {
    expect(parseIngredientQuantity('2,5')).toBe(2.5);
  });

  test('returns defaultValueNumber for empty string', () => {
    expect(parseIngredientQuantity('')).toBe(defaultValueNumber);
  });

  test('returns defaultValueNumber for whitespace-only string', () => {
    expect(parseIngredientQuantity('   ')).toBe(defaultValueNumber);
  });

  test('returns defaultValueNumber for undefined', () => {
    expect(parseIngredientQuantity(undefined)).toBe(defaultValueNumber);
  });

  test('returns defaultValueNumber for non-numeric string', () => {
    expect(parseIngredientQuantity('abc')).toBe(defaultValueNumber);
  });

  test('parses zero correctly', () => {
    expect(parseIngredientQuantity('0')).toBe(0);
  });

  test('parses negative numbers', () => {
    expect(parseIngredientQuantity('-5')).toBe(-5);
  });
});

describe('formatIngredientForCallback', () => {
  test('formats ingredient with quantity, unit, and name', () => {
    const result = formatIngredientForCallback(100, 'g', 'Rice');
    expect(result).toBe('100@@g--Rice');
  });

  test('formats ingredient with note', () => {
    const result = formatIngredientForCallback(100, 'g', 'Rice', 'for the sauce');
    expect(result).toBe('100@@g--Rice%%for the sauce');
  });

  test('formats ingredient without note (undefined)', () => {
    const result = formatIngredientForCallback(100, 'g', 'Rice', undefined);
    expect(result).toBe('100@@g--Rice');
  });

  test('formats ingredient with empty string note (omits separator)', () => {
    const result = formatIngredientForCallback(100, 'g', 'Rice', '');
    expect(result).toBe('100@@g--Rice');
  });

  test('handles defaultValueNumber quantity (becomes empty string)', () => {
    const result = formatIngredientForCallback(defaultValueNumber, 'g', 'Salt');
    expect(result).toBe('@@g--Salt');
  });

  test('handles defaultValueNumber quantity with note', () => {
    const result = formatIngredientForCallback(defaultValueNumber, 'g', 'Salt', 'to taste');
    expect(result).toBe('@@g--Salt%%to taste');
  });

  test('handles note with special characters', () => {
    const result = formatIngredientForCallback(100, 'g', 'Cheese', 'for the "special" sauce');
    expect(result).toBe('100@@g--Cheese%%for the "special" sauce');
  });

  test('handles note with unicode characters', () => {
    const result = formatIngredientForCallback(100, 'g', 'Pepper', '🌶️ spicy');
    expect(result).toBe('100@@g--Pepper%%🌶️ spicy');
  });

  test('handles note with accented characters', () => {
    const result = formatIngredientForCallback(100, 'g', 'Sel', 'à volonté');
    expect(result).toBe('100@@g--Sel%%à volonté');
  });

  test('handles empty unit', () => {
    const result = formatIngredientForCallback(2, '', 'Eggs', 'beaten');
    expect(result).toBe('2@@--Eggs%%beaten');
  });

  test('handles decimal quantity', () => {
    const result = formatIngredientForCallback(1.5, 'cups', 'Flour');
    expect(result).toBe('1.5@@cups--Flour');
  });

  describe('separator collision edge cases', () => {
    test('handles note containing noteSeparator (%%) character', () => {
      const result = formatIngredientForCallback(100, 'g', 'Sugar', '50%% organic');
      expect(result).toBe('100@@g--Sugar%%50%% organic');
    });

    test('handles note containing textSeparator (--) character', () => {
      const result = formatIngredientForCallback(100, 'g', 'Water', 'room temp -- filtered');
      expect(result).toBe('100@@g--Water%%room temp -- filtered');
    });

    test('handles note containing unitySeparator (@@) character', () => {
      const result = formatIngredientForCallback(100, 'g', 'Email', 'contact@@example.com');
      expect(result).toBe('100@@g--Email%%contact@@example.com');
    });
  });
});
