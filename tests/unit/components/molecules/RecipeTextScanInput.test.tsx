import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import {
  RecipeTextScanInput,
  RecipeTextScanInputProps,
} from '@components/molecules/RecipeTextScanInput';
import { Icons } from '@assets/Icons';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import {
  IMAGE_MODAL_TARGET_TEST_ID,
  renderWithRecipeDialogs,
} from '@mocks/context/RecipeDialogsHarness';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/atomic/CustomTextInput', () => ({
  CustomTextInput: require('@mocks/components/atomic/CustomTextInput-mock').CustomTextInputMock,
}));

describe('RecipeTextScanInput', () => {
  const testID = 'RecipeTitle';
  const iconId = testID + '::OpenModal::IconButton';
  const setTextToEdit = jest.fn();

  const renderInput = (props: Partial<RecipeTextScanInputProps> = {}) =>
    renderWithRecipeDialogs(
      <RecipeTextScanInput
        testID={testID}
        scanField={recipeColumnsNames.title}
        textEditable='filled'
        setTextToEdit={setTextToEdit}
        {...props}
      />
    );

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the text input with the current text', async () => {
    const { getByTestId } = await renderInput();

    expect(getByTestId(testID + '::CustomTextInput').props.value).toBe('filled');
  });

  test('renders the scan icon as the right adornment', async () => {
    const { getByTestId } = await renderInput();

    expect(getByTestId(testID + '::Right')).toContainElement(getByTestId(iconId));
    expect(getByTestId(iconId + '::Icon')).toHaveTextContent(Icons.scanImageIcon);
    expect(getByTestId(iconId + '::Color')).toHaveTextContent('#6200ee');
    expect(getByTestId(iconId + '::ForceTextInputFocus')).toHaveTextContent('false');
  });

  test.each([
    [recipeColumnsNames.title, 'recipe.roundButton.scan'],
    [recipeColumnsNames.description, 'recipe.roundButton.scan'],
    ['ingredientNames' as const, 'recipe.roundButton.scanNames'],
    ['ingredientQuantities' as const, 'recipe.roundButton.scanQuantities'],
  ])('labels the icon for %s with %s', async (scanField, expectedLabel) => {
    const { getByTestId } = await renderInput({ scanField });

    expect(getByTestId(iconId + '::AccessibilityLabel')).toHaveTextContent(expectedLabel);
  });

  test.each([recipeColumnsNames.title, recipeColumnsNames.description])(
    'opens the image modal targeting %s when the icon is pressed',
    async scanField => {
      const { getByTestId } = await renderInput({ scanField });
      expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent('none');

      await fireEvent.press(getByTestId(iconId));

      expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(scanField);
    }
  );

  test('forwards text changes and blur to the input', async () => {
    const onBlur = jest.fn();
    const { getByTestId } = await renderInput({ onBlur });

    await fireEvent.changeText(getByTestId(testID + '::CustomTextInput'), 'Updated');
    await fireEvent(getByTestId(testID + '::CustomTextInput'), 'blur');

    expect(setTextToEdit).toHaveBeenCalledWith('Updated');
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
