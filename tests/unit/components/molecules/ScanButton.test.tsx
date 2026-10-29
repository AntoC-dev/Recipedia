import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ScanButton } from '@components/molecules/ScanButton';
import { Icons } from '@assets/Icons';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import {
  IMAGE_MODAL_TARGET_TEST_ID,
  renderWithRecipeDialogs,
} from '@mocks/context/RecipeDialogsHarness';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

describe('ScanButton', () => {
  const testID = 'RecipeTitle::OpenModal';
  const buttonId = testID + '::RoundButton';

  const renderScanButton = (props: Partial<React.ComponentProps<typeof ScanButton>> = {}) =>
    renderWithRecipeDialogs(
      <ScanButton testID={testID} field={recipeColumnsNames.title} {...props} />
    );

  test('renders the provided testID as is', () => {
    const { getByTestId } = renderScanButton();

    expect(getByTestId(buttonId)).toBeTruthy();
  });

  test('renders the scan icon', () => {
    const { getByTestId } = renderScanButton();

    expect(getByTestId(buttonId + '::Icon')).toHaveTextContent(Icons.scanImageIcon);
  });

  test.each([
    [recipeColumnsNames.title, 'recipe.roundButton.scan'],
    [recipeColumnsNames.preparation, 'recipe.roundButton.scan'],
    [recipeColumnsNames.nutrition, 'recipe.roundButton.scan'],
    ['ingredientNames' as const, 'recipe.roundButton.scanNames'],
    ['ingredientQuantities' as const, 'recipe.roundButton.scanQuantities'],
  ])('renders the label derived from the %s field', (field, expectedLabel) => {
    const { getByTestId } = renderScanButton({ field });

    expect(getByTestId(buttonId + '::Label')).toHaveTextContent(expectedLabel);
  });

  test.each([
    recipeColumnsNames.title,
    recipeColumnsNames.nutrition,
    'ingredientNames' as const,
    'ingredientQuantities' as const,
  ])('opens the image modal targeting %s when pressed', field => {
    const { getByTestId } = renderScanButton({ field });
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent('none');

    fireEvent.press(getByTestId(buttonId));

    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(field);
  });

  test('forwards the style to the button container', () => {
    const { getByTestId } = renderScanButton({ style: { marginTop: 24 } });

    expect(getByTestId(buttonId + '::Container')).toHaveStyle({ marginTop: 24 });
  });
});
