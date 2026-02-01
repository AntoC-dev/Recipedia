/**
 * ItemDialog - Comprehensive CRUD dialog for ingredients and tags
 *
 * A unified, multi-purpose dialog component that handles all CRUD operations
 * (Create, Read, Update, Delete) for both ingredients and tags. Features dynamic
 * form fields, validation, and specialized inputs for different item types.
 *
 * Key Features:
 * - Unified interface for both ingredients and tags
 * - Three operation modes: add, edit, delete
 * - Dynamic form adaptation based on item type and mode
 * - Comprehensive ingredient management (name, type, unit, seasonality)
 * - Simple tag management (name-based)
 * - Real-time validation and user feedback
 * - Seasonality calendar integration for ingredients
 * - Type categorization with dropdown selection
 * - Internationalization support throughout
 *
 * Form Fields by Type:
 *
 * **Ingredients:**
 * - Name (required text input)
 * - Type (dropdown: vegetables, proteins, dairy, etc.)
 * - Unit (text input: cups, grams, pieces, etc.)
 * - Seasonality (interactive month calendar)
 *
 * **Tags:**
 * - Name (required text input)
 *
 * @example
 * ```typescript
 * // Add new ingredient
 * <ItemDialog
 *   testId="add-ingredient"
 *   isVisible={showAddDialog}
 *   mode="add"
 *   onClose={() => setShowAddDialog(false)}
 *   item={{
 *     type: 'Ingredient',
 *     value: newIngredientTemplate,
 *     onConfirmIngredient: (mode, ingredient) => handleAddIngredient(ingredient)
 *   }}
 * />
 *
 * // Edit existing tag
 * <ItemDialog
 *   testId="edit-tag"
 *   isVisible={showEditDialog}
 *   mode="edit"
 *   onClose={() => setShowEditDialog(false)}
 *   item={{
 *     type: 'Tag',
 *     value: selectedTag,
 *     onConfirmTag: (mode, tag) => handleUpdateTag(tag)
 *   }}
 * />
 *
 * // Delete confirmation
 * <ItemDialog
 *   testId="delete-ingredient"
 *   isVisible={showDeleteDialog}
 *   mode="delete"
 *   onClose={() => setShowDeleteDialog(false)}
 *   item={{
 *     type: 'Ingredient',
 *     value: ingredientToDelete,
 *     onConfirmIngredient: (mode, ingredient) => handleDeleteIngredient(ingredient)
 *   }}
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Menu, Portal, Text } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { CustomTextInput } from '@components/atomic/CustomTextInput';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
import { cleanIngredientName, FuzzyMatchLevel, fuzzySearch } from '@utils/FuzzySearch';
import {
  FormIngredientElement,
  ingredientTableElement,
  ingredientType,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { shoppingCategories } from '@customTypes/RecipeFiltersTypes';
import { padding } from '@styles/spacing';
import { SeasonalityCalendar } from '@components/molecules/SeasonalityCalendar';
import { uiLogger } from '@utils/logger';

/** Available dialog operation modes */
export type DialogMode = 'add' | 'edit' | 'delete';

/** Configuration for ingredient dialogs */
export type ItemIngredientType = {
  type: 'Ingredient';
  /** Current ingredient data (may have optional fields for new/incomplete ingredients) */
  value: FormIngredientElement;
  /** Callback fired when ingredient operation is confirmed */
  onConfirmIngredient: (mode: DialogMode, newItem: ingredientTableElement) => void;
};

/** Configuration for tag dialogs */
export type ItemTagType = {
  type: 'Tag';
  /** Current tag data */
  value: tagTableElement;
  /** Callback fired when tag operation is confirmed */
  onConfirmTag: (mode: DialogMode, newItem: tagTableElement) => void;
};

/**
 * Props for the ItemDialog component
 */
export type ItemDialogProps = {
  /** Unique identifier for testing and accessibility */
  testId: string;
  /** Whether the dialog is currently visible */
  isVisible: boolean;
  /** Current operation mode (add, edit, delete) */
  mode: DialogMode;
  /** Callback fired when dialog is closed */
  onClose: () => void;
  /** Item configuration with type-specific properties */
  item: ItemIngredientType | ItemTagType;
};

/**
 * ItemDialog component for comprehensive item CRUD operations
 *
 * @param props - The component props with operation configuration
 * @returns JSX element representing a multi-purpose item management dialog
 */
