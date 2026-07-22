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
 * - Inline type and seasonality selection (no Portal conflicts)
 * - Internationalization support throughout
 *
 * Form Fields by Type:
 *
 * **Ingredients:**
 * - Name (required text input)
 * - Type (inline accordion: single-select RadioButton)
 * - Unit (text input: cups, grams, pieces, etc.)
 * - Seasonality (inline accordion: multi-select Chips)
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
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text } from 'react-native-paper';
import { Controller, Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useI18n } from '@utils/i18n';
import { CustomTextInput } from '@components/atomic/CustomTextInput';
import { useTags } from '@hooks/useTags';
import { useIngredients } from '@hooks/useIngredients';
import {
  FormIngredientElement,
  IngredientDraft,
  ingredientType,
  TagDraft,
} from '@customTypes/DatabaseElementTypes';
import { useShoppingCategories } from '@hooks/useCategories';
import { SelectableAccordion } from '@components/molecules/SelectableAccordion';
import { SeasonalityCalendar } from '@components/molecules/SeasonalityCalendar';
import { uiLogger } from '@utils/logger';
import { dialogMaxHeight, padding } from '@styles/spacing';
import { ingredientDialogSchema, tagDialogSchema } from '@schemas/itemDialogSchema';
import { buildItemFormValues, ItemDialogFormValues } from '@customTypes/ItemDialogTypes';

/** Available dialog operation modes */
export type DialogMode = 'add' | 'edit' | 'delete';

/** Configuration for ingredient dialogs */
export type ItemIngredientType = {
  type: 'Ingredient';
  /** Current ingredient data (may have optional fields for new/incomplete ingredients) */
  value: FormIngredientElement;
  /** Callback fired when ingredient operation is confirmed */
  onConfirmIngredient: (mode: DialogMode, newItem: IngredientDraft) => void | Promise<void>;
};

