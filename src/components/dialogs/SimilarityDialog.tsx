/**
 * SimilarityDialog - Smart duplicate detection and resolution dialog
 *
 * An intelligent dialog that detects potential duplicates when adding new tags or
 * ingredients and guides users through resolution options. Features automatic similarity
 * matching, database integration, and seamless item creation workflows.
 *
 * Key Features:
 * - Automatic similarity detection for tags and ingredients
 * - Dual-mode operation: similarity resolution vs new item creation
 * - Integrated ItemDialog for detailed item creation
 * - Database integration with automatic item persistence
 * - Type-safe discriminated unions for tags vs ingredients
 * - Comprehensive internationalization support
 * - Smart action flows based on similarity results
 *
 * Resolution Options:
 * - **Use Existing**: Select similar item found in database
 * - **Add New**: Create new item despite similarity
 * - **Edit & Add**: Modify details before adding new item
 * - **Cancel**: Dismiss without action
 *
 * @example
 * ```typescript
 * // Tag similarity detection
 * <SimilarityDialog
 *   testId="tag-similarity"
 *   isVisible={showTagDialog}
 *   onClose={() => setShowTagDialog(false)}
 *   item={{
 *     type: 'Tag',
 *     newItemName: 'vegeterian', // Note the typo
 *     similarItem: existingVegetarianTag,
 *     onConfirm: (tag) => addTagToRecipe(tag),
 *     onUseExisting: (tag) => addTagToRecipe(tag)
 *   }}
 * />
 *
 * // Ingredient similarity detection
 * <SimilarityDialog
 *   testId="ingredient-similarity"
 *   isVisible={showIngredientDialog}
 *   onClose={() => setShowIngredientDialog(false)}
 *   item={{
 *     type: 'Ingredient',
 *     newItemName: 'tomatoe', // Note the typo
 *     similarItem: existingTomatoIngredient,
 *     onConfirm: (ingredient) => addIngredientToRecipe(ingredient),
 *     onUseExisting: (ingredient) => addIngredientToRecipe(ingredient),
 *     onDismiss: () => removeIncompleteIngredient()
 *   }}
 * />
 * ```
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { databaseLogger } from '@utils/logger';
import { ingredientTableElement, tagTableElement } from '@customTypes/DatabaseElementTypes';
import { DialogMode, ItemDialog } from './ItemDialog';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';

/** Configuration for tag similarity resolution */
export type SimilarityTagType = {
  type: 'Tag';
  /** Name of the new tag being added */
  newItemName: string;
  /** Optional similar tag found in database */
  similarItem?: tagTableElement;
  /** Callback fired when new tag is confirmed */
  onConfirm: (tag: tagTableElement) => void;
  /** Optional callback fired when existing similar tag is selected */
  onUseExisting?: (tag: tagTableElement) => void;
  /** Optional callback fired when dialog is dismissed */
  onDismiss?: () => void;
};

/** Configuration for ingredient similarity resolution */
export type SimilarityIngredientType = {
  type: 'Ingredient';
  /** Name of the new ingredient being added */
  newItemName: string;
  /** Optional similar ingredient found in database */
  similarItem?: ingredientTableElement;
  /** Callback fired when new ingredient is confirmed */
  onConfirm: (ingredient: ingredientTableElement) => void;
  /** Optional callback fired when existing similar ingredient is selected */
  onUseExisting?: (ingredient: ingredientTableElement) => void;
  /** Optional callback fired when dialog is dismissed */
  onDismiss?: () => void;
};

/**
 * Props for the SimilarityDialog component
 */
export type SimilarityDialogProps = {
  /** Unique identifier for testing and accessibility */
  testId: string;
  /** Whether the dialog is currently visible */
  isVisible: boolean;
  /** Callback fired when dialog is closed */
  onClose: () => void;
  /** Item configuration with type-specific options */
  item: SimilarityTagType | SimilarityIngredientType;
};

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

/**
 * SimilarityDialog component for smart duplicate detection and resolution
 *
 * @param props - The component props with similarity detection configuration
 * @returns JSX element representing an intelligent similarity resolution dialog
 */
