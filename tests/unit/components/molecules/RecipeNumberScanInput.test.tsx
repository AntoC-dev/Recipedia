import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import {
  RecipeNumberScanInput,
  RecipeNumberScanInputProps,
} from '@components/molecules/RecipeNumberScanInput';
import { Icons } from '@assets/Icons';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import {
  IMAGE_MODAL_TARGET_TEST_ID,
  renderWithRecipeDialogs,
} from '@mocks/context/RecipeDialogsHarness';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/atomic/NumericTextInput', () => ({
  NumericTextInput: require('@mocks/components/atomic/NumericTextInput-mock').numericTextInputMock,
}));

describe('RecipeNumberScanInput', () => {
  const testID = 'RecipePersons';
  const inputId = testID + '::NumericTextInput';
  const iconId = testID + '::OpenModal::IconButton';
  const setTextToEdit = jest.fn();

  const renderInput = (props: Partial<RecipeNumberScanInputProps> = {}) =>
    renderWithRecipeDialogs(
      <RecipeNumberScanInput
        testID={testID}
        scanField={recipeColumnsNames.persons}
        textEditable={4}
        setTextToEdit={setTextToEdit}
        {...props}
      />
    );

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the numeric input with the current value', async () => {
    const { getByTestId } = await renderInput();

    expect(getByTestId(inputId).props.value).toBe('4');
  });

  test('renders the scan icon as the right adornment', async () => {
    const { getByTestId } = await renderInput();

    expect(getByTestId(inputId + '::Right')).toContainElement(getByTestId(iconId));
    expect(getByTestId(iconId + '::Icon')).toHaveTextContent(Icons.scanImageIcon);
    expect(getByTestId(iconId + '::Color')).toHaveTextContent('#6200ee');
    expect(getByTestId(iconId + '::ForceTextInputFocus')).toHaveTextContent('false');
  });

  test.each([
    [recipeColumnsNames.persons, 'recipe.roundButton.scan'],
    [recipeColumnsNames.time, 'recipe.roundButton.scan'],
    ['ingredientQuantities' as const, 'recipe.roundButton.scanQuantities'],
  ])('labels the icon for %s with %s', async (scanField, expectedLabel) => {
    const { getByTestId } = await renderInput({ scanField });

    expect(getByTestId(iconId + '::AccessibilityLabel')).toHaveTextContent(expectedLabel);
  });

  test.each([recipeColumnsNames.persons, recipeColumnsNames.time])(
    'opens the image modal targeting %s when the icon is pressed',
    async scanField => {
      const { getByTestId } = await renderInput({ scanField });
      expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent('none');

      await fireEvent.press(getByTestId(iconId));

      expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(scanField);
    }
  );

  test('forwards value changes and blur to the input', async () => {
    const onBlur = jest.fn();
    const { getByTestId } = await renderInput({ onBlur });

    await fireEvent.changeText(getByTestId(inputId), '8');
    await fireEvent(getByTestId(inputId), 'blur');

    expect(setTextToEdit).toHaveBeenCalledWith(8);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
