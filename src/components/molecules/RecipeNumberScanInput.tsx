/**
 * RecipeNumberScanInput - RecipeNumberInput with a trailing scan icon opening the OCR modal
 *
 * @example
 * ```typescript
 * <RecipeNumberScanInput
 *   testID='RecipePersons'
 *   scanField={recipeColumnsNames.persons}
 *   textEditable={persons}
 *   setTextToEdit={setPersons}
 * />
 * ```
 */

import React from 'react';
import { TextInput, useTheme } from 'react-native-paper';
import { Icons } from '@assets/Icons';
import { RecipeNumberInput, RecipeNumberInputProps } from '@components/molecules/RecipeNumberInput';
import { getScanLabelKey } from '@components/molecules/ScanButton';
import { useRecipeDialogs } from '@context/RecipeDialogsContext';
import { useI18n } from '@utils/i18n';
import type { OcrModalTarget } from '@utils/OCR';

/**
 * Props for the RecipeNumberScanInput component
 */
export type RecipeNumberScanInputProps = Omit<RecipeNumberInputProps, 'right'> & {
  /** Field the scan icon targets; `testID + '::OpenModal::IconButton'` identifies the icon */
  scanField: OcrModalTarget;
};

/**
 * RecipeNumberScanInput component
 *
 * @param props - The component props
 * @returns The numeric input with its trailing scan icon
 */
export function RecipeNumberScanInput({ scanField, ...inputProps }: RecipeNumberScanInputProps) {
  const { t } = useI18n();
  const { openImageModal } = useRecipeDialogs();
  const { colors } = useTheme();

  return (
    <RecipeNumberInput
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
