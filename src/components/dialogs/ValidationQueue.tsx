/**
 * ValidationQueue - Sequential validation component for tags OR ingredients
 *
 * Handles validation of multiple items of the same type one at a time, showing
 * similarity dialogs sequentially. Works with items from any source (OCR, manual
 * entry, bulk import, etc.) providing a consistent validation experience.
 *
 * Key Features:
 * - Sequential processing of single item type
 * - Self-sufficient similarity computation (no pre-processing by callers)
 * - Items sorted: "add new" first, then "choose existing"
 * - Automatic exact-match handling without showing dialog
 * - After "Add New": re-computes similarity for remaining items (new DB item visible)
 * - After "Use Existing" or "Cancel": no re-computation
 * - Continuous dialog visibility between items (no close/open animation cycle)
 *
 * Note: Only accepts tags OR ingredients, not both at the same time, since
 * the modal dialog blocks user interaction.
 *
 * @module components/dialogs/ValidationQueue
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  FormIngredientElement,
  ingredientTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { SimilarityDialog } from './SimilarityDialog';
import { uiLogger } from '@utils/logger';
import { namesMatch } from '@utils/NutritionUtils';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';

// ─── Public types ────────────────────────────────────────────────────────────

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

// ─── Internal types ──────────────────────────────────────────────────────────

type QueueEntry = {
  item: tagTableElement | FormIngredientElement;
  similarItems: tagTableElement[] | ingredientTableElement[];
};

type DialogState = {
  itemName: string;
  similarItem: tagTableElement | ingredientTableElement | undefined;
  onClose: () => void;
  onConfirm: (item: tagTableElement | ingredientTableElement) => void;
  onUseExisting: (item: tagTableElement | ingredientTableElement) => void;
  onDismiss: () => void;
};

// ─── Pure helpers ────────────────────────────────────────────────────────────

function buildQueue(
  items: (tagTableElement | FormIngredientElement)[],
  findSimilar: (name: string) => tagTableElement[] | ingredientTableElement[]
): QueueEntry[] {
  const entries: QueueEntry[] = items.map(item => ({
    item,
    similarItems: item.name ? findSimilar(item.name) : [],
  }));
  return [
    ...entries.filter(e => e.similarItems.length === 0),
    ...entries.filter(e => e.similarItems.length > 0),
  ];
}

function mergeIngredient(
  original: FormIngredientElement,
  validated: ingredientTableElement
): ingredientTableElement {
  return {
    ...validated,
    quantity: original.quantity || validated.quantity,
    unit: validated.unit,
    note: original.note,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

function useValidationQueue({
  type,
  items,
  onValidated,
  onDismissed,
  onComplete,
}: Omit<ValidationQueueProps, 'testId'>): DialogState | null {
  const { findSimilarTags, findSimilarIngredients } = useRecipeDatabase();

  const findSimilarRef = useRef<(name: string) => tagTableElement[] | ingredientTableElement[]>(
    type === 'Tag' ? findSimilarTags : findSimilarIngredients
  );
  findSimilarRef.current = type === 'Tag' ? findSimilarTags : findSimilarIngredients;

  const [queue, setQueue] = useState<QueueEntry[]>(() => buildQueue(items, findSimilarRef.current));

  const needsRecomputeRef = useRef(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    setQueue(buildQueue(items, findSimilarRef.current));
  }, [items]);

  useEffect(() => {
    if (queue.length === 0) {
      onComplete();
      return;
    }

    const { item, similarItems } = queue[0];

    if (!item.name?.trim()) {
      setQueue(prev => prev.slice(1));
      return;
    }

    const exactMatch = (similarItems as { name: string }[]).find(s =>
      namesMatch(s.name, item.name!)
    );

    if (!exactMatch) return;

    if (type === 'Ingredient') {
      (onValidated as IngredientValidationProps['onValidated'])(
        item as FormIngredientElement,
        mergeIngredient(item as FormIngredientElement, exactMatch as ingredientTableElement)
      );
    } else {
      (onValidated as TagValidationProps['onValidated'])(
        item as tagTableElement,
        exactMatch as tagTableElement
      );
    }
    setQueue(prev => prev.slice(1));
  }, [queue, onComplete, onValidated, type]);

  const currentEntry = queue[0];

  if (!currentEntry?.item.name?.trim()) return null;

  const itemName = currentEntry.item.name;
  const similarItems = currentEntry.similarItems as (tagTableElement | ingredientTableElement)[];
  const exactMatch = similarItems.find(s => namesMatch(s.name, itemName));

  if (exactMatch) return null;

  const handleItemValidated = (validated: tagTableElement | ingredientTableElement) => {
    if (type === 'Ingredient') {
      const original = currentEntry.item as FormIngredientElement;
      (onValidated as IngredientValidationProps['onValidated'])(
        original,
        mergeIngredient(original, validated as ingredientTableElement)
      );
    } else {
      (onValidated as TagValidationProps['onValidated'])(
        currentEntry.item as tagTableElement,
        validated as tagTableElement
      );
    }
  };

  const moveToNext = () => {
    if (needsRecomputeRef.current) {
      needsRecomputeRef.current = false;
      setQueue(prev =>
        prev.slice(1).map(({ item }) => ({
          item,
          similarItems: item.name ? findSimilarRef.current(item.name) : [],
        }))
      );
    } else {
      setQueue(prev => prev.slice(1));
    }
  };

  uiLogger.debug('ValidationQueue showing dialog', {
    type,
    itemName,
    similarItemsCount: similarItems.length,
    hasSimilarItem: similarItems.length > 0,
    similarItemName: similarItems[0]?.name,
    buttonLayout: similarItems.length > 0 ? 'Add/Use' : 'Cancel/Add',
  });

  return {
    itemName,
    similarItem: similarItems[0],
    onClose: moveToNext,
    onConfirm: item => {
      handleItemValidated(item);
      needsRecomputeRef.current = true;
    },
    onUseExisting: handleItemValidated,
    onDismiss: () => {
      onDismissed?.(currentEntry.item as tagTableElement & FormIngredientElement);
    },
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ValidationQueue({ testId, ...props }: ValidationQueueProps) {
  const dialog = useValidationQueue(props);

  if (!dialog) return null;

  const { type } = props;
  const { itemName, similarItem, onClose, onConfirm, onUseExisting, onDismiss } = dialog;

  return (
    <SimilarityDialog
      testId={`${testId}::ValidationQueue::${type}`}
      isVisible={true}
      onClose={onClose}
      item={
        type === 'Tag'
          ? {
              type: 'Tag',
              newItemName: itemName,
              similarItem: similarItem as tagTableElement,
              onConfirm,
              onUseExisting,
              onDismiss,
            }
          : {
              type: 'Ingredient',
              newItemName: itemName,
              similarItem: similarItem as ingredientTableElement,
              onConfirm,
              onUseExisting,
              onDismiss,
            }
      }
    />
  );
}

export default ValidationQueue;
