/**
 * RecipeNumber - Versatile numeric input component for recipe data
 *
 * A specialized component for handling numeric recipe values like preparation time,
 * serving count, and cooking duration. Features multiple interaction modes including
 * read-only display, direct editing, and dual-input options (OCR scanning + manual entry).
 *
 * Key Features:
 * - Three distinct modes: read-only, editable, and dual-input (add)
 * - OCR integration for extracting numbers from images
 * - Renders a Scan button (`scanField`) when `withScan` is set
 * - Manual input fallback with numeric keyboard
 * - Customizable prefix and suffix text
 * - Theme-aware typography scaling
 * - Default value handling and validation
 * - Responsive layout adaptation based on mode
 *
 * @example
 * ```typescript
 * // Read-only display
 * <RecipeNumber
 *   testID="prep-time-display"
 *   numberProps={{
 *     editType: 'read',
 *     text: 'Preparation: 25 minutes'
 *   }}
 * />
 *
 * // Editable numeric input
 * <RecipeNumber
 *   testID="servings-editor"
 *   numberProps={{
 *     editType: 'editable',
 *     prefixText: 'Serves',
 *     suffixText: 'people',
 *     textEditable: servingCount,
 *     setTextToEdit: setServingCount
 *   }}
 * />
 *
 * // Dual input mode (OCR + manual)
 * <RecipeNumber
 *   testID="cook-time-input"
 *   numberProps={{
 *     editType: 'add',
 *     prefixText: 'Cooking time:',
 *     suffixText: 'minutes',
 *     scanField: recipeColumnsNames.time,
 *     withScan: true,
 *     manuallyFill: () => enableManualInput()
 *   }}
 * />
 * ```
 */

import { View } from 'react-native';
import React from 'react';
import { RoundButton } from '@components/atomic/RoundButton';
import { ScanButton } from '@components/molecules/ScanButton';
import { Icons } from '@assets/Icons';
import { recipeButtonStyles, recipeNumberStyles, recipeTextStyles } from '@styles/recipeComponents';
import { HelperText, Text } from 'react-native-paper';
import { VariantProp } from 'react-native-paper/lib/typescript/components/Typography/types';
import { NumericTextInput } from '@components/atomic/NumericTextInput';
import { defaultValueNumber } from '@utils/Constants';
import { useI18n } from '@utils/i18n';
import type { OcrModalTarget } from '@utils/OCR';

/** Props for add mode with OCR and manual options */
export type RecipeNumberAddProps = {
  editType: 'add';
  /** Callback to enable manual input mode */
  manuallyFill: () => void;
};

/** Props for editable numeric input mode */
export type RecipeNumberEditProps = {
  editType: 'editable';
  /** Current numeric value being edited */
  textEditable: number;
  /** Setter for updating the numeric value */
  setTextToEdit: (value: number) => void;
};

/** Props for add/edit modes with discriminated union */
export type RecipeNumberAddOrEditProps = {
  /** Test ID for the editable component */
  testID: string;
  /** Field the Scan button targets */
  scanField: OcrModalTarget;
  /** Renders the Scan button targeting `scanField` (OCR mode) */
  withScan?: boolean;
  /** Optional text to display before the number */
  prefixText?: string;
  /** Optional text to display after the number */
  suffixText?: string;
} & (RecipeNumberAddProps | RecipeNumberEditProps);

/** Props for read-only display mode */
export type RecipeNumberReadOnlyProps = { editType: 'read'; text: string };

/** Union type for all possible number component configurations */
export type RecipeNumberReadAddOrEditProps = RecipeNumberAddOrEditProps | RecipeNumberReadOnlyProps;

/**
 * Props for the RecipeNumber component
 */
export type RecipeNumberProps = {
  /** Configuration object determining the component's behavior and appearance */
  numberProps: RecipeNumberReadAddOrEditProps;
  /** Unique identifier for testing and accessibility */
  testID: string;
  /** Optional translated error message displayed below the input */
  error?: string;
  /** Optional blur handler forwarded to the editable numeric input */
  onBlur?: () => void;
};

/**
 * RecipeNumber component for versatile numeric recipe input
 *
 * @param props - The component props with mode-specific configuration
 * @returns JSX element representing a numeric input with multiple interaction modes
 */
export function RecipeNumber({ testID, numberProps, error, onBlur }: RecipeNumberProps) {
  return (
    <View style={recipeTextStyles.containerSection}>
      {numberProps.editType === 'read' ? (
        <Text testID={testID + '::Text'} variant={'headlineMedium'} accessible={true}>
          {numberProps.text}
        </Text>
      ) : (
        <RecipeNumberEditablePart {...numberProps} onBlur={onBlur} />
      )}
      {error ? (
        <HelperText testID={testID + '::Error'} type='error' visible={true}>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}

/**
 * Internal component for rendering editable portions of RecipeNumber
 *
 * @param addOrEditProps - The add/edit configuration props
 * @returns JSX element representing the editable numeric input interface
 */
function RecipeNumberEditablePart(
  addOrEditProps: RecipeNumberAddOrEditProps & { onBlur?: () => void }
) {
  const { t } = useI18n();
  const view = addOrEditProps.editType === 'editable' ? recipeNumberStyles.editableView : undefined;
  const prefixVariant: VariantProp<never> =
    addOrEditProps.editType === 'editable' ? 'titleMedium' : 'headlineSmall';
  return (
    <>
      <View style={view}>
        <Text testID={addOrEditProps.testID + '::PrefixText'} variant={prefixVariant}>
          {addOrEditProps.prefixText}
        </Text>
        {addOrEditProps.editType === 'editable' ? (
          <NumericTextInput
            testID={addOrEditProps.testID + '::NumericTextInput'}
            value={addOrEditProps.textEditable ?? defaultValueNumber}
            onChangeValue={addOrEditProps.setTextToEdit}
            keyboardType='numeric'
            onBlur={addOrEditProps.onBlur}
          />
        ) : (
          <View
            style={[
              recipeButtonStyles.roundButtonsContainer,
              recipeNumberStyles.roundButtonsMargin,
            ]}
          >
            {addOrEditProps.withScan ? (
              <View style={recipeButtonStyles.roundButton}>
                <ScanButton
                  testID={addOrEditProps.testID + '::OpenModal'}
                  field={addOrEditProps.scanField}
                />
              </View>
            ) : null}
            <View style={recipeButtonStyles.roundButton}>
              <RoundButton
                testID={addOrEditProps.testID + '::ManuallyFill'}
                icon={Icons.pencilIcon}
                onPressFunction={addOrEditProps.manuallyFill}
                label={t('recipe.roundButton.addManually')}
              />
            </View>
          </View>
        )}
        <Text testID={addOrEditProps.testID + '::SuffixText'} variant={'titleMedium'}>
          {addOrEditProps.suffixText}
        </Text>
      </View>
      {addOrEditProps.editType === 'editable' && addOrEditProps.withScan ? (
        <ScanButton
          testID={addOrEditProps.testID + '::OpenModal'}
          field={addOrEditProps.scanField}
        />
      ) : null}
    </>
  );
}
