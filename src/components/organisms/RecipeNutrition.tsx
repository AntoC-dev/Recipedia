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
 * - When `withScan` is set (OCR mode), a Scan button stays below the table once nutrition exists
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
 *   mode={recipeStateType.addOCR}
 *   onNutritionChange={(updatedNutrition) => setNutrition(updatedNutrition)}
 *   parentTestId="recipe"
 * />
 * ```
 */
import React, { useState } from 'react';
import { useResetOnChange } from '@hooks/useResetOnChange';
import { View } from 'react-native';
import { HelperText } from 'react-native-paper';
import { nutritionTableElement, recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import { NutritionTable } from '@components/molecules/NutritionTable';
import { NutritionEmptyState } from '@components/molecules/NutritionEmptyState';
import { recipeStateType } from '@customTypes/ScreenTypes';
import { emptyNutrition } from '@utils/NutritionUtils';
import { ScanButton } from '@components/molecules/ScanButton';

export interface RecipeNutritionProps {
  /** Current nutrition data (undefined when no nutrition available) */
  nutrition?: nutritionTableElement;
  /** Component mode for different interaction types */
  mode: recipeStateType;
  /** Callback fired when nutrition data changes in edit mode */
  onNutritionChange?: (nutrition: nutritionTableElement | undefined) => void;
  /** Renders the OCR scan buttons for the nutrition field (OCR mode) */
  withScan?: boolean;
  /** Test ID of parent for component testing */
  parentTestId: string;
  /** Optional i18n key or message for an inline field-level error */
  error?: string;
}

export function RecipeNutrition({
  nutrition,
  mode,
  onNutritionChange,
  withScan,
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
          withScan={withScan}
          onButtonPressed={handleAddNutrition}
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
      {withScan ? (
        <ScanButton testID={testId + '::OpenModal'} field={recipeColumnsNames.nutrition} />
      ) : null}
      {errorHelper}
    </View>
  );
}
