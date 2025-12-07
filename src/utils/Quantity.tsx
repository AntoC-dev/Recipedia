// Utility for scaling ingredient quantity strings when the number of persons changes

/**
 * Scales a quantity string according to a change in persons.
 * - Scales only if the string contains exactly one numeric token (supports dot/comma decimals)
 * - Preserves the rest of the string
 * - Uses ',' as decimal separator in the output
 * - Rounds to 2 decimals
 */
export function scaleQuantityForPersons(
  quantity: string,
  fromPersons: number,
  toPersons: number
): string {
  if (fromPersons <= 0 || toPersons <= 0 || fromPersons === toPersons) {
    return quantity;
  }

  const numberTokenRegex = /\d+(?:[.,]\d+)?/g;
  const allNumbers = quantity.match(numberTokenRegex);
  if (!allNumbers || allNumbers.length !== 1) {
    return quantity;
  }

  const originalNumericToken = allNumbers[0];
  const numericValue = parseFloat(originalNumericToken.replace(',', '.'));
  if (isNaN(numericValue)) {
    return quantity;
  }

  const scaledValue = (numericValue * toPersons) / fromPersons;
  // Use 4 decimal places internally for precision during chain scaling
  const highPrecision = Math.round(scaledValue * 10000) / 10000;
  const roundedStr = highPrecision.toString().replace('.', ',');

  return quantity.replace(originalNumericToken, roundedStr);
}

/**
 * Formats a quantity string for display, limiting to 2 decimal places.
 * Used to show user-friendly values while internal storage uses 4 decimals.
 * Preserves non-numeric parts (unit suffixes, ranges, etc.).
 */
export function formatQuantityForDisplay(quantity: string): string {
  if (!quantity) {
    return quantity;
  }

  const numberTokenRegex = /\d+(?:[.,]\d+)?/g;
  const allNumbers = quantity.match(numberTokenRegex);
  if (!allNumbers || allNumbers.length !== 1) {
    return quantity;
  }

  const originalNumericToken = allNumbers[0];
  const numericValue = parseFloat(originalNumericToken.replace(',', '.'));
  if (isNaN(numericValue)) {
    return quantity;
  }

  const displayValue = Math.round(numericValue * 100) / 100;
  const displayStr = displayValue.toString().replace('.', ',');

  return quantity.replace(originalNumericToken, displayStr);
}

/**
 * Calculates nutritional values per portion based on portion weight
 * Takes nutrition per 100g and scales it to the specified portion size
 */
export function calculateNutritionPerPortion(nutrition: {
  energyKcal: number;
  energyKj: number;
  fat: number;
  saturatedFat: number;
  carbohydrates: number;
  sugars: number;
  fiber: number;
  protein: number;
  salt: number;
  portionWeight: number;
}): Omit<typeof nutrition, 'portionWeight'> {
  const portionFactor = nutrition.portionWeight / 100;
  return {
    energyKcal: Math.round(nutrition.energyKcal * portionFactor * 10) / 10,
    energyKj: Math.round(nutrition.energyKj * portionFactor),
    fat: Math.round(nutrition.fat * portionFactor * 10) / 10,
    saturatedFat: Math.round(nutrition.saturatedFat * portionFactor * 10) / 10,
    carbohydrates: Math.round(nutrition.carbohydrates * portionFactor * 10) / 10,
    sugars: Math.round(nutrition.sugars * portionFactor * 10) / 10,
    fiber: Math.round(nutrition.fiber * portionFactor * 10) / 10,
    protein: Math.round(nutrition.protein * portionFactor * 10) / 10,
    salt: Math.round(nutrition.salt * portionFactor * 100) / 100,
  };
}
