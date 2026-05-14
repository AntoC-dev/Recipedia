/**
 * ValidationQueue - Sequential validation component for tags OR ingredients
 *
 * Displays pre-computed validation items one at a time via SimilarityDialog.
 * Items arrive pre-sorted and pre-filtered by callers (new items first, similar
 * items last, exnpm -vact matches already handled).
 *
 * After "Add New": checks remaining queue items for name matches with the newly
 * added element and auto-validates them (O(n) name comparison, no fuzzy search).
 *
 * @module components/dialogs/ValidationQueue
 */

import React, { useEffect, useRef, useState } from 'react';
import { ingredientTableElement, tagTableElement } from '@customTypes/DatabaseElementTypes';
import { IngredientWithSimilarity, TagWithSimilarity } from '@customTypes/ValidationTypes';
import { mergeIngredient } from '@utils/RecipeValidationHelpers';
import { SimilarityDialog } from './SimilarityDialog';
import { uiLogger } from '@utils/logger';
import { namesMatch } from '@utils/NutritionUtils';

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
  testId,
  type,
  items,
  onValidated,
  onDismissed,
  onComplete,
}: ValidationQueueProps) {
  type QueueItem = TagWithSimilarity | IngredientWithSimilarity;
  const [queue, setQueue] = useState<QueueItem[]>(items as QueueItem[]);
  const lastValidatedRef = useRef<tagTableElement | ingredientTableElement | null>(null);

  useEffect(() => {
    if (queue.length === 0) {
      onComplete();
    }
  }, [queue.length, onComplete]);

  if (queue.length === 0) return null;

  const currentItem = queue[0];
  const itemName = currentItem.name!;
  const similarItem = currentItem.similarItems[0] as
    | tagTableElement
    | ingredientTableElement
    | undefined;

  uiLogger.debug('ValidationQueue showing dialog', {
    type,
    itemName,
    hasSimilarItem: !!similarItem,
    similarItemName: similarItem?.name,
    remainingCount: queue.length,
  });

  const validateItem = (item: QueueItem, validated: tagTableElement | ingredientTableElement) => {
    if (type === 'Ingredient') {
      (onValidated as IngredientValidationProps['onValidated'])(
        item as IngredientWithSimilarity,
        mergeIngredient(item as IngredientWithSimilarity, validated as ingredientTableElement)
      );
    } else {
      (onValidated as TagValidationProps['onValidated'])(
        item as TagWithSimilarity,
        validated as tagTableElement
      );
    }
  };

  const handleConfirm = (validated: tagTableElement | ingredientTableElement) => {
    validateItem(currentItem, validated);
    lastValidatedRef.current = validated;
  };

  const handleUseExisting = (validated: tagTableElement | ingredientTableElement) => {
    validateItem(currentItem, validated);
  };

  const handleDismiss = () => {
    onDismissed?.(currentItem as TagWithSimilarity & IngredientWithSimilarity);
  };

  const moveToNext = () => {
    const lastValidated = lastValidatedRef.current;
    lastValidatedRef.current = null;

    if (lastValidated) {
      const remaining = queue.slice(1);
      for (const item of remaining) {
        if (namesMatch(item.name, lastValidated.name)) {
          validateItem(item, lastValidated);
        }
      }
      setQueue(remaining.filter(item => !namesMatch(item.name, lastValidated.name)));
    } else {
      setQueue(prev => prev.slice(1));
    }
  };

  return (
    <SimilarityDialog
      testId={`${testId}::ValidationQueue::${type}`}
      isVisible={true}
      onClose={moveToNext}
      item={
        type === 'Tag'
          ? {
              type: 'Tag',
              newItemName: itemName,
              similarItem: similarItem as tagTableElement,
              onConfirm: handleConfirm,
              onUseExisting: handleUseExisting,
              onDismiss: handleDismiss,
            }
          : {
              type: 'Ingredient',
              newItemName: itemName,
              similarItem: similarItem as ingredientTableElement,
              onConfirm: handleConfirm,
              onUseExisting: handleUseExisting,
              onDismiss: handleDismiss,
            }
      }
    />
  );
}

export default ValidationQueue;
