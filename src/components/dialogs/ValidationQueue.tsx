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
 * Important: Items that would be blocked by ItemDialog's duplicate detection
 * (e.g., ingredients whose cleaned names match existing database entries)
 * should be filtered upstream by `processIngredientsForValidation` before
 * being passed to this component. This prevents showing dialogs that lead
 * to dead ends where the user cannot proceed.
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
import { normalizeKey } from '@utils/NutritionUtils';

export type ValidationQueuePropsBase<T extends 'Tag' | 'Ingredient', ItemType, ValidatedType> = {
  type: T;
  items: ItemType[];
  onValidated: (originalItem: ItemType, validatedItem: ValidatedType) => void;
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
        unit: validatedIngredient.unit,
        note: originalIngredient?.note,
      };
      onValidated(originalIngredient, mergedIngredient);
    } else {
      const originalTag = currentItem as tagTableElement;
      onValidated(originalTag, item as tagTableElement);
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
  const exactMatch = similarItems.find(item => normalizeKey(item.name) === normalizeKey(itemName));
  const similarItem = exactMatch || similarItems[0];

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
