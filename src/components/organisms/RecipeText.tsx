/**
 * RecipeText - Flexible text display with editing and modal capabilities
 *
 * A versatile text component designed for recipe content that supports multiple text styles
 * and editing modes. Features both read-only display and interactive editing modes with
 * options for inline text editing or modal-based content addition via OCR scanning.
 *
 * Key Features:
 * - Three text style variants: headline, title, paragraph
 * - Dual interaction modes: inline editing and modal addition
 * - OCR integration for adding content via image scanning
 * - Discriminated union props for type-safe editing configurations
 * - Responsive styling based on edit mode and text style
 * - Material Design typography integration
 * - Comprehensive test ID structure for automation
 *
 * @example
 * ```typescript
 * // Read-only recipe title
 * <RecipeText
 *   rootText={{style: 'headline', value: 'Chocolate Chip Cookies'}}
 *   testID="recipe-title"
 * />
 *
 * // Editable recipe description
 * <RecipeText
 *   rootText={{style: 'paragraph', value: currentDescription}}
 *   addOrEditProps={{
 *     editType: 'editable',
 *     textEditable: editableDescription,
 *     setTextToEdit: setEditableDescription
 *   }}
 *   testID="recipe-description"
 * />
 *
 * // Add content via OCR modal
 * <RecipeText
 *   rootText={{style: 'title', value: 'Instructions'}}
 *   addOrEditProps={{
 *     editType: 'add',
 *     openModal: () => openOCRScanner()
 *   }}
 *   testID="recipe-instructions"
 * />
 * ```
 */

import { View } from 'react-native';
import React from 'react';
import { RoundButton } from '@components/atomic/RoundButton';
import { Icons } from '@assets/Icons';
import { Text } from 'react-native-paper';
import { recipeTextStyles } from '@styles/recipeComponents';
import { VariantProp } from 'react-native-paper/lib/typescript/components/Typography/types';
import { CustomTextInput } from '@components/atomic/CustomTextInput';

/** Text configuration with style and content */
export type TextProp = {
  /** Visual style of the text */
  style: 'headline' | 'title' | 'paragraph';
  /** Text content to display */
  value: string;
};

/** Props for add mode with modal functionality */
export type RecipeTextAddProps = {
  editType: 'add';
  /** Function to open the OCR scanning modal */
  openModal: () => void;
};

/** Props for inline editing mode */
export type RecipeTextEditProps = {
  editType: 'editable';
  /** Current editable text value */
  textEditable: string;
  /** State setter for updating editable text */
  setTextToEdit: React.Dispatch<React.SetStateAction<string>>;
};

/**
 * Props for editing configuration
 * Uses discriminated union for type safety between add and edit modes
 */
export type RecipeTextAddOrEditProps = {
  /** Unique identifier for testing and accessibility */
  testID: string;
} & (RecipeTextAddProps | RecipeTextEditProps);

/**
 * Props for the RecipeText component
 */
export type RecipeTextProps = {
  /** Text configuration and styling */
  rootText: TextProp;
  /** Optional editing configuration */
  addOrEditProps?: RecipeTextAddOrEditProps;
  /** Unique identifier for testing and accessibility */
  testID?: string;
};

/**
 * RecipeText component for flexible text display and editing
 *
 * @param props - The component props with discriminated union for editing modes
 * @returns JSX element representing formatted text with optional editing capabilities
 */
export function RecipeText({ rootText, testID, addOrEditProps }: RecipeTextProps) {
  const containerStyle =
    addOrEditProps?.editType === 'add'
      ? recipeTextStyles.containerTab
      : recipeTextStyles.containerSection;

  let variant: VariantProp<never>;
  switch (rootText.style) {
    case 'headline':
      variant = 'headlineMedium';
      break;
    case 'title':
      variant = 'headlineSmall';
      break;
    case 'paragraph':
      variant = 'bodyLarge';
      break;
  }

  return (
    <View style={containerStyle}>
      <Text
        testID={testID + '::Text'}
        variant={variant}
        style={recipeTextStyles.containerElement}
        accessible={true}
      >
        {rootText.value}
      </Text>
      {addOrEditProps ? <RecipeTextEditablePart {...addOrEditProps} /> : null}
    </View>
  );
}

/**
 * Internal component for rendering editable portions of the RecipeText
 *
 * @param addOrEditProps - The editing configuration props
 * @returns JSX element representing the editable portion (input or modal button)
 */
function RecipeTextEditablePart(addOrEditProps: RecipeTextAddOrEditProps) {
  return (
    <View>
      {addOrEditProps.editType === 'editable' ? (
        <CustomTextInput
          testID={addOrEditProps.testID}
          style={recipeTextStyles.containerElement}
          value={addOrEditProps.textEditable ?? ''}
          multiline={true}
          onChangeText={newText => addOrEditProps.setTextToEdit(newText)}
        />
      ) : (
        <RoundButton
          testID={addOrEditProps.testID + '::OpenModal'}
          size={'medium'}
          icon={Icons.scanImageIcon}
          onPressFunction={addOrEditProps.openModal}
        />
      )}
    </View>
  );
}

export default RecipeText;
