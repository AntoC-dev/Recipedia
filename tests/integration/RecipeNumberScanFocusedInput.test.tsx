import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { RecipeNumber } from '@components/organisms/RecipeNumber';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import {
  IMAGE_MODAL_TARGET_TEST_ID,
  renderWithRecipeDialogs,
} from '@mocks/context/RecipeDialogsHarness';
import { blurFocusedInputOnKeyboardDismiss } from '@mocks/deps/keyboard-dismiss-blur-mock';

describe('RecipeNumber scan icon on a focused input', () => {
  const testID = 'RecipeTime';
  const inputId = testID + '::NumericTextInput';
  const iconId = testID + '::OpenModal::IconButton';
  const initialTime = 15;
  const typedTime = '40';
  const scannedTime = 25;

  const renderTimeField = (time: number, setTime: (value: number) => void) => (
    <RecipeNumber
      testID={testID}
      numberProps={{
        testID,
        editType: 'editable',
        scanField: recipeColumnsNames.time,
        withScan: true,
        textEditable: time,
        setTextToEdit: setTime,
      }}
    />
  );

  test('keeps the scanned time when the input blurs after the scan', async () => {
    const setTime = jest.fn();
    const screen = await renderWithRecipeDialogs(renderTimeField(initialTime, setTime));
    const dismissSpy = blurFocusedInputOnKeyboardDismiss(() => screen.getByTestId(inputId));

    await fireEvent(screen.getByTestId(inputId), 'focus');
    await fireEvent.changeText(screen.getByTestId(inputId), typedTime);
    await fireEvent.press(screen.getByTestId(iconId));
    expect(screen.getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(
      recipeColumnsNames.time
    );

    await screen.rerender(renderTimeField(scannedTime, setTime));
    setTime.mockClear();
    await fireEvent(screen.getByTestId(inputId), 'blur');

    expect(setTime).not.toHaveBeenCalled();
    expect(screen.getByTestId(inputId).props.value).toBe(String(scannedTime));
    dismissSpy.mockRestore();
  });
});
