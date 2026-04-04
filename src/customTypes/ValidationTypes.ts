/**
 * ValidationTypes - Shared domain types for the bulk import validation flow
 *
 * These types represent core domain concepts shared across hooks, components,
 * and utilities involved in the validation and review workflow.
 *
 * @module customTypes/ValidationTypes
 */

import {
  FormIngredientElement,
  ingredientTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';

/** A tag that needs validation, with pre-computed similar items from the database */
export type TagWithSimilarity = tagTableElement & {
  similarItems: tagTableElement[];
};

/** An ingredient that needs validation, with pre-computed similar items from the database */
export type IngredientWithSimilarity = FormIngredientElement & {
  similarItems: ingredientTableElement[];
};

/** Resolution status for a single validation item */
export type ValidationItemStatus = 'pending' | 'resolved' | 'skipped';

/** How an item was resolved */
export type ValidationResolution = {
  type: 'use-suggested' | 'add-new' | 'pick-existing';
  resolvedItem: tagTableElement | ingredientTableElement;
};

/** Internal state for a single review item */
export type ReviewItemState = {
  status: ValidationItemStatus;
  resolution?: ValidationResolution;
};

/** A tag with its current review state */
export type TagReviewItem = TagWithSimilarity & {
  reviewState: ReviewItemState;
};

/** An ingredient with its current review state */
export type IngredientReviewItem = IngredientWithSimilarity & {
  reviewState: ReviewItemState;
};

/** Resolved mappings returned when the user commits the review */
export type ResolutionMappings = {
  tagMappings: Map<string, tagTableElement>;
  ingredientMappings: Map<string, ingredientTableElement>;
};
