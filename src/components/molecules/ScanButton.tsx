/**
 * ScanButton - Round button opening the OCR modal for a field via `RecipeDialogsContext`
 *
 * @example
 * ```typescript
 * <ScanButton testID='RecipeTitle::OpenModal' field={recipeColumnsNames.title} />
 * ```
 */

import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Icons } from '@assets/Icons';
import { RoundButton } from '@components/atomic/RoundButton';
import { useRecipeDialogs } from '@context/RecipeDialogsContext';
import { useI18n } from '@utils/i18n';
import type { OcrModalTarget } from '@utils/OCR';

/**
 * Props for the ScanButton component
 */
export type ScanButtonProps = {
  /** Rendered identifier of the underlying RoundButton */
  testID: string;
  /** Field the OCR modal targets when the button is pressed */
  field: OcrModalTarget;
  /** Custom styles for the button container */
  style?: StyleProp<ViewStyle>;
};

/** Maps an OCR target to its scan label translation key. */
function getScanLabelKey(field: OcrModalTarget): string {
  switch (field) {
    case 'ingredientNames':
      return 'recipe.roundButton.scanNames';
    case 'ingredientQuantities':
      return 'recipe.roundButton.scanQuantities';
    default:
      return 'recipe.roundButton.scan';
  }
}

/**
 * ScanButton component
 *
 * @param props - The component props
 * @returns The OCR scan round button
 */
export function ScanButton({ testID, field, style }: ScanButtonProps) {
  const { t } = useI18n();
  const { openImageModal } = useRecipeDialogs();

  return (
    <RoundButton
      testID={testID}
      icon={Icons.scanImageIcon}
      onPressFunction={() => openImageModal(field)}
      label={t(getScanLabelKey(field))}
      style={style}
    />
  );
}
