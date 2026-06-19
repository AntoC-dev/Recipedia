/**
 * TypeCheckingFunctions - Utility functions for runtime type validation and string arithmetic
 *
 * This module provides type checking utilities for validating data at runtime.
 * Used primarily for validating user input and database records.
 */

/**
 * Checks if a value is a string
 *
 * @param val - The value to check
 * @returns True if the value is a string
 *
 * @example
 * ```typescript
 * isString("hello") // true
 * isString(123) // false
 * ```
 */
export function isString(val: unknown): boolean {
  return typeof val === 'string';
}

/**
 * Checks if a value can be converted to a valid number
 *
 * @param val - The value to check
 * @returns True if the value can be converted to a number
 *
 * @example
 * ```typescript
 * isNumber("123") // true
 * isNumber("abc") // false
 * isNumber(456) // true
 * ```
 */
export function isNumber(val: unknown): boolean {
  return !isNaN(Number(val));
}

/**
 * Checks if a value is an array containing only numbers
 *
 * @param val - The value to check
 * @returns True if the value is an array of numbers
 *
 * @example
 * ```typescript
 * isArrayOfNumber([1, 2, 3]) // true
 * isArrayOfNumber([1, "2", 3]) // false
 * ```
 */
export function isArrayOfNumber(val: unknown): boolean {
  return Array.isArray(val) && val.every(v => isNumber(v));
}

/**
 * Checks if a value is an array containing only strings
 *
 * @param val - The value to check
 * @returns True if the value is an array of strings
 *
 * @example
 * ```typescript
 * isArrayOfString(["a", "b", "c"]) // true
 * isArrayOfString(["a", 1, "c"]) // false
 * ```
 */
export function isArrayOfString(val: unknown): boolean {
  return Array.isArray(val) && val.every(v => isString(v));
}

/**
 * Checks if a value is an array of objects with specific type structure
 *
 * @param val - The value to check
 * @param keys - Array of required keys for the type T
 * @returns True if the value is an array of objects matching type T
 *
 * @example
 * ```typescript
 * interface User { name: string; age: number; }
 * isArrayOfType<User>(users, ["name", "age"]) // true if all objects have name and age
 * ```
 */
export function isArrayOfType<T>(val: unknown, keys: (keyof T)[]): boolean {
  return Array.isArray(val) && val.every(v => isOfType<T>(v, keys));
}

/**
 * Checks if a value matches a specific object type structure
 *
 * @param val - The value to check
 * @param keys - Array of required keys for the type T
 * @returns True if the value has all required keys (allows extra keys for optional fields)
 *
 * @example
 * ```typescript
 * interface User { name: string; age: number; }
 * isOfType<User>(obj, ["name", "age"]) // true if obj has name and age properties
 * isOfType<User>({name: "John", age: 30, extra: "ok"}, ["name", "age"]) // true (extra keys allowed)
 * ```
 */
export function isOfType<T>(val: unknown, keys: (keyof T)[]): boolean {
  return Boolean(val && typeof val === 'object' && hasAtLeastKeys<T>(val, keys));
}

/**
 * Checks if an object has at least the specified keys
 *
 * @param val - The value to check
 * @param keys - Array of required keys
 * @returns True if the object has at least all specified keys (extra keys are allowed)
 *
 * @example
 * ```typescript
 * hasAtLeastKeys({a: 1, b: 2}, ["a", "b"]) // true
 * hasAtLeastKeys({a: 1, b: 2, c: 3}, ["a", "b"]) // true (extra key allowed)
 * hasAtLeastKeys({a: 1}, ["a", "b"]) // false (missing key)
 * ```
 */
export function hasAtLeastKeys<T>(val: unknown, keys: (keyof T)[]): boolean {
  if (typeof val !== 'object' || val === null) return false;

  const valKeys = Object.keys(val);
  return keys.every(key => valKeys.includes(key as string));
}

/**
 * Checks if an object has exactly the same keys as specified
 *
 * @param val - The value to check
 * @param keys - Array of expected keys
 * @returns True if the object has exactly the specified keys (no more, no less)
 *
 * @example
 * ```typescript
 * hasSameKeysAs({a: 1, b: 2}, ["a", "b"]) // true
 * hasSameKeysAs({a: 1, b: 2, c: 3}, ["a", "b"]) // false (extra key)
 * ```
 */
export function hasSameKeysAs<T>(val: unknown, keys: (keyof T)[]): boolean {
  if (typeof val !== 'object' || val === null) return false;

  const valKeys = Object.keys(val);
  return valKeys.length === keys.length && keys.every(key => valKeys.includes(key as string));
}
