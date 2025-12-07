/**
 * React hook for managing ingredient operations in the Recipe screen.
 *
 * This hook provides functionality for editing, adding, and merging ingredients
 * in a recipe form. It handles validation workflows for fuzzy ingredient matching,
 * quantity merging for duplicate ingredients, and integration with the ingredient
 * validation queue system.
 *
 * @module hooks/useRecipeIngredients
 */

import { FormIngredientElement, ingredientTableElement } from '@customTypes/DatabaseElementTypes';
import { processIngredientsForValidation } from '@utils/RecipeValidationHelpers';
import { recipeLogger } from '@utils/logger';
import { textSeparator, unitySeparator } from '@styles/typography';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
import { useRecipeDialogs } from '@context/RecipeDialogsContext';
import { useRecipeForm } from '@context/RecipeFormContext';

/**
 * Parses an ingredient display string into its components
 *
 * Extracts quantity, unit, and name from a formatted ingredient string
 * using the standard separators defined in typography.
 *
 * @param ingredientStr - Formatted string like "100|g - Rice"
 * @returns Object with quantity, unit, and name strings
 */
export function parseIngredientString(ingredientStr: string): {
  quantity: string;
  unit: string;
  name: string;
} {
  const [unitAndQuantity, name] = ingredientStr.split(textSeparator);
  const [quantity, unit] = unitAndQuantity.split(unitySeparator);
  return { quantity: quantity || '', unit: unit || '', name: name || '' };
}

/**
 * Formats ingredient components into a display string
 *
 * Creates a standardized string representation of an ingredient
 * using the standard separators defined in typography.
 *
 * @param ingredient - The ingredient element to format
 * @returns Formatted string like "100|g - Rice"
 */
export function formatIngredientString(ingredient: FormIngredientElement): string {
  return `${ingredient.quantity || ''}${unitySeparator}${ingredient.unit || ''}${textSeparator}${ingredient.name || ''}`;
}

/**
 * Return value of the useRecipeIngredients hook.
 */
export interface UseRecipeIngredientsReturn {
  /**
   * Updates an existing ingredient at the specified index.
   * If the ingredient name changes, triggers validation workflow for fuzzy matching.
   * If only quantity/unit changes, updates the ingredient in place.
   */
  editIngredients: (oldIngredientId: number, newIngredient: string) => void;

  /** Adds an empty ingredient row to the recipe form */
  addNewIngredient: () => void;

  /**
   * Adds a validated ingredient to the recipe or merges its quantity if the same ingredient exists.
   * If the ingredient exists with the same unit, quantities are summed.
   * If units differ, the new ingredient replaces the existing one.
   */
  addOrMergeIngredient: (ingredient: ingredientTableElement) => void;
}

/**
 * React hook for managing ingredient operations in the Recipe screen.
 *
 * This hook provides three main operations:
 * - **editIngredients**: Updates an existing ingredient, triggering validation if the name changes
 * - **addNewIngredient**: Adds an empty ingredient row to the form
 * - **addOrMergeIngredient**: Adds a new ingredient or merges quantities if it already exists
 *
 * The hook handles the complexity of ingredient validation, fuzzy matching, and duplicate detection.
 * When an ingredient name is changed, it uses the validation queue system to suggest similar
 * ingredients from the database. For duplicate ingredients with matching units, quantities are
 * automatically summed together.
 *
 * @returns Object containing ingredient manipulation functions
 *
 * @example
 * ```tsx
 * const { editIngredients, addNewIngredient, addOrMergeIngredient } = useRecipeIngredients();
 *
 * // Add a new empty ingredient row
 * addNewIngredient();
 *
 * // Edit an ingredient (triggers validation if name changes)
 * editIngredients(0, '200g flour');
 *
 * // Add or merge a validated ingredient
 * addOrMergeIngredient({
 *   id: 1,
 *   name: 'flour',
 *   quantity: '100',
 *   unit: 'g',
 *   season: [],
 *   type: ''
 * });
 * ```
 */
