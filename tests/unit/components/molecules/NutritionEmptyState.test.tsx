import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { NutritionEmptyState } from '@components/molecules/NutritionEmptyState';

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

  describe('Add mode', () => {
    test('renders with title and add button', async () => {
      const { getByTestId } = await render(
        <NutritionEmptyState
          onButtonPressed={mockOnButtonPressed}
          mode='add'
          parentTestId={defaultTestId}
        />
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

    test('calls onButtonPressed when add button is pressed', async () => {
      const localMockOnButtonPressed = jest.fn();

      const { getByTestId } = await render(
        <NutritionEmptyState
          onButtonPressed={localMockOnButtonPressed}
          mode='add'
          parentTestId={defaultTestId}
        />
      );

      await fireEvent.press(
        getByTestId(expectationTestId + 'AddButton::RoundButton::OnPressFunction')
      );
      expect(localMockOnButtonPressed).toHaveBeenCalled();
    });

    test('renders with custom parentTestId', async () => {
      const customTestId = 'CustomTest';
      const { getByTestId } = await render(
        <NutritionEmptyState
          onButtonPressed={mockOnButtonPressed}
          mode='add'
          parentTestId={customTestId}
        />
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

  describe('OCR mode', () => {
    test('renders with title and OCR button', async () => {
      const { getByTestId } = await render(
        <NutritionEmptyState
          onButtonPressed={mockOnButtonPressed}
          mode='ocr'
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

    test('calls onButtonPressed when OCR button is pressed', async () => {
      const localMockOnButtonPressed = jest.fn();

      const { getByTestId } = await render(
        <NutritionEmptyState
          onButtonPressed={localMockOnButtonPressed}
          mode='ocr'
          parentTestId={defaultTestId}
        />
      );

      await fireEvent.press(
        getByTestId(expectationTestId + 'OCRButton::RoundButton::OnPressFunction')
      );
      expect(localMockOnButtonPressed).toHaveBeenCalled();
    });

    test('renders with custom parentTestId in OCR mode', async () => {
      const customTestId = 'CustomTest';
      const { getByTestId } = await render(
        <NutritionEmptyState
          onButtonPressed={mockOnButtonPressed}
          mode='ocr'
          parentTestId={customTestId}
        />
      );

      const customExpectation = customTestId + '::NutritionEmptyState::';
      expect(getByTestId(customExpectation + 'Title').props.children).toEqual(
        'recipe.nutrition.titleSimple'
      );
      expect(
        getByTestId(customExpectation + 'OCRButton::RoundButton::OnPressFunction')
      ).toBeTruthy();
    });
  });
});
