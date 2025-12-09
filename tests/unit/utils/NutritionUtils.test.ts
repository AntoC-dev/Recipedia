import {
  extractFirstInteger,
  extractNumericValue,
  isAllDigits,
  kcalToKj,
  namesMatch,
} from '@utils/NutritionUtils';

describe('NutritionUtils', () => {
  describe('kcalToKj', () => {
    it('converts 100 kcal to approximately 418.4 kJ', () => {
      expect(kcalToKj(100)).toBe(418.4);
    });

    it('converts 0 kcal to 0 kJ', () => {
      expect(kcalToKj(0)).toBe(0);
    });

    it('converts decimal values correctly', () => {
      expect(kcalToKj(50.5)).toBe(211.3);
    });

    it('rounds to 1 decimal place', () => {
      expect(kcalToKj(1)).toBe(4.2);
    });
  });

  describe('extractNumericValue', () => {
    it('extracts number from "200 kcal"', () => {
      expect(extractNumericValue('200 kcal')).toBe(200);
    });

    it('extracts decimal from "2.5 mg"', () => {
      expect(extractNumericValue('2.5 mg')).toBe(2.5);
    });

    it('extracts number without unit "15g"', () => {
      expect(extractNumericValue('15g')).toBe(15);
    });

    it('returns 0 for undefined', () => {
      expect(extractNumericValue(undefined)).toBe(0);
    });

    it('returns 0 for empty string', () => {
      expect(extractNumericValue('')).toBe(0);
    });

    it('returns 0 for string without numbers', () => {
      expect(extractNumericValue('no numbers here')).toBe(0);
    });

    it('extracts only first number from "100-200 kcal"', () => {
      expect(extractNumericValue('100-200 kcal')).toBe(100);
    });
  });

  describe('extractFirstInteger', () => {
    it('extracts number from "4 portions"', () => {
      expect(extractFirstInteger('4 portions')).toBe(4);
    });

    it('extracts number from "Serves 6"', () => {
      expect(extractFirstInteger('Serves 6')).toBe(6);
    });

    it('extracts first number from "4-6 servings"', () => {
      expect(extractFirstInteger('4-6 servings')).toBe(4);
    });

    it('returns undefined for string without numbers', () => {
      expect(extractFirstInteger('no numbers')).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      expect(extractFirstInteger('')).toBeUndefined();
    });
  });

  describe('isAllDigits', () => {
    it('returns true for digit-only string', () => {
      expect(isAllDigits('123')).toBe(true);
    });

    it('returns true for single digit', () => {
      expect(isAllDigits('0')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(isAllDigits('')).toBe(false);
    });

    it('returns false for string with letters', () => {
      expect(isAllDigits('12a3')).toBe(false);
    });

    it('returns false for string with spaces', () => {
      expect(isAllDigits('1 2 3')).toBe(false);
    });

    it('returns false for decimal number', () => {
      expect(isAllDigits('1.5')).toBe(false);
    });
  });

  describe('namesMatch', () => {
    it('returns true for identical strings', () => {
      expect(namesMatch('Apple', 'Apple')).toBe(true);
    });

    it('returns true for case-insensitive match', () => {
      expect(namesMatch('Apple', 'apple')).toBe(true);
      expect(namesMatch('TOMATO', 'tomato')).toBe(true);
    });

    it('returns false for different strings', () => {
      expect(namesMatch('Apple', 'Orange')).toBe(false);
    });

    it('returns false when first string is undefined', () => {
      expect(namesMatch(undefined, 'Apple')).toBe(false);
    });

    it('returns false when second string is undefined', () => {
      expect(namesMatch('Apple', undefined)).toBe(false);
    });

    it('returns false when both strings are undefined', () => {
      expect(namesMatch(undefined, undefined)).toBe(false);
    });

    it('returns false for empty strings', () => {
      expect(namesMatch('', '')).toBe(false);
      expect(namesMatch('Apple', '')).toBe(false);
    });
  });
});