export function useRecipeIngredients(): UseRecipeIngredientsReturn {
  const { findSimilarIngredients } = useRecipeDatabase();
  const { setValidationQueue } = useRecipeDialogs();
  const { state, setters } = useRecipeForm();
  const { recipeIngredients } = state;
  const { setRecipeIngredients } = setters;

  /**
   * Adds an ingredient to the recipe or merges quantities if it already exists.
   *
   * Performs case-insensitive name matching to detect duplicates. When a duplicate
   * is found with the same unit, quantities are summed. When units differ, the new
   * ingredient replaces the existing one entirely.
   *
   * @param ingredient - The validated ingredient to add or merge
   */
  const addOrMergeIngredient = (ingredient: ingredientTableElement) => {
    setRecipeIngredients(prev => {
      const existingIndex = prev.findIndex(
        existing => existing.name?.toLowerCase() === ingredient.name.toLowerCase()
      );

      if (existingIndex === -1) {
        return [...prev, ingredient];
      } else {
        const updated = [...prev];
        const existing = updated[existingIndex];

        if (!existing || !existing.name) {
          return prev;
        }

        if (existing.unit === ingredient.unit) {
          updated[existingIndex] = {
            ...existing,
            quantity: String(Number(existing.quantity || 0) + Number(ingredient.quantity || 0)),
          };
        } else {
          updated[existingIndex] = ingredient;
        }
        return updated;
      }
    });
  };

  /**
   * Edits an existing ingredient at the specified index.
   *
   * Parses the new ingredient string and determines the appropriate action:
   * - If the name changes, removes the old ingredient and triggers validation
   *   workflow to check for similar ingredients in the database
   * - If only quantity/unit changes, updates the ingredient in place
   *
   * @param oldIngredientId - Index of the ingredient to edit
   * @param newIngredient - Formatted ingredient string (e.g., "100|g - Rice")
   */
  const editIngredients = (oldIngredientId: number, newIngredient: string) => {
    if (oldIngredientId < 0 || oldIngredientId >= recipeIngredients.length) {
      recipeLogger.warn('Cannot edit ingredient - invalid index', {
        oldIngredientId,
        ingredientsCount: recipeIngredients.length,
      });
      return;
    }

    const {
      quantity: newQuantity,
      unit: newUnit,
      name: newName,
    } = parseIngredientString(newIngredient);

    /**
     * Updates an ingredient's properties in place without triggering validation.
     *
     * Used when only quantity or unit changes but the ingredient name remains the same.
     * Selectively updates only the fields that have changed.
     *
     * @param ingredient - The new ingredient data to apply
     */
    const updateIngredient = (ingredient: FormIngredientElement) => {
      const ingredientCopy: (ingredientTableElement | FormIngredientElement)[] =
        recipeIngredients.map(ing => ({ ...ing }));
      const foundIngredient = ingredientCopy[oldIngredientId];

      if (!foundIngredient) {
        return;
      }

      if (ingredient.id && foundIngredient.id !== ingredient.id) {
        foundIngredient.id = ingredient.id;
      }
      if (ingredient.name && foundIngredient.name !== ingredient.name) {
        foundIngredient.name = ingredient.name;
      }
      if (ingredient.unit && foundIngredient.unit !== ingredient.unit) {
        foundIngredient.unit = ingredient.unit;
      }
      if (ingredient.quantity && foundIngredient.quantity !== ingredient.quantity) {
        foundIngredient.quantity = ingredient.quantity;
      }
      if (
        ingredient.season &&
        ingredient.season.length > 0 &&
        foundIngredient.season !== ingredient.season
      ) {
        foundIngredient.season = ingredient.season;
      }
      if (ingredient.type && foundIngredient.type !== ingredient.type) {
        foundIngredient.type = ingredient.type;
      }

      setRecipeIngredients(ingredientCopy);
    };

    if (
      newName &&
      newName.trim().length > 0 &&
      recipeIngredients[oldIngredientId] &&
      recipeIngredients[oldIngredientId].name !== newName
    ) {
      setRecipeIngredients(recipeIngredients.filter((_, index) => index !== oldIngredientId));

      const { exactMatches, needsValidation } = processIngredientsForValidation(
        [
          {
            name: newName,
            unit: newUnit,
            quantity: newQuantity,
            season: [],
          },
        ],
        findSimilarIngredients
      );

      if (exactMatches.length > 0) {
        exactMatches.forEach(addOrMergeIngredient);
      }

      if (needsValidation.length > 0) {
        setValidationQueue({
          type: 'Ingredient',
          items: needsValidation,
          onValidated: addOrMergeIngredient,
        });
      }
    } else {
      updateIngredient({
        name: newName,
        unit: newUnit,
        quantity: newQuantity,
        season: [],
      });
    }
  };

  /**
   * Adds an empty ingredient row to the recipe form.
   *
   * Creates a new ingredient entry with only an empty name field, allowing
   * the user to fill in the details through the UI.
   */
  const addNewIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { name: '' }]);
  };

  return {
    editIngredients,
    addNewIngredient,
    addOrMergeIngredient,
  };
}