export function SimilarityDialog({ testId, isVisible, onClose, item }: SimilarityDialogProps) {
  const { t } = useI18n();
  const { addIngredient, addTag } = useRecipeDatabase();
  const [showItemDialog, setShowItemDialog] = useState(false);

  const handleAddNew = () => {
    setShowItemDialog(true);
  };

  const handleUseExisting = () => {
    if (item.similarItem && item.onUseExisting) {
      if (item.type === 'Ingredient') {
        item.onUseExisting(item.similarItem as ingredientTableElement);
      } else {
        item.onUseExisting(item.similarItem as tagTableElement);
      }
    }
    onClose();
  };

  const handleDismiss = () => {
    if (item.onDismiss) {
      item.onDismiss();
    }
    onClose();
  };

  /**
   * Handles confirmation of new item creation with database persistence and type safety
   *
   * This function manages the complex process of creating new ingredients or tags
   * when the user chooses to add a completely new item rather than selecting
   * from similar existing items. It handles database operations, type discrimination,
   * and UI state management.
   *
   * @param mode - Dialog mode ('add' for new items, other modes bypass database operations)
   * @param newItem - Either ingredientTableElement or tagTableElement to be added
   *
   * Type-Safe Processing:
   * - Uses type discrimination to handle ingredient vs tag creation
   * - Properly casts union types for database operations
   * - Ensures callback functions receive correctly typed items
   *
   * Database Operations:
   * - Adds new ingredient to database with proper categorization
   * - Adds new tag to database for future similarity matching
   * - Only performs database operations in 'add' mode
   *
   * State Management:
   * - Closes item creation dialog
   * - Closes similarity dialog
   * - Calls parent callback with new item data
   *
   * Error Handling:
   * - Async database operations with proper error propagation
   * - Type-safe operations prevent runtime type errors
   *
   * Side Effects:
   * - Updates database with new item
   * - Triggers parent component callback
   * - Closes dialog and returns to parent screen
   *
   * @async
   * @returns Promise<void> - Resolves when all operations complete
   */
  const handleItemDialogConfirm = async (
    mode: DialogMode,
    newItem: ingredientTableElement | tagTableElement
  ) => {
    if (mode === 'add') {
      try {
        if (item.type === 'Ingredient') {
          const createdIngredient = await addIngredient(newItem as ingredientTableElement);
          item.onConfirm(createdIngredient);
        } else {
          const createdTag = await addTag(newItem as tagTableElement);
          item.onConfirm(createdTag);
        }
      } catch (error) {
        databaseLogger.error('Failed to add item to database', {
          itemName: newItem.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    setShowItemDialog(false);
    onClose();
  };

  const modalTestId = `${testId}::SimilarityDialog`;
  const ingredientsTranslationPrefix = 'alerts.ingredientSimilarity.';
  const tagsTranslationPrefix = 'alerts.tagSimilarity.';

  const title = item.similarItem
    ? item.type === 'Ingredient'
      ? t(ingredientsTranslationPrefix + 'similarIngredientFound')
      : t(tagsTranslationPrefix + 'similarTagFound')
    : item.type === 'Ingredient'
      ? t(ingredientsTranslationPrefix + 'newIngredientTitle')
      : t(tagsTranslationPrefix + 'newTagTitle');

  const content = item.similarItem
    ? item.type === 'Ingredient'
      ? t(ingredientsTranslationPrefix + 'similarIngredientFoundContent', {
          existingIngredient: item.similarItem.name,
        })
      : t(tagsTranslationPrefix + 'similarTagFoundContent', { existingTag: item.similarItem.name })
    : item.type === 'Ingredient'
      ? t(ingredientsTranslationPrefix + 'newIngredientContent', {
          ingredientName: item.newItemName,
        })
      : t(tagsTranslationPrefix + 'newTagContent', { tagName: item.newItemName });

  return (
    <Portal>
      <Dialog visible={isVisible} onDismiss={handleDismiss}>
        <Dialog.Title testID={`${modalTestId}::Title`}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text testID={`${modalTestId}::Content`} variant='bodyMedium'>
            {content}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          {item.similarItem ? (
            <View style={styles.actionButton}>
              <Button testID={`${modalTestId}::AddButton`} mode='outlined' onPress={handleAddNew}>
                {item.type === 'Ingredient'
                  ? t(ingredientsTranslationPrefix + 'add')
                  : t(tagsTranslationPrefix + 'add')}
              </Button>
              <Button
                testID={`${modalTestId}::UseButton`}
                mode='contained'
                onPress={handleUseExisting}
              >
                {item.type === 'Ingredient'
                  ? t(ingredientsTranslationPrefix + 'use')
                  : t(tagsTranslationPrefix + 'use')}
              </Button>
            </View>
          ) : (
            <View style={styles.actionButton}>
              <Button
                testID={`${modalTestId}::CancelButton`}
                mode='outlined'
                onPress={handleDismiss}
              >
                {item.type === 'Ingredient'
                  ? t(ingredientsTranslationPrefix + 'cancel')
                  : t('cancel')}
              </Button>
              <Button testID={`${modalTestId}::AddButton`} mode='contained' onPress={handleAddNew}>
                {item.type === 'Ingredient'
                  ? t(ingredientsTranslationPrefix + 'add')
                  : t(tagsTranslationPrefix + 'add')}
              </Button>
            </View>
          )}
        </Dialog.Actions>
      </Dialog>

      {/* ItemDialog for creating new items */}
      {showItemDialog && (
        <ItemDialog
          testId={`${testId}::ItemDialog`}
          isVisible={showItemDialog}
          mode='add'
          onClose={() => setShowItemDialog(false)}
          item={
            item.type === 'Ingredient'
              ? {
                  type: item.type,
                  value: {
                    name: item.newItemName,
                  },
                  onConfirmIngredient: (mode: DialogMode, newItem: ingredientTableElement) =>
                    handleItemDialogConfirm(mode, newItem),
                }
              : {
                  type: item.type,
                  value: {
                    id: -1,
                    name: item.newItemName,
                  },
                  onConfirmTag: (mode: DialogMode, newItem: tagTableElement) =>
                    handleItemDialogConfirm(mode, newItem),
                }
          }
        />
      )}
    </Portal>
  );
}

export default SimilarityDialog;
