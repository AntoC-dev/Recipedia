/**
 * itemDialogSchema - Zod validation schemas for the ItemDialog form
 */

import { z } from 'zod';
import { ingredientType } from '@customTypes/DatabaseElementTypes';

const nameField = z.string().trim().min(1, 'name_required');

export const tagDialogSchema = z.object({
  name: nameField,
});

export const ingredientDialogSchema = z.object({
  name: nameField,
  type: z.nativeEnum(ingredientType),
  unit: z.string().default(''),
  season: z.array(z.string()).default([]),
});
