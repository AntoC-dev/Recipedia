/**
 * RecipeTextScanInput - RecipeTextInput with a trailing scan icon opening the OCR modal
 *
 * @example
 * ```typescript
 * <RecipeTextScanInput
 *   testID='RecipeTitle'
 *   scanField={recipeColumnsNames.title}
 *   textEditable={title}
 *   setTextToEdit={setTitle}
 * />
 * ```
 */

import React from 'react';
import { TextInput, useTheme } from 'react-native-paper';
import { Icons } from '@assets/Icons';
import { RecipeTextInput, RecipeTextInputProps } from '@components/molecules/RecipeTextInput';
import { getScanLabelKey } from '@components/molecules/ScanButton';
import { useRecipeDialogs } from '@context/RecipeDialogsContext';
import { useI18n } from '@utils/i18n';
import type { OcrModalTarget } from '@utils/OCR';

/**
 * Props for the RecipeTextScanInput component
 */
export type RecipeTextScanInputProps = Omit<RecipeTextInputProps, 'right'> & {
  /** Field the scan icon targets; `testID + '::OpenModal::IconButton'` identifies the icon */
  scanField: OcrModalTarget;
};

/**
 * RecipeTextScanInput component
 *
 * @param props - The component props
 * @returns The text input with its trailing scan icon
 */
export function RecipeTextScanInput({ scanField, ...inputProps }: RecipeTextScanInputProps) {
  const { t } = useI18n();
  const { openImageModal } = useRecipeDialogs();
  const { colors } = useTheme();

  return (
    <RecipeTextInput
      {...inputProps}
      right={
        <TextInput.Icon
          testID={inputProps.testID + '::OpenModal::IconButton'}
          icon={Icons.scanImageIcon}
          color={colors.primary}
          onPress={() => openImageModal(scanField)}
          accessibilityLabel={t(getScanLabelKey(scanField))}
          forceTextInputFocus={false}
        />
      }
    />
  );
}
