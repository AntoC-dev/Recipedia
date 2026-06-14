/**
 * recipeFormSchema - Zod validation schema for the Recipe form
 *
 * Drives field-level validation on the Recipe screen. Messages are i18n keys
 * resolved at display time. The numeric sentinel `defaultValueNumber` (-1) is
 * treated as "not set" for persons, time, and nutrition numeric fields.
 *
 * Ingredient and tag entries accept partial shapes at input (form holds
 * work-in-progress values), but validation requires `name`, `quantity`,
 * `type`, and `season` (key present, may be empty array) for every ingredient
 * when triggered.
 *
 * @module schemas/recipeFormSchema
 */

import { z } from 'zod';
import { ingredientType } from '@customTypes/DatabaseElementTypes';
import { defaultValueNumber } from '@utils/Constants';

const tagSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
});

const ingredientSchema = z
  .object({
    id: z.number().optional(),
    name: z.string().optional(),
    quantity: z.string().optional(),
    unit: z.string().optional(),
    type: z.enum(ingredientType).optional(),
    season: z.array(z.string()).optional(),
    note: z.string().optional(),
  })
  .superRefine((ing, ctx) => {
    if (!ing.name || ing.name.trim().length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'alerts.missingElements.ingredientNames',
        path: ['name'],
      });
    }
    if (!ing.quantity || ing.quantity.trim().length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'alerts.missingElements.ingredientQuantities',
        path: ['quantity'],
      });
    }
    if (!ing.type) {
      ctx.addIssue({
        code: 'custom',
        message: 'alerts.missingElements.ingredientInDatabase',
        path: ['type'],
      });
    }
    if (ing.season === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'alerts.missingElements.ingredientInDatabase',
        path: ['season'],
      });
    }
  });

const preparationStepSchema = z.object({
  title: z.string(),
  description: z.string().trim().min(1, 'alerts.missingElements.titlePreparation'),
});

const numericNotSentinel = (errorKey: string) =>
  z.number().refine(v => v !== defaultValueNumber, { error: errorKey });

const nutritionSchema = z
  .object({
    id: z.number().optional(),
    energyKcal: numericNotSentinel('alerts.missingElements.nutrition'),
    energyKj: numericNotSentinel('alerts.missingElements.nutrition'),
    fat: numericNotSentinel('alerts.missingElements.nutrition'),
    saturatedFat: numericNotSentinel('alerts.missingElements.nutrition'),
    carbohydrates: numericNotSentinel('alerts.missingElements.nutrition'),
    sugars: numericNotSentinel('alerts.missingElements.nutrition'),
    fiber: numericNotSentinel('alerts.missingElements.nutrition'),
    protein: numericNotSentinel('alerts.missingElements.nutrition'),
    salt: numericNotSentinel('alerts.missingElements.nutrition'),
    portionWeight: numericNotSentinel('alerts.missingElements.nutrition'),
  })
  .optional();

/**
 * Zod schema for the Recipe form. Validates every field exposed by the
 * Recipe screen using i18n message keys.
 */
export const recipeFormSchema = z.object({
  recipeImage: z.string().trim().min(1, 'alerts.missingElements.image'),
  recipeTitle: z.string().trim().min(1, 'alerts.missingElements.titleRecipe'),
  recipeDescription: z.string(),
  recipeTags: z.array(tagSchema).default([]),
  recipePersons: numericNotSentinel('alerts.missingElements.titlePersons'),
  recipeIngredients: z.array(ingredientSchema).min(1, 'alerts.missingElements.titleIngredients'),
  recipePreparation: z
    .array(preparationStepSchema)
    .min(1, 'alerts.missingElements.titlePreparation'),
  recipeTime: numericNotSentinel('alerts.missingElements.titleTime'),
  recipeNutrition: nutritionSchema,
});

/**
 * Pre-transform input type. Use this for `useForm` field values — fields with
 * defaults are optional on input.
 */
export type RecipeFormInput = z.input<typeof recipeFormSchema>;
