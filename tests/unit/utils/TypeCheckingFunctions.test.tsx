import {
  hasAtLeastKeys,
  hasSameKeysAs,
  isArrayOfNumber,
  isArrayOfString,
  isArrayOfType,
  isNumber,
  isOfType,
  isString,
  subtractNumberInString,
  sumNumberInString,
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

  describe('sumNumberInString', () => {
    test('adds plain numbers', () => {
      expect(sumNumberInString('10', '5')).toBe('15');
    });

    test('adds embedded numbers in strings', () => {
      expect(sumNumberInString('2x3y', '4x7y')).toBe('6x10y');
      expect(sumNumberInString('1and3', '1and3')).toBe('2and6');
    });

    test('adds text intelligently', () => {
      expect(sumNumberInString('a5b', 'a2b')).toBe('a7b');
      expect(sumNumberInString('abc1', 'abc2')).toBe('abc3');
    });

    test('logs error when mixing number and non-number strings', () => {
      expect(sumNumberInString('42', 'abc')).toBe('42abc');
      // Should handle mixed types gracefully
    });
  });

  describe('subtractNumberInString', () => {
    test('subtracts plain numbers', () => {
      expect(subtractNumberInString('10', '4')).toBe('6');
    });

    test('subtracts embedded numbers', () => {
      expect(subtractNumberInString('5x8y', '2x3y')).toBe('3x5y');
    });

    test('subtracts text-number combos safely', () => {
      expect(subtractNumberInString('a9b', 'a2b')).toBe('a7b');
    });

    test('logs error when mixing types', () => {
      expect(subtractNumberInString('oops', '123')).toBe('oops123');
      // Should handle mixed types gracefully
    });
  });
});
