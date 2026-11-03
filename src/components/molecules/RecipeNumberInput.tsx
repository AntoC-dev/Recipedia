/**
 * RecipeNumberInput - Numeric input of the recipe form
 *
 * @example
 * ```typescript
 * <RecipeNumberInput testID='RecipePersons' textEditable={persons} setTextToEdit={setPersons} />
 * ```
 */

import React from 'react';
import { NumericTextInput } from '@components/atomic/NumericTextInput';
import { defaultValueNumber } from '@utils/Constants';

/**
 * Props for the RecipeNumberInput component
 */
export type RecipeNumberInputProps = {
  /** Base identifier; the input renders as `testID + '::NumericTextInput'` */
  testID: string;
  /** Current numeric value */
  textEditable: number;
  /** Setter called with the parsed value */
  setTextToEdit: (value: number) => void;
  /** Optional blur handler */
  onBlur?: () => void;
  /** Optional trailing adornment of the input */
  right?: React.ReactNode;
};

/**
 * RecipeNumberInput component
 *
 * @param props - The component props
 * @returns The numeric input
 */
export function RecipeNumberInput({
  testID,
  textEditable,
  setTextToEdit,
  onBlur,
  right,
}: RecipeNumberInputProps) {
  return (
    <NumericTextInput
      testID={testID + '::NumericTextInput'}
      value={textEditable ?? defaultValueNumber}
      onChangeValue={setTextToEdit}
      keyboardType='numeric'
      onBlur={onBlur}
      right={right}
    />
  );
}
