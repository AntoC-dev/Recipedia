import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import {
  IMAGE_MODAL_TARGET_TEST_ID,
  renderWithRecipeDialogs,
} from '@mocks/context/RecipeDialogsHarness';
import { NutritionEmptyState } from '@components/molecules/NutritionEmptyState';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/atomic/RoundButton', () => ({
  RoundButton: require('@mocks/components/atomic/RoundButton-mock').roundButtonMock,
}));

const defaultTestId = 'test';
const expectationTestId = defaultTestId + '::NutritionEmptyState::';
const mockOnButtonPressed = jest.fn();

describe('NutritionEmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('without withScan', () => {
    test('renders with title and add button', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <NutritionEmptyState onButtonPressed={mockOnButtonPressed} parentTestId={defaultTestId} />
      );

      expect(getByTestId(expectationTestId + 'Title').props.children).toEqual(
        'recipe.nutrition.titleSimple'
      );
      expect(
        getByTestId(expectationTestId + 'AddButton::RoundButton::OnPressFunction')
      ).toBeTruthy();
      expect(
        getByTestId(expectationTestId + 'AddButton::RoundButton::Label').props.children
      ).toEqual('recipe.roundButton.addManually');
    });

    test('calls onButtonPressed when add button is pressed', () => {
      const localMockOnButtonPressed = jest.fn();

      const { getByTestId } = renderWithRecipeDialogs(
        <NutritionEmptyState
          onButtonPressed={localMockOnButtonPressed}
          parentTestId={defaultTestId}
        />
      );

      fireEvent.press(getByTestId(expectationTestId + 'AddButton::RoundButton::OnPressFunction'));
      expect(localMockOnButtonPressed).toHaveBeenCalled();
    });

    test('does not render the scan button', () => {
      const { queryByTestId } = renderWithRecipeDialogs(
        <NutritionEmptyState onButtonPressed={mockOnButtonPressed} parentTestId={defaultTestId} />
      );

      expect(
        queryByTestId(expectationTestId + 'OCRButton::RoundButton::OnPressFunction')
      ).toBeNull();
    });

    test('renders with custom parentTestId', () => {
      const customTestId = 'CustomTest';
      const { getByTestId } = renderWithRecipeDialogs(
        <NutritionEmptyState onButtonPressed={mockOnButtonPressed} parentTestId={customTestId} />
      );

      const customExpectation = customTestId + '::NutritionEmptyState::';
      expect(getByTestId(customExpectation + 'Title').props.children).toEqual(
        'recipe.nutrition.titleSimple'
      );
      expect(
        getByTestId(customExpectation + 'AddButton::RoundButton::OnPressFunction')
      ).toBeTruthy();
    });
  });

  describe('with withScan', () => {
    test('renders with title and scan button', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <NutritionEmptyState
          onButtonPressed={mockOnButtonPressed}
          withScan
          parentTestId={defaultTestId}
        />
      );

      expect(getByTestId(expectationTestId + 'Title').props.children).toEqual(
        'recipe.nutrition.titleSimple'
      );
      expect(
        getByTestId(expectationTestId + 'OCRButton::RoundButton::OnPressFunction')
      ).toBeTruthy();
      expect(
        getByTestId(expectationTestId + 'OCRButton::RoundButton::Label').props.children
      ).toEqual('recipe.roundButton.scan');
    });

    test('opens the image modal on the nutrition field instead of calling onButtonPressed', () => {
      const localMockOnButtonPressed = jest.fn();

      const { getByTestId } = renderWithRecipeDialogs(
        <NutritionEmptyState
          onButtonPressed={localMockOnButtonPressed}
          withScan
          parentTestId={defaultTestId}
        />
      );

      fireEvent.press(getByTestId(expectationTestId + 'OCRButton::RoundButton::OnPressFunction'));
      expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(
        recipeColumnsNames.nutrition
      );
      expect(localMockOnButtonPressed).not.toHaveBeenCalled();
    });

    test('does not render the add button', () => {
      const { queryByTestId } = renderWithRecipeDialogs(
        <NutritionEmptyState
          onButtonPressed={mockOnButtonPressed}
          withScan
          parentTestId={defaultTestId}
        />
      );

      expect(
        queryByTestId(expectationTestId + 'AddButton::RoundButton::OnPressFunction')
      ).toBeNull();
    });
  });
});
