/**
 * NumberFormat - Single source of truth for rendering floating-point numbers
 *
 * Splits number formatting into two deliberately separate concerns:
 *
 * - **Display** ({@link formatDecimalForDisplay}) follows the device's regional
 *   convention, so quantities and nutrition values read the way every other app
 *   on the phone renders numbers.
 * - **Storage** ({@link formatDecimalForStorage}) is locale-independent, because
 *   scaled quantities are persisted to the database. A stored value must not
 *   change meaning when the user travels or changes their device region.
 *
 * Separators are a regional convention rather than a language one, so display
 * follows the device region (`expo-localization`) and not the app's language
 * setting: a French speaker on a US device still sees `8.53`.
 *
 * @module NumberFormat
 */

import * as Localization from 'expo-localization';

/**
 * Decimal separator used for values written to the database.
 *
 * Deliberately fixed. `parseQuantity` normalizes both `,` and `.` on the way in,
 * so stored values stay readable regardless of the device region that produced
 * them, and existing rows keep their meaning.
 */
export const storageDecimalSeparator = ',';

/**
 * Fallback separator when the platform reports no regional preference.
 */
const fallbackDecimalSeparator = '.';

/**
 * Resolves the decimal separator for the device's current region.
 *
 * @returns The region's decimal separator, or `'.'` when unavailable
 */
export function deviceDecimalSeparator(): string {
  return Localization.getLocales()[0]?.decimalSeparator ?? fallbackDecimalSeparator;
}

/**
 * Rounds to at most `maxDecimals` fractional digits and renders the result with
 * `separator` as the decimal mark.
 *
 * Trailing zeros are dropped (rounding goes through `Math.round`, so
 * `2` formats as `'2'`, never `'2,00'`). Non-finite input (`NaN`, `Infinity`,
 * `-Infinity`) is returned via `String(value)` unchanged, with no substitution.
 *
 * @param value - The numeric value to format
 * @param maxDecimals - Maximum number of fractional digits to keep
 * @param separator - Decimal mark to render
 * @returns The formatted string
 */
function formatDecimal(value: number, maxDecimals: number, separator: string): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(value * factor) / factor;
  return String(rounded).replace('.', separator);
}

/**
 * Formats a number for display using the device region's decimal separator.
 *
 * @param value - The numeric value to format
 * @param maxDecimals - Maximum number of fractional digits to keep
 * @returns The formatted string, using the device region's decimal separator
 *
 * @example
 * // device region FR
 * formatDecimalForDisplay(0.75, 2) // returns '0,75'
 * // device region US
 * formatDecimalForDisplay(0.75, 2) // returns '0.75'
 */
export function formatDecimalForDisplay(value: number, maxDecimals: number): string {
  return formatDecimal(value, maxDecimals, deviceDecimalSeparator());
}

/**
 * Formats a number for persistence, independent of the device region.
 *
 * @param value - The numeric value to format
 * @param maxDecimals - Maximum number of fractional digits to keep
 * @returns The formatted string, using {@link storageDecimalSeparator}
 *
 * @example
 * formatDecimalForStorage(133.33333, 4) // returns '133,3333'
 * formatDecimalForStorage(200, 2) // returns '200'
 */
export function formatDecimalForStorage(value: number, maxDecimals: number): string {
  return formatDecimal(value, maxDecimals, storageDecimalSeparator);
}
