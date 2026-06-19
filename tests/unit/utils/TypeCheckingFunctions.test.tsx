import {
  hasAtLeastKeys,
  hasSameKeysAs,
  isArrayOfNumber,
  isArrayOfString,
  isArrayOfType,
  isNumber,
  isOfType,
  isString,
} from '@utils/TypeCheckingFunctions';

describe('Type Checking Functions', () => {
  describe('Type Guards', () => {
    test('isString should detect strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString(123)).toBe(false);
    });

    test('isNumber should detect numbers or number-like strings', () => {
      expect(isNumber('42')).toBe(true);
      expect(isNumber(3.14)).toBe(true);
      expect(isNumber('foo')).toBe(false);
    });

    test('isArrayOfNumber should detect arrays of numbers or number-like strings', () => {
      expect(isArrayOfNumber([1, 2, 3])).toBe(true);
      expect(isArrayOfNumber(['1', '2'])).toBe(true);
      expect(isArrayOfNumber(['1', 'two'])).toBe(false);
    });

    test('isArrayOfString should detect arrays of strings', () => {
      expect(isArrayOfString(['a', 'b'])).toBe(true);
      expect(isArrayOfString([1, 'b'])).toBe(false);
    });

    test('hasSameKeysAs should check exact key structure', () => {
      expect(hasSameKeysAs<{ a: any; b: any }>({ a: 1, b: 2 }, ['a', 'b'])).toBe(true);
      expect(hasSameKeysAs<{ a: any; b: any }>({ a: 1 }, ['a', 'b'])).toBe(false);
      expect(hasSameKeysAs<{ a: any; b: any }>({ a: 1, b: 2, c: 3 }, ['a', 'b'])).toBe(false);
    });

    test('hasAtLeastKeys should check required keys allowing extras', () => {
      expect(hasAtLeastKeys<{ a: any; b: any }>({ a: 1, b: 2 }, ['a', 'b'])).toBe(true);
      expect(hasAtLeastKeys<{ a: any; b: any }>({ a: 1 }, ['a', 'b'])).toBe(false);
      expect(hasAtLeastKeys<{ a: any; b: any }>({ a: 1, b: 2, c: 3 }, ['a', 'b'])).toBe(true);
    });

    test('hasAtLeastKeys should reject null and non-objects', () => {
      expect(hasAtLeastKeys<{ a: any }>(null, ['a'])).toBe(false);
      expect(hasAtLeastKeys<{ a: any }>('not an object', ['a'])).toBe(false);
    });

    test('hasSameKeysAs should reject null and non-objects', () => {
      expect(hasSameKeysAs<{ a: any }>(null, ['a'])).toBe(false);
      expect(hasSameKeysAs<{ a: any }>(42, ['a'])).toBe(false);
    });

    test('isOfType should confirm object has required keys (allows extra keys)', () => {
      expect(isOfType<{ name: string }>({ name: 'Alice' }, ['name'])).toBe(true);
      expect(isOfType<{ name: string }>({ name: 'Alice', age: 30 }, ['name'])).toBe(true);
      expect(isOfType<{ name: string }>({ age: 30 }, ['name'])).toBe(false);
    });

    test('isArrayOfType should confirm array of structured objects', () => {
      const array = [{ id: 1 }, { id: 2 }];
      expect(isArrayOfType<{ id: number }>(array, ['id'])).toBe(true);
    });
  });
});