export function ItemDialog({ onClose, isVisible, testId, mode, item }: ItemDialogProps) {
  const { t } = useI18n();
  const { tags, ingredients } = useRecipeDatabase();

  type ValidationState = 'none' | 'duplicate' | 'similar';

  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>('none');
  const [helperMessage, setHelperMessage] = useState('');

  const [itemName, setItemName] = useState(item.value.name ?? '');
  const [ingType, setIngType] = useState<ingredientType | undefined>(
    item.type === 'Ingredient' ? item.value.type : undefined
  );
  const [ingUnit, setIngUnit] = useState(item.type === 'Ingredient' ? (item.value.unit ?? '') : '');
  const [ingSeason, setIngSeason] = useState(
    item.type === 'Ingredient' ? (item.value.season ?? []) : []
  );

  useEffect(() => {
    if (isVisible) {
      setItemName(item.value.name ?? '');
      if (item.type === 'Ingredient') {
        setIngType(item.value.type);
        setIngUnit(item.value.unit ?? '');
        setIngSeason(item.value.season ?? []);
      }
    }
  }, [item.value.name, item.type, item.value, isVisible]);

  /**
   * Validates item name against database for duplicates and similar items.
   *
   * For ingredients, uses cleaned names (without parenthetical content) for matching.
   * Any exact match on cleaned name is treated as a duplicate and blocks submission.
   * This ensures "cheddar (achat sous vide)" is blocked when "Cheddar" exists,
   * since they represent the same base ingredient.
   *
   * Note: ValidationQueue handles the automatic scraping flow differently by
   * skipping the dialog for cleaned-name-only matches. This stricter validation
   * applies when users manually create items via ItemDialog.
   */
  useEffect(() => {
    if (!isVisible || mode === 'delete') {
      setValidationState('none');
      setHelperMessage('');
      return;
    }

    const trimmedName = itemName.trim();
    if (!trimmedName) {
      setValidationState('none');
      setHelperMessage('');
      return;
    }

    const timeoutId = setTimeout(() => {
      const messageKeys =
        item.type === 'Tag'
          ? { duplicate: 'tag_already_exists', similar: 'similar_tags_exist' }
          : { duplicate: 'ingredient_already_exists', similar: 'similar_ingredients_exist' };

      const result =
        item.type === 'Tag'
          ? fuzzySearch<tagTableElement>(tags, trimmedName, t => t.name, FuzzyMatchLevel.MODERATE)
          : fuzzySearch<ingredientTableElement>(
              ingredients,
              cleanIngredientName(trimmedName),
              ing => cleanIngredientName(ing.name),
              FuzzyMatchLevel.MODERATE
            );

      if (result.exact) {
        const isSameElement = item.value.id !== undefined && result.exact.id === item.value.id;
        if (isSameElement) {
          setValidationState('none');
          setHelperMessage('');
        } else {
          setValidationState('duplicate');
          setHelperMessage(t(messageKeys.duplicate));
        }
      } else {
        const otherSimilar = result.similar.filter(
          similarItem => !item.value.id || similarItem.id !== item.value.id
        );

        if (otherSimilar.length > 0) {
          const names = otherSimilar.map(similarItem => similarItem.name).join(', ');
          setValidationState('similar');
          setHelperMessage(`${t(messageKeys.similar)}: ${names}`);
        } else {
          setValidationState('none');
          setHelperMessage('');
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [itemName, item.type, item.value.id, isVisible, mode, tags, ingredients, t]);

  const handleDismiss = () => {
    onClose();
  };

  const handleConfirm = () => {
    callOnConfirmWithNewItem();
    onClose();
  };

  const callOnConfirmWithNewItem = () => {
    switch (item.type) {
      case 'Ingredient':
        item.onConfirmIngredient(mode, {
          id: item.value.id,
          name: itemName,
          type: ingType as ingredientType,
          unit: ingUnit,
          season: ingSeason,
        });
        break;
      case 'Tag':
        item.onConfirmTag(mode, { id: item.value.id, name: itemName });
        break;
      default:
        uiLogger.error('Unreachable code in ItemDialog');
    }
  };

  const isConfirmButtonDisabled = () => {
    if (!itemName.trim()) {
      return true;
    }

    if (mode === 'delete') {
      return false;
    }

    if (validationState === 'duplicate') {
      return true;
    }

    if (item.type === 'Ingredient') {
      return ingType === undefined;
    }

    return false;
  };

  // Get dialog properties based on the current mode
  const dialogTitle = (() => {
    switch (mode) {
      case 'add':
        return item.type === 'Ingredient' ? t('add_ingredient') : t('add_tag');
      case 'edit':
        return item.type === 'Ingredient' ? t('edit_ingredient') : t('edit_tag');
      case 'delete':
        return t('delete');
      default:
        uiLogger.error('Unreachable code in ItemDialog');
        return '';
    }
  })();

  const confirmButtonText = (() => {
    switch (mode) {
      case 'add':
        return t('add');
      case 'edit':
        return t('save');
      case 'delete':
        return t('delete');
      default:
        uiLogger.error('Unreachable code in ItemDialog');
        return '';
    }
  })();
  const modalTestId = (() => {
    switch (mode) {
      case 'add':
        return testId + '::AddModal';
      case 'edit':
        return testId + '::EditModal';
      case 'delete':
        return testId + '::DeleteModal';
      default:
        uiLogger.error('Unreachable code in ItemDialog');
        return '';
    }
  })();

  return (
    <Portal>
      <Dialog visible={isVisible} onDismiss={handleDismiss}>
        <Dialog.Title testID={modalTestId + '::Title'}>{dialogTitle}</Dialog.Title>
        <Dialog.Content>
          {mode === 'delete' ? (
            <Text testID={modalTestId + '::Text'} variant='bodyMedium'>
              {t('confirmDelete')}
              {` ${itemName}${t('interrogationMark')}`}
            </Text>
          ) : (
            <View>
              <CustomTextInput
                label={item.type === 'Ingredient' ? t('ingredient_name') : t('tag_name')}
                value={itemName}
                onChangeText={setItemName}
                testID={modalTestId + '::Name'}
                error={validationState === 'duplicate'}
              />
              <HelperText
                type={validationState === 'duplicate' ? 'error' : 'info'}
                visible={validationState !== 'none'}
                testID={modalTestId + '::HelperText'}
              >
                {helperMessage}
              </HelperText>
              {item.type === 'Ingredient' ? (
                <View>
                  <View style={styles.inputRow}>
                    <Text
                      testID={modalTestId + '::Type'}
                      variant='bodyMedium'
                      style={styles.inputLabel}
                    >
                      {t('type')}:
                    </Text>
                    <Menu
                      testID={modalTestId + '::Menu'}
                      visible={typeMenuVisible}
                      onDismiss={() => setTypeMenuVisible(false)}
                      anchor={
                        <Button
                          testID={modalTestId + '::Menu::Button'}
                          onPress={() => setTypeMenuVisible(true)}
                        >
                          {ingType ? t(ingType) : t('selectType')}
                        </Button>
                      }
                    >
                      {/* Using .map() instead of FlatList: FlatList (VirtualizedList) cannot be nested
                          inside Dialog's ScrollView without breaking windowing. For small fixed arrays
                          like shoppingCategories, .map() is the correct pattern. */}
                      {shoppingCategories.map(category => (
                        <Menu.Item
                          key={category}
                          title={t(category)}
                          onPress={() => {
                            setIngType(category);
                            setTypeMenuVisible(false);
                          }}
                        />
                      ))}
                    </Menu>
                  </View>

                  <CustomTextInput
                    testID={modalTestId + '::Unit'}
                    label={t('unit')}
                    value={ingUnit}
                    onChangeText={setIngUnit}
                  />

                  <SeasonalityCalendar
                    testID={modalTestId}
                    selectedMonths={ingSeason}
                    onMonthsChange={setIngSeason}
                  />
                </View>
              ) : null}
            </View>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <View style={styles.dialogActions}>
            <Button testID={modalTestId + '::CancelButton'} mode='outlined' onPress={handleDismiss}>
              {t('cancel')}
            </Button>
            <Button
              testID={modalTestId + '::ConfirmButton'}
              mode='contained'
              onPress={handleConfirm}
              disabled={isConfirmButtonDisabled()}
            >
              {confirmButtonText}
            </Button>
          </View>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: padding.small,
  },
  inputLabel: {
    marginRight: padding.small,
  },
  dialogActions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
export default ItemDialog;
