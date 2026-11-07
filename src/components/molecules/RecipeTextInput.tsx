/**
 * RecipeTextInput - Multiline text input of the recipe form
 *
 * Commits on every keystroke and when editing ends, so a Save tap with an unfocused-but-typed
 * input still persists the latest text (`Keyboard.dismiss` cannot guarantee a synchronous blur
 * over the RN bridge).
 *
 * @example
 * ```typescript
 * <RecipeTextInput
 *   testID='RecipeTitle'
 *   textEditable={title}
 *   setTextToEdit={setTitle}
 *   onBlur={onBlur}
 * />
 * ```
 */

import React from 'react';
import { recipeTextStyles } from '@styles/recipeComponents';
import { CustomTextInput } from '@components/atomic/CustomTextInput';

/**
 * Props for the RecipeTextInput component
 */
export type RecipeTextInputProps = {
  /** Identifier of the underlying input */
  testID: string;
  /** Current text value */
  textEditable: string;
  /** Setter called on every keystroke and when editing ends */
  setTextToEdit: (value: string) => void;
  /** Optional blur handler */
  onBlur?: () => void;
  /** Optional trailing adornment of the input */
  right?: React.ReactNode;
};

/**
 * RecipeTextInput component
 *
 * @param props - The component props
 * @returns The multiline text input
 */
export function RecipeTextInput({
  testID,
  textEditable,
  setTextToEdit,
  onBlur,
  right,
}: RecipeTextInputProps) {
  return (
    <CustomTextInput
      testID={testID}
      style={recipeTextStyles.containerElement}
      value={textEditable ?? ''}
      multiline={true}
      onChangeText={setTextToEdit}
      onEndEditing={setTextToEdit}
      onBlur={onBlur}
      right={right}
    />
  );
}
