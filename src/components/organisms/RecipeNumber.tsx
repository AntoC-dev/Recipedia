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
 *     openModal: () => scanForTime(),
 *     manuallyFill: () => enableManualInput()
 *   }}
 * />
 * ```
 */

import { View } from 'react-native';
import React from 'react';
import { RoundButton } from '@components/atomic/RoundButton';
import { Icons } from '@assets/Icons';
import { recipeNumberStyles, recipeTextStyles } from '@styles/recipeComponents';
import { Text } from 'react-native-paper';
import { VariantProp } from 'react-native-paper/lib/typescript/components/Typography/types';
import { NumericTextInput } from '@components/atomic/NumericTextInput';
import { defaultValueNumber } from '@utils/Constants';

/** Props for add mode with OCR and manual options */
export type RecipeNumberAddProps = {
  editType: 'add';
  /** Callback to open OCR scanning modal */
  openModal: () => void;
  /** Callback to enable manual input mode */
  manuallyFill: () => void;
};

/** Props for editable numeric input mode */
export type RecipeNumberEditProps = {
  editType: 'editable';
  /** Current numeric value being edited */
  textEditable: number;
  /** State setter for updating the numeric value */
  setTextToEdit: React.Dispatch<React.SetStateAction<number>>;
};

/** Props for add/edit modes with discriminated union */
export type RecipeNumberAddOrEditProps = {
  /** Test ID for the editable component */
  testID: string;
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
};

/**
 * RecipeNumber component for versatile numeric recipe input
 *
 * @param props - The component props with mode-specific configuration
 * @returns JSX element representing a numeric input with multiple interaction modes
 */
export function RecipeNumber({ testID, numberProps }: RecipeNumberProps) {
  return (
    <View style={recipeTextStyles.containerSection}>
      {numberProps.editType === 'read' ? (
        <Text testID={testID + '::Text'} variant={'headlineMedium'} accessible={true}>
          {numberProps.text}
        </Text>
      ) : (
        <RecipeNumberEditablePart {...numberProps} />
      )}
    </View>
  );
}

/**
 * Internal component for rendering editable portions of RecipeNumber
 *
 * @param addOrEditProps - The add/edit configuration props
 * @returns JSX element representing the editable numeric input interface
 */
function RecipeNumberEditablePart(addOrEditProps: RecipeNumberAddOrEditProps) {
  const view =
    addOrEditProps.editType === 'editable'
      ? recipeNumberStyles.editableView
      : recipeNumberStyles.addView;
  const prefixVariant: VariantProp<never> =
    addOrEditProps.editType === 'editable' ? 'titleMedium' : 'headlineSmall';
  return (
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
        />
      ) : (
        <View style={recipeNumberStyles.roundButtonsContainer}>
          <View style={recipeNumberStyles.roundButton}>
            <RoundButton
              testID={addOrEditProps.testID + '::OpenModal'}
              size={'medium'}
              icon={Icons.scanImageIcon}
              onPressFunction={addOrEditProps.openModal}
            />
          </View>
          <View style={recipeNumberStyles.roundButton}>
            <RoundButton
              testID={addOrEditProps.testID + '::ManuallyFill'}
              size={'medium'}
              icon={Icons.pencilIcon}
              onPressFunction={addOrEditProps.manuallyFill}
            />
          </View>
        </View>
      )}
      <Text testID={addOrEditProps.testID + '::SuffixText'} variant={'titleMedium'}>
        {addOrEditProps.suffixText}
      </Text>
    </View>
  );
}

export default RecipeNumber;
