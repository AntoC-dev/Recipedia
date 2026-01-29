/**
 * ValidationQueue - Sequential validation component for tags OR ingredients
 *
 * Handles validation of multiple items of the same type one at a time, showing
 * similarity dialogs sequentially. Works with items from any source (OCR, manual
 * entry, bulk import, etc.) providing a consistent validation experience.
 *
 * Key Features:
 * - Sequential processing of single item type
 * - Pre-computed similarity info (no redundant database queries)
 * - Items sorted: "add new" first, then "choose existing"
 * - Item name prominence in dialogs
 * - Automatic progression through queue
 * - Callbacks for validated items
 *
 * Note: Only accepts tags OR ingredients, not both at the same time, since
 * the modal dialog blocks user interaction.
 *
 * Important: Items must be processed through `processTagsForValidation` or
 * `processIngredientsForValidation` before being passed to this component.
 * These functions attach pre-computed similarity info and handle sorting.
 *
 * @example
 * ```typescript
 * // Process tags first to get similarity info
 * const { needsValidation } = processTagsForValidation(tags, findSimilarTags);
 *
 * <ValidationQueue
 *   type="Tag"
 *   items={needsValidation}
 *   onItemValidated={(tag) => setRecipeTags(prev => [...prev, tag])}
 *   onComplete={() => setTagQueue([])}
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';
import { ingredientTableElement, tagTableElement } from '@customTypes/DatabaseElementTypes';
import { SimilarityDialog } from './SimilarityDialog';
import { uiLogger } from '@utils/logger';
import { normalizeKey } from '@utils/NutritionUtils';
import { IngredientWithSimilarity, TagWithSimilarity } from '@utils/RecipeValidationHelpers';

export type ValidationQueuePropsBase<T extends 'Tag' | 'Ingredient', ItemType, ValidatedType> = {
  type: T;
  items: ItemType[];
  onValidated: (originalItem: ItemType, validatedItem: ValidatedType) => void;
  onDismissed?: (item: ItemType) => void;
};

export type TagValidationProps = ValidationQueuePropsBase<
  'Tag',
  TagWithSimilarity,
  tagTableElement
>;
export type IngredientValidationProps = ValidationQueuePropsBase<
  'Ingredient',
  IngredientWithSimilarity,
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
      const originalIngredient = currentItem as IngredientWithSimilarity;
      const validatedIngredient = item as ingredientTableElement;
      const mergedIngredient: ingredientTableElement = {
        ...validatedIngredient,
        quantity: originalIngredient?.quantity || validatedIngredient.quantity,
        unit: validatedIngredient.unit,
        note: originalIngredient?.note,
      };
      onValidated(originalIngredient, mergedIngredient);
    } else {
      const originalTag = currentItem as TagWithSimilarity;
      onValidated(originalTag, item as tagTableElement);
    }
  };

  const handleDismiss = () => {
    if (type === 'Ingredient') {
      onDismissed?.(currentItem as IngredientWithSimilarity);
    } else {
      onDismissed?.(currentItem as TagWithSimilarity);
    }
  };

  if (remainingItems.length === 0 || !currentItem || !currentItem.name) {
    return null;
  }

  const itemName = currentItem.name;
  const similarItems = currentItem.similarItems;
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
