import { default as RecipeTranslations } from '@translations/en/recipe';

/** Type representing nutrition data extracted from OCR */
export type nutritionObject = {
  energyKcal?: number;
  energyKj?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  fiber?: number;
  protein?: number;
  salt?: number;
  portionWeight?: number;
};

/** OCR nutrition translations for TypeDoc documentation */
export const ocrTranslations = RecipeTranslations.nutrition.ocr;

/** Type for OCR keys matching nutrition translation keys */
export type OcrKeys = keyof typeof ocrTranslations;

/** Type for nutrition terms mapping OCR keys to arrays of terms */
export type NutritionTerms = Record<OcrKeys, string[]>;

/** Key for per 100g nutrition terms in OCR */
export const per100gKey: OcrKeys = 'per100g';

/** Key for per portion nutrition terms in OCR */
export const perPortionKey: OcrKeys = 'perPortion';

/** Whole-phrase fuzzy threshold for nutrition labels — tuned for OCR char-level noise on Quitoque/HelloFresh/FR labels. */
export const OCR_FUZZY_THRESHOLD = 0.2;
