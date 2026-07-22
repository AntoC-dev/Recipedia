import { default as RecipeTranslations } from '@translations/en/recipe';

/**
 * Nutrition data extracted from an OCR scan of a nutrition label.
 *
 * Every field is optional: OCR may fail to locate a given value on the label,
 * in which case the field stays `undefined` and the UI leaves it blank. Values
 * are per 100g unless {@link portionWeight} is used to derive per-portion figures.
 */
export type nutritionObject = {
  /** Energy in kcal per 100g */
  energyKcal?: number;
  /** Energy in kJ per 100g */
  energyKj?: number;
  /** Total fats in grams per 100g */
  fat?: number;
  /** Saturated fats in grams per 100g (subset of total fats) */
  saturatedFat?: number;
  /** Total carbohydrates in grams per 100g */
  carbohydrates?: number;
  /** Sugars in grams per 100g (subset of carbohydrates) */
  sugars?: number;
  /** Dietary fiber in grams per 100g */
  fiber?: number;
  /** Proteins in grams per 100g */
  protein?: number;
  /** Salt in grams per 100g */
  salt?: number;
  /** Portion size in grams, used to convert per-100g values to per-portion */
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
