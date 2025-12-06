/**
 * RecipeNavigationTypes - Type definitions for Recipe screen navigation
 *
 * Defines the navigation parameter types for the Recipe screen, including
 * all possible modes and their associated data requirements.
 *
 * @module customTypes/RecipeNavigationTypes
 */

import { recipeTableElement } from '@customTypes/DatabaseElementTypes';

/**
 * All possible mode values for Recipe screen navigation.
 *
 * - 'readOnly': View an existing recipe without editing
 * - 'edit': Modify an existing recipe
 * - 'addManually': Create a new recipe by manual input
 * - 'addFromPic': Create a new recipe using OCR from an image
 */
export type RecipeMode = 'readOnly' | 'edit' | 'addManually' | 'addFromPic';

/**
 * Base interface for all Recipe screen navigation parameters.
 *
 * All recipe prop types must include a mode that determines
 * the screen's behavior and available actions.
 */
export interface BaseRecipeProp {
  /** The operational mode for the Recipe screen */
  mode: RecipeMode;
}

/**
 * Navigation parameters for viewing an existing recipe in read-only mode.
 *
 * Includes the recipe data to display. User can view details and add
 * ingredients to shopping list but cannot modify the recipe.
 */
export interface ReadRecipeProp extends BaseRecipeProp {
  mode: 'readOnly';
  /** The recipe to display */
  recipe: recipeTableElement;
}

/**
 * Navigation parameters for editing an existing recipe.
 *
 * Includes the recipe data to edit. User can modify all fields
 * and save changes to the database.
 */
export interface EditRecipeProp extends BaseRecipeProp {
  mode: 'edit';
  /** The recipe to edit */
  recipe: recipeTableElement;
}

/**
 * Navigation parameters for creating a new recipe manually.
 *
 * Opens an empty form for the user to fill in all recipe details
 * by hand.
 */
export interface AddManuallyProp extends BaseRecipeProp {
  mode: 'addManually';
}

/**
 * Navigation parameters for creating a new recipe from an image using OCR.
 *
 * Opens a form with OCR capabilities to extract recipe data from
 * the provided image.
 */
export interface AddFromPicProp extends BaseRecipeProp {
  mode: 'addFromPic';
  /** URI of the image to use for OCR extraction */
  imgUri: string;
}

/**
 * Discriminated union type for Recipe screen navigation parameters.
 *
 * Uses the `mode` field as discriminator to determine which additional
 * properties are available. TypeScript can narrow the type based on
 * the mode value.
 */
export type RecipePropType = ReadRecipeProp | EditRecipeProp | AddManuallyProp | AddFromPicProp;
