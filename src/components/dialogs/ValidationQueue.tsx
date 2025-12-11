/**
 * ValidationQueue - Sequential validation component for tags OR ingredients
 *
 * Handles validation of multiple items of the same type one at a time, showing
 * similarity dialogs sequentially. Works with items from any source (OCR, manual
 * entry, bulk import, etc.) providing a consistent validation experience.
 *
 * Key Features:
 * - Sequential processing of single item type
 * - Similarity detection and resolution dialogs
 * - Duplicate prevention against existing items
 * - Item name prominence in dialogs
 * - Automatic progression through queue
 * - Callbacks for validated items
 *
 * Note: Only accepts tags OR ingredients, not both at the same time, since
 * the modal dialog blocks user interaction.
 *
 * @example
 * ```typescript
 * // For tags
 * <ValidationQueue
 *   type="Tag"
 *   items={ocrExtractedTags}
 *   onItemValidated={(tag) => setRecipeTags(prev => [...prev, tag])}
 *   onComplete={() => setTagQueue([])}
 *   existingItems={recipeTags}
 * />
 *
 * // For ingredients
 * <ValidationQueue
 *   type="Ingredient"
 *   items={ocrExtractedIngredients}
 *   onItemValidated={(ing) => setRecipeIngredients(prev => [...prev, ing])}
 *   onComplete={() => setIngredientQueue([])}
 *   existingItems={recipeIngredients}
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';
import {
  FormIngredientElement,
  ingredientTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { SimilarityDialog } from './SimilarityDialog';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
import { uiLogger } from '@utils/logger';
import { cleanIngredientName } from '@utils/FuzzySearch';

export type ValidationQueuePropsBase<T extends 'Tag' | 'Ingredient', ItemType, ValidatedType> = {
  type: T;
  items: ItemType[];
  onValidated: (item: ValidatedType) => void;
  onDismissed?: (item: ItemType) => void;
};

export type TagValidationProps = ValidationQueuePropsBase<'Tag', tagTableElement, tagTableElement>;
export type IngredientValidationProps = ValidationQueuePropsBase<
  'Ingredient',
  FormIngredientElement,
  ingredientTableElement
>;

export type ValidationQueueProps = { testId: string; onComplete: () => void } & (
  | TagValidationProps
  | IngredientValidationProps
);

export function ValidationQueue({
  type,
  items,
  onValidated,
  onDismissed,
  onComplete,
  testId,
}: ValidationQueueProps) {
  const { findSimilarTags, findSimilarIngredients } = useRecipeDatabase();

  const [remainingItems, setRemainingItems] = useState(items);
  const [showDialog, setShowDialog] = useState(false);

  const currentItem = remainingItems[0];
  const testIdQueue = testId + '::ValidationQueue';

  useEffect(() => {
    setRemainingItems(items);
  }, [items]);

  useEffect(() => {
    if (remainingItems.length === 0) {
      onComplete();
      return;
    }

    const itemName = currentItem?.name;
    if (!itemName || itemName.trim().length === 0) {
      setShowDialog(false);
      setRemainingItems(prev => prev.slice(1));
      return;
    }

    setShowDialog(true);
  }, [remainingItems, onComplete, currentItem]);

  const moveToNext = () => {
    setShowDialog(false);
    setRemainingItems(prev => prev.slice(1));
  };

  const handleItemValidated = (item: tagTableElement | ingredientTableElement) => {
    if (type === 'Ingredient') {
      const originalIngredient = currentItem as FormIngredientElement;
      const validatedIngredient = item as ingredientTableElement;
      const mergedIngredient: ingredientTableElement = {
        ...validatedIngredient,
        quantity: originalIngredient?.quantity || validatedIngredient.quantity,
      };
      // First remove the original ingredient (e.g., "Oignon"), then add the validated one (e.g., "Onions")
      onDismissed?.(originalIngredient);
      onValidated(mergedIngredient);
    } else {
      onValidated(item);
    }
    // Note: Don't call moveToNext() here - SimilarityDialog's onClose handles it
  };

  const handleDismiss = () => {
    if (type === 'Ingredient') {
      onDismissed?.(currentItem as FormIngredientElement);
    } else {
      onDismissed?.(currentItem as tagTableElement);
    }
    // Note: Don't call moveToNext() here - SimilarityDialog's onClose already handles it
  };

  if (remainingItems.length === 0 || !currentItem || !currentItem.name) {
    return null;
  }

  const itemName = currentItem.name;
  const similarItems =
    type === 'Tag' ? findSimilarTags(itemName) : findSimilarIngredients(itemName);
  const exactMatch = similarItems.find(item => item.name.toLowerCase() === itemName.toLowerCase());

  /**
   * Filters out ingredients that only match because their cleaned names are equal
   * but their full names are clearly different.
   *
   * Example: "cheddar (achat sous vide)" has cleaned name "cheddar" which matches
   * database ingredient "Cheddar", but since the full names differ, we skip the
   * similarity dialog and let the ingredient be added directly.
   *
   * This provides a smoother UX during scraping - the parenthetical details
   * (like "achat sous vide") indicate a distinct variant the user wants to add.
   * If the user later tries to manually add via ItemDialog, stricter validation
   * will block true duplicates.
   */
  const filterRelevantSimilarItems = () => {
    if (type === 'Tag') {
      return similarItems;
    }
    return similarItems.filter(item => {
      const cleanedItemName = cleanIngredientName(itemName).toLowerCase();
      const cleanedDbName = cleanIngredientName(item.name).toLowerCase();
      const isOnlyCleanedMatch = cleanedItemName === cleanedDbName;
      const isFullNameDifferent = item.name.toLowerCase() !== itemName.toLowerCase();
      if (isOnlyCleanedMatch && isFullNameDifferent) {
        return false;
      }
      return true;
    });
  };

  const relevantSimilarItems = filterRelevantSimilarItems();
  const similarItem = exactMatch || relevantSimilarItems[0];

  uiLogger.debug('ValidationQueue showing dialog', {
    type,
    itemName,
    similarItemsCount: similarItems.length,
    similarItemNames: similarItems.map(i => i.name),
    hasSimilarItem: !!similarItem,
    similarItemName: similarItem?.name,
    buttonLayout: similarItem ? 'Add/Use' : 'Cancel/Add',
  });

  return (
    <SimilarityDialog
      testId={testIdQueue + `::${type}`}
      isVisible={showDialog}
      onClose={moveToNext}
      item={
        type === 'Tag'
          ? {
              type: 'Tag',
              newItemName: itemName,
              similarItem: similarItem as tagTableElement,
              onConfirm: handleItemValidated,
              onUseExisting: handleItemValidated,
              onDismiss: handleDismiss,
            }
          : {
              type: 'Ingredient',
              newItemName: itemName,
              similarItem: similarItem as ingredientTableElement,
              onConfirm: handleItemValidated,
              onUseExisting: handleItemValidated,
              onDismiss: handleDismiss,
            }
      }
    />
  );
}

export default ValidationQueue;
