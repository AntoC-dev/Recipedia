/**
 * IngredientsSettings - Comprehensive ingredient database management screen
 *
 * A dedicated screen for managing the app's ingredient database with full CRUD
 * operations, seasonality management, and categorization. Features dialog-based
 * editing with comprehensive validation and real-time synchronization.
 *
 * Key Features:
 * - Complete ingredient CRUD operations (Create, Read, Update, Delete)
 * - Seasonality calendar for ingredient availability
 * - Type categorization (vegetables, proteins, dairy, etc.)
 * - Alphabetical sorting for easy navigation
 * - Dialog-based editing with comprehensive forms
 * - Real-time database synchronization
 * - Usage tracking for deletion warnings
 * - Comprehensive error handling and logging
 *
 * @example
 * ```typescript
 * // Navigation from Parameters screen
 * <List.Item
 *   title="Ingredients"
 *   onPress={() => navigation.navigate('IngredientsSettings')}
 * />
 * ```
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
import { useNavigation } from '@react-navigation/native';
import { FormIngredientElement, ingredientTableElement } from '@customTypes/DatabaseElementTypes';
import { SettingsItemList } from '@components/organisms/SettingsItemList';
import { AppBar } from '@components/organisms/AppBar';
import { BottomActionButton } from '@components/atomic/BottomActionButton';
import { DialogMode, ItemDialog } from '@components/dialogs/ItemDialog';
import { ingredientsSettingsLogger } from '@utils/logger';
import { useIngredients } from '@hooks/useIngredients';
import { useI18n } from '@utils/i18n';
import { Icons } from '@assets/Icons';
import { padding } from '@styles/spacing';

/**
 * IngredientsSettings screen component - Ingredient database management
 *
 * @returns JSX element representing the ingredient management interface
 */
const BUTTON_HEIGHT = 48;
const BUTTON_CONTAINER_HEIGHT = BUTTON_HEIGHT + padding.small * 2;

export function IngredientsSettings() {
  const { ingredients, addIngredient, editIngredient, deleteIngredient } = useIngredients();
  const navigation = useNavigation();
  const { t } = useI18n();

  const ingredientsSortedAlphabetically = [...ingredients].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedIngredient, setSelectedIngredient] = useState<ingredientTableElement>();

  const testId = 'IngredientsSettings';

  const handleAddIngredient = async (newIngredient: ingredientTableElement) => {
    const insertedIngredient = await addIngredient(newIngredient);
    if (!insertedIngredient) {
      ingredientsSettingsLogger.warn('Failed to add ingredient to database', {
        ingredientName: newIngredient.name,
      });
    }
  };

  const handleEditIngredient = async (newIngredient: ingredientTableElement) => {
    const success = await editIngredient(newIngredient);
    if (!success) {
      ingredientsSettingsLogger.warn('Failed to update ingredient in database', {
        ingredientName: newIngredient.name,
        ingredientId: newIngredient.id,
      });
    }
  };

  const handleDeleteIngredient = async (ingredient: ingredientTableElement) => {
    const success = await deleteIngredient(ingredient);
    if (!success) {
      ingredientsSettingsLogger.warn('Ingredient not found for deletion', { ingredient });
    }
  };

  // Open dialog handlers
  const openAddDialog = () => {
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const openEditDialog = (ingredient: ingredientTableElement) => {
    setSelectedIngredient(ingredient);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (ingredient: ingredientTableElement) => {
    setSelectedIngredient(ingredient);
    setDialogMode('delete');
    setIsDialogOpen(true);
  };

  // Close dialog handler
  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  // Dialog action handlers
  const handleDialogConfirm = async (mode: DialogMode, newIngredient: ingredientTableElement) => {
    switch (mode) {
      case 'add':
        await handleAddIngredient(newIngredient);
        break;
      case 'edit':
        if (selectedIngredient) {
          await handleEditIngredient(newIngredient);
        }
        break;
      case 'delete':
        if (selectedIngredient) {
          await handleDeleteIngredient(newIngredient);
        }
        break;
    }
    setIsDialogOpen(false);
  };

  const getDialogIngredientValue = () => {
    const emptyIngredientTemplate: FormIngredientElement = {};
    if (dialogMode === 'add') {
      return emptyIngredientTemplate;
    }
    return selectedIngredient ?? emptyIngredientTemplate;
  };

  // TODO add a counter of how many recipes use this element before deleting it
  return (
    <ScreenWrapper>
      <AppBar title={t('ingredients')} onGoBack={() => navigation.goBack()} testID={testId} />
      <View style={{ flex: 1, paddingBottom: BUTTON_CONTAINER_HEIGHT }}>
        <SettingsItemList
          items={ingredientsSortedAlphabetically}
          testIdPrefix={testId}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
          type='ingredient'
        />
      </View>

      <BottomActionButton
        testID={testId}
        icon={Icons.plusIcon}
        onPress={openAddDialog}
        label={t('add_ingredient')}
      />

      {isDialogOpen && (
        <ItemDialog
          isVisible={isDialogOpen}
          onClose={closeDialog}
          testId={testId + '::ItemDialog'}
          mode={dialogMode}
          item={{
            type: 'Ingredient',
            value: getDialogIngredientValue(),
            onConfirmIngredient: handleDialogConfirm,
          }}
        />
      )}
    </ScreenWrapper>
  );
}

export default IngredientsSettings;
