/**
 * RecipeNutrition - Modular nutrition facts component
 *
 * Displays comprehensive nutrition information using Material Design components.
 * Uses segmented buttons for switching between per 100g and per portion views.
 *
 * Key Features:
 * - Tab-based navigation for different measurement units
 * - Modular component architecture
 * - Material Design using react-native-paper
 * - Read-only, edit, add, and OCR modes support
 * - Empty state handling when no nutrition data available
 * - OCR integration for scanning nutrition facts from images
 *
 * @example
 * ```typescript
 * // Read-only display
 * <RecipeNutrition
 *   nutrition={recipe.nutrition}
 *   mode="readOnly"
 *   parentTestId="recipe"
 * />
 *
 * // Edit mode
 * <RecipeNutrition
 *   nutrition={recipe.nutrition}
 *   mode="edit"
 *   onNutritionChange={(updatedNutrition) => setNutrition(updatedNutrition)}
 *   parentTestId="recipe"
 * />
 *
 * // OCR mode
 * <RecipeNutrition
 *   nutrition={recipe.nutrition}
 *   mode="ocr"
 *   openModal={() => openNutritionOCRModal()}
 *   onNutritionChange={(updatedNutrition) => setNutrition(updatedNutrition)}
 *   parentTestId="recipe"
 * />
 * ```
 */
import React, { useState } from 'react';
import { useResetOnChange } from '@hooks/useResetOnChange';
import { View } from 'react-native';
import { HelperText } from 'react-native-paper';
import { nutritionTableElement } from '@customTypes/DatabaseElementTypes';
import { NutritionTable } from '@components/molecules/NutritionTable';
import { NutritionEmptyState } from '@components/molecules/NutritionEmptyState';
import { recipeStateType } from '@customTypes/ScreenTypes';
import { recipeLogger } from '@utils/logger';
import { emptyNutrition } from '@utils/NutritionUtils';

export interface RecipeNutritionProps {
  /** Current nutrition data (undefined when no nutrition available) */
  nutrition?: nutritionTableElement;
  /** Component mode for different interaction types */
  mode: recipeStateType;
  /** Callback fired when nutrition data changes in edit mode */
  onNutritionChange?: (nutrition: nutritionTableElement | undefined) => void;
  /** Function to open the OCR scanning modal (required when mode is 'ocr') */
  openModal?: () => void;
  /** Test ID of parent for component testing */
  parentTestId: string;
  /** Optional i18n key or message for an inline field-level error */
  error?: string;
}

export function RecipeNutrition({
  nutrition,
  mode,
  onNutritionChange,
  openModal,
  parentTestId,
  error,
}: RecipeNutritionProps) {
  const [editedNutrition, setEditedNutrition] = useState<nutritionTableElement | undefined>(
    nutrition
  );

  const testId = parentTestId + '::RecipeNutrition';
  const isEditing = mode !== recipeStateType.readOnly;
  const currentNutrition = isEditing ? editedNutrition : nutrition;

  useResetOnChange([nutrition, isEditing], () => {
    if (isEditing) {
      setEditedNutrition(nutrition);
    }
  });

  const handleNutritionUpdate = (updates: Partial<nutritionTableElement>) => {
    if (!isEditing) return;

    const updated = currentNutrition
      ? { ...currentNutrition, ...updates }
      : { ...emptyNutrition(), ...updates };

    setEditedNutrition(updated);
    onNutritionChange?.(updated);
  };

  const handleRemoveNutrition = () => {
    setEditedNutrition(undefined);
    onNutritionChange?.(undefined);
  };

  const handleOCRModal = () => {
    if (mode === recipeStateType.addOCR) {
      openModal?.();
    } else {
      recipeLogger.warn('handleOCRModal called in wrong mode', mode);
    }
  };

  const handleAddNutrition = () => {
    handleNutritionUpdate({});
  };

  const errorHelper = error ? (
    <HelperText testID={testId + '::Error'} type='error' visible={true}>
      {error}
    </HelperText>
  ) : null;

  if (!currentNutrition && mode === recipeStateType.readOnly) {
    return null;
  }

  if (!currentNutrition && isEditing) {
    return (
      <View>
        <NutritionEmptyState
          mode={mode === recipeStateType.addOCR ? 'ocr' : 'add'}
          onButtonPressed={mode === recipeStateType.addOCR ? handleOCRModal : handleAddNutrition}
          parentTestId={testId}
        />
        {errorHelper}
      </View>
    );
  }

  if (!currentNutrition) {
    return null;
  }

  return (
    <View>
      <NutritionTable
        nutrition={currentNutrition}
        isEditable={isEditing}
        onNutritionChange={handleNutritionUpdate}
        onRemoveNutrition={handleRemoveNutrition}
        showRemoveButton={isEditing}
        parentTestId={testId}
      />
      {errorHelper}
    </View>
  );
}

export default RecipeNutrition;