/** Configuration for tag dialogs */
export type ItemTagType = {
  type: 'Tag';
  /** Current tag data */
  value: TagDraft;
  /** Callback fired when tag operation is confirmed */
  onConfirmTag: (mode: DialogMode, newItem: TagDraft) => void | Promise<void>;
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
  const shoppingCategories = useShoppingCategories();
  const { findSimilarTagsDetailed } = useTags();
  const { findSimilarIngredientsDetailed } = useIngredients();

  const isIngredient = item.type === 'Ingredient';

  const { control, handleSubmit, watch, reset, setError, clearErrors, formState } =
    useForm<ItemDialogFormValues>({
      resolver: zodResolver(
        isIngredient ? ingredientDialogSchema : tagDialogSchema
      ) as unknown as Resolver<ItemDialogFormValues>,
      defaultValues: buildItemFormValues(item),
      mode: 'onChange',
    });

  // item intentionally excluded from deps — avoids mid-edit resets when caller
  // passes new inline object references on every render.
  useEffect(() => {
    if (isVisible) reset(buildItemFormValues(item));
  }, [isVisible]);

  const nameValue = watch('name');
  const [similarNames, setSimilarNames] = useState('');

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
      clearErrors('name');
      return;
    }

    const trimmedName = nameValue.trim();
    if (!trimmedName) return;

    const timeoutId = setTimeout(() => {
      const messageKeys =
        item.type === 'Tag'
          ? { duplicate: 'tag_already_exists', similar: 'similar_tags_exist' }
          : { duplicate: 'ingredient_already_exists', similar: 'similar_ingredients_exist' };

      const result =
        item.type === 'Tag'
          ? findSimilarTagsDetailed(trimmedName)
          : findSimilarIngredientsDetailed(trimmedName);

      if (result.exact) {
        const isSameElement = item.value.id !== undefined && result.exact.id === item.value.id;
        if (isSameElement) {
          clearErrors('name');
        } else {
          setError('name', { type: 'duplicate', message: messageKeys.duplicate });
        }
      } else {
        const otherSimilar = result.similar.filter(
          similarItem => !item.value.id || similarItem.id !== item.value.id
        );

        if (otherSimilar.length > 0) {
          setSimilarNames(otherSimilar.map(similarItem => similarItem.name).join(', '));
          setError('name', { type: 'similar', message: messageKeys.similar });
        } else {
          clearErrors('name');
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    nameValue,
    item.type,
    item.value.id,
    isVisible,
    mode,
    findSimilarTagsDetailed,
    findSimilarIngredientsDetailed,
    t,
  ]);

  const typeValue = watch('type');

  const isConfirmDisabled =
    mode !== 'delete' &&
    (!nameValue.trim() ||
      (isIngredient && typeValue === undefined) ||
      formState.errors.name?.type === 'duplicate');

  const onSubmit = (data: ItemDialogFormValues) => {
    switch (item.type) {
      case 'Ingredient':
        void item.onConfirmIngredient(mode, {
          id: item.value.id,
          name: data.name,
          type: data.type as ingredientType,
          unit: data.unit,
          season: data.season,
        });
        break;
      case 'Tag':
        void item.onConfirmTag(mode, { id: item.value.id, name: data.name });
        break;
      default:
        uiLogger.error('Unreachable code in ItemDialog');
    }
    onClose();
  };

  const handleDeleteConfirm = () => {
    switch (item.type) {
      case 'Ingredient':
        void item.onConfirmIngredient(mode, item.value as IngredientDraft);
        break;
      case 'Tag':
        void item.onConfirmTag(mode, item.value as TagDraft);
        break;
      default:
        uiLogger.error('Unreachable code in ItemDialog');
    }
    onClose();
  };

  const titleByMode: Record<DialogMode, string> = {
    add: isIngredient ? t('add_ingredient') : t('add_tag'),
    edit: isIngredient ? t('edit_ingredient') : t('edit_tag'),
    delete: t('delete'),
  };

  const confirmTextByMode: Record<DialogMode, string> = {
    add: t('add'),
    edit: t('save'),
    delete: t('delete'),
  };

  const testIdSuffixByMode: Record<DialogMode, string> = {
    add: 'AddModal',
    edit: 'EditModal',
    delete: 'DeleteModal',
  };

  const dialogTitle = titleByMode[mode];
  const confirmButtonText = confirmTextByMode[mode];
  const modalTestId = `${testId}::${testIdSuffixByMode[mode]}`;

  return (
    <Portal>
      <Dialog visible={isVisible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title testID={modalTestId + '::Title'}>{dialogTitle}</Dialog.Title>
        {mode === 'delete' ? (
          <Dialog.Content>
            <Text testID={modalTestId + '::Text'} variant='bodyMedium'>
              {t('confirmDelete')}
              {` ${nameValue}${t('interrogationMark')}`}
            </Text>
          </Dialog.Content>
        ) : (
          <Dialog.ScrollArea>
            <ScrollView keyboardDismissMode='on-drag' contentContainerStyle={styles.formContainer}>
              {isIngredient ? (
                <Text testID={modalTestId + '::FormHint'} variant='bodySmall'>
                  {t('ingredient_form_hint')}
                </Text>
              ) : null}
              <Controller
                control={control}
                name='name'
                render={({ field: { onChange, value } }) => (
                  <CustomTextInput
                    label={isIngredient ? t('ingredient_name') : t('tag_name')}
                    value={value}
                    onChangeText={onChange}
                    testID={modalTestId + '::Name'}
                    error={
                      formState.errors.name?.type === 'duplicate' ||
                      formState.errors.name?.type === 'too_small'
                    }
                    dense={true}
                    style={styles.nameInput}
                  />
                )}
              />
              {formState.errors.name && (
                <HelperText
                  type={formState.errors.name.type === 'similar' ? 'info' : 'error'}
                  testID={modalTestId + '::HelperText'}
                >
                  {formState.errors.name.type === 'similar'
                    ? `${t(formState.errors.name.message ?? '')}: ${similarNames}`
                    : t(formState.errors.name.message ?? '')}
                </HelperText>
              )}

              {isIngredient ? (
                <>
                  <Controller
                    control={control}
                    name='unit'
                    render={({ field: { onChange, value } }) => (
                      <CustomTextInput
                        testID={modalTestId + '::Unit'}
                        label={t('unit')}
                        value={value}
                        onChangeText={onChange}
                        dense={true}
                        style={styles.unitInput}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name='type'
                    render={({ field: { onChange, value } }) => (
                      <SelectableAccordion
                        testID={modalTestId + '::TypeAccordion'}
                        title={t('type')}
                        items={shoppingCategories.map(category => ({
                          value: category,
                          label: t(category),
                        }))}
                        selectedValues={value ? [value] : []}
                        onPress={val => onChange(val as ingredientType)}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name='season'
                    render={({ field: { onChange, value } }) => (
                      <SeasonalityCalendar
                        testID={modalTestId}
                        selectedMonths={value ?? []}
                        onMonthsChange={onChange}
                      />
                    )}
                  />
                </>
              ) : null}
            </ScrollView>
          </Dialog.ScrollArea>
        )}
        <Dialog.Actions>
          <View style={styles.dialogActions}>
            <Button testID={modalTestId + '::CancelButton'} mode='outlined' onPress={onClose}>
              {t('cancel')}
            </Button>
            <Button
              testID={modalTestId + '::ConfirmButton'}
              mode='contained'
              onPress={() =>
                void (mode === 'delete' ? handleDeleteConfirm : handleSubmit(onSubmit))()
              }
              disabled={isConfirmDisabled}
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
  dialog: {
    maxHeight: dialogMaxHeight,
  },
  formContainer: {
    gap: padding.small,
  },
  nameInput: {
    marginBottom: -padding.verySmall,
  },
  unitInput: {
    marginTop: -padding.verySmall,
  },
  dialogActions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
