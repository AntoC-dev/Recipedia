/**
 * useRecipePreparation - Recipe preparation step management hook
 *
 * This hook provides operations for managing preparation steps in the Recipe screen.
 * It handles editing step titles and descriptions, and adding new preparation steps.
 * All operations include validation and logging for invalid step indices.
 *
 * @example
 * ```typescript
 * const { editPreparationTitle, editPreparationDescription, addNewPreparationStep } =
 *   useRecipePreparation();
 *
 * // Update step title
 * editPreparationTitle(0, "Prep the ingredients");
 *
 * // Update step description
 * editPreparationDescription(1, "Heat pan over medium heat and cook for 10 minutes");
 *
 * // Add a new empty step
 * addNewPreparationStep();
 * ```
 */

import { recipeLogger } from '@utils/logger';
import { useRecipeForm } from '@context/RecipeFormContext';

/**
 * Return value from the useRecipePreparation hook
 */
export interface UseRecipePreparationReturn {
  /** Updates the title of a preparation step at the specified index */
  editPreparationTitle: (stepIndex: number, newTitle: string) => void;
  /** Updates the description of a preparation step at the specified index */
  editPreparationDescription: (stepIndex: number, newDescription: string) => void;
  /** Adds a new empty preparation step to the end of the list */
  addNewPreparationStep: () => void;
}

/**
 * Custom hook for managing recipe preparation steps
 *
 * Provides functions to edit preparation step titles and descriptions, and to add
 * new steps. All edit operations validate the step index and log warnings for
 * invalid indices.
 *
 * @returns Object with preparation step management functions
 */
export function useRecipePreparation(): UseRecipePreparationReturn {
  const { state, setters } = useRecipeForm();
  const { recipePreparation } = state;
  const { setRecipePreparation } = setters;

  /**
   * Updates the title of a preparation step at the specified index.
   *
   * Validates the index before updating. If the index is out of bounds,
   * logs a warning and returns without making changes.
   *
   * @param stepIndex - Zero-based index of the step to update
   * @param newTitle - The new title text for the step
   */
  const editPreparationTitle = (stepIndex: number, newTitle: string) => {
    if (stepIndex < 0 || stepIndex >= recipePreparation.length) {
      recipeLogger.warn('Cannot edit preparation step title - invalid index', {
        stepIndex,
        preparationCount: recipePreparation.length,
      });
      return;
    }
    const updatedPreparation = [...recipePreparation];
    updatedPreparation[stepIndex] = { ...updatedPreparation[stepIndex], title: newTitle };
    setRecipePreparation(updatedPreparation);
  };

  /**
   * Updates the description of a preparation step at the specified index.
   *
   * Validates the index before updating. If the index is out of bounds,
   * logs a warning and returns without making changes.
   *
   * @param stepIndex - Zero-based index of the step to update
   * @param newDescription - The new description text for the step
   */
  const editPreparationDescription = (stepIndex: number, newDescription: string) => {
    if (stepIndex < 0 || stepIndex >= recipePreparation.length) {
      recipeLogger.warn('Cannot edit preparation step description - invalid index', {
        stepIndex,
        preparationCount: recipePreparation.length,
      });
      return;
    }
    const updatedPreparation = [...recipePreparation];
    updatedPreparation[stepIndex] = {
      ...updatedPreparation[stepIndex],
      description: newDescription,
    };
    setRecipePreparation(updatedPreparation);
  };

  /**
   * Adds a new empty preparation step to the end of the list.
   *
   * Creates a step with empty title and description fields, allowing
   * the user to fill in the details through the UI.
   */
  const addNewPreparationStep = () => {
    setRecipePreparation([...recipePreparation, { title: '', description: '' }]);
  };

  return {
    editPreparationTitle,
    editPreparationDescription,
    addNewPreparationStep,
  };
}
