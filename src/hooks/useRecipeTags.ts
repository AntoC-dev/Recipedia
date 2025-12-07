/**
 * useRecipeTags - React hook for managing recipe tags with duplicate detection and similarity validation
 *
 * This hook provides tag management operations for the Recipe screen, including:
 * - Adding tags with fuzzy duplicate detection
 * - Removing tags from the recipe
 * - Handling exact and similar tag matches through validation queue
 * - Case-insensitive duplicate prevention
 *
 * @module hooks/useRecipeTags
 */

import { tagTableElement } from '@customTypes/DatabaseElementTypes';
import { processTagsForValidation } from '@utils/RecipeValidationHelpers';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
import { useRecipeDialogs } from '@context/RecipeDialogsContext';
import { useRecipeForm } from '@context/RecipeFormContext';

/**
 * Return value of the useRecipeTags hook containing tag management operations.
 *
 * @interface UseRecipeTagsReturn
 */
export interface UseRecipeTagsReturn {
  /** Adds a new tag with similarity checking and validation */
  addTag: (newTag: string) => void;
  /** Removes a tag from the recipe by its exact name */
  removeTag: (tagName: string) => void;
  /** Adds a tag only if it doesn't already exist (case-insensitive check) */
  addTagIfNotDuplicate: (tag: tagTableElement) => void;
}

/**
 * Custom hook for managing recipe tags with duplicate detection and validation.
 *
 * Provides three core operations:
 * - `addTag`: Processes new tags through similarity checking, exact match detection,
 *   and validation queue for fuzzy matches
 * - `removeTag`: Removes tags by exact name match
 * - `addTagIfNotDuplicate`: Safely adds tags with case-insensitive duplicate prevention
 *
 * The hook integrates with the validation queue system to prompt users when similar
 * tags are found in the database, helping maintain data consistency and prevent
 * duplicate entries with slight variations.
 *
 * @returns Object with tag management operations
 *
 * @example
 * ```tsx
 * const { addTag, removeTag, addTagIfNotDuplicate } = useRecipeTags();
 *
 * // Add a new tag with validation
 * addTag('Italian');
 *
 * // Remove a tag
 * removeTag('Italian');
 *
 * // Add a tag from validation without rechecking
 * addTagIfNotDuplicate({ name: 'Italian', id: 1 });
 * ```
 */
export function useRecipeTags(): UseRecipeTagsReturn {
  const { findSimilarTags } = useRecipeDatabase();
  const { setValidationQueue } = useRecipeDialogs();
  const { state, setters } = useRecipeForm();
  const { recipeTags } = state;
  const { setRecipeTags } = setters;

  /**
   * Adds a tag to the recipe only if it doesn't already exist.
   *
   * Performs case-insensitive duplicate checking before adding. This function
   * is typically called after validation to safely add tags without rechecking
   * similarity.
   *
   * @param tag - The validated tag element to add
   */
  const addTagIfNotDuplicate = (tag: tagTableElement) => {
    setRecipeTags(prev => {
      const isDuplicate = prev.some(
        existing => existing.name.toLowerCase() === tag.name.toLowerCase()
      );
      if (!isDuplicate) {
        return [...prev, tag];
      }
      return prev;
    });
  };

  /**
   * Adds a new tag with similarity checking and validation.
   *
   * Processes the tag through multiple validation steps:
   * 1. Rejects empty or whitespace-only tags
   * 2. Skips if the tag already exists in the recipe (case-insensitive)
   * 3. Checks database for exact matches (adds directly) or similar tags
   * 4. Queues similar tags for user validation before adding
   *
   * @param newTag - The tag name to add
   */
  const addTag = (newTag: string) => {
    if (!newTag || newTag.trim().length === 0) {
      return;
    }

    if (recipeTags.some(tag => tag.name.toLowerCase() === newTag.toLowerCase())) {
      return;
    }

    const { exactMatches, needsValidation } = processTagsForValidation(
      [{ name: newTag }],
      findSimilarTags
    );

    if (exactMatches.length > 0) {
      exactMatches.forEach(addTagIfNotDuplicate);
    }

    if (needsValidation.length > 0) {
      setValidationQueue({
        type: 'Tag',
        items: needsValidation,
        onValidated: addTagIfNotDuplicate,
      });
    }
  };

  /**
   * Removes a tag from the recipe by its exact name.
   *
   * Performs exact string matching (case-sensitive) to find and remove
   * the tag from the recipe's tag list.
   *
   * @param tagName - The exact name of the tag to remove
   */
  const removeTag = (tagName: string) => {
    setRecipeTags(recipeTags.filter(tagElement => tagElement.name !== tagName));
  };

  return {
    addTag,
    removeTag,
    addTagIfNotDuplicate,
  };
}
