import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import {
  IMAGE_MODAL_TARGET_TEST_ID,
  renderWithRecipeDialogs,
} from '@mocks/context/RecipeDialogsHarness';
import { RecipeNutrition } from '@components/organisms/RecipeNutrition';
import { nutritionTableElement, recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import { recipeStateType } from '@customTypes/ScreenTypes';
import { defaultValueNumber } from '@utils/Constants';

jest.mock('@components/atomic/RoundButton', () => ({
  RoundButton: require('@mocks/components/atomic/RoundButton-mock').roundButtonMock,
}));
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/molecules/NutritionTable', () =>
  require('@mocks/components/molecules/NutritionTable-mock')
);
jest.mock('@components/molecules/NutritionEmptyState', () =>
  require('@mocks/components/molecules/NutritionEmptyState-mock')
);

const mockNutrition: nutritionTableElement = {
  energyKcal: 250,
  energyKj: 1046,
  fat: 15.0,
  saturatedFat: 8.0,
  carbohydrates: 25.0,
  sugars: 12.0,
  fiber: 2.5,
  protein: 6.0,
  salt: 0.8,
  portionWeight: 100,
};

const defaultTestId = 'test';
const nutritionTableTestId = defaultTestId + '::RecipeNutrition::NutritionTable';
const nutritionEmptyStateTestId = defaultTestId + '::RecipeNutrition::NutritionEmptyState';

const mockOnChange = jest.fn();

describe('RecipeNutrition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Read-only mode', () => {
    test('renders nutrition table with basic structure', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={mockNutrition}
          mode={recipeStateType.readOnly}
          parentTestId={defaultTestId}
        />
      );

      expect(getByTestId(nutritionTableTestId)).toBeTruthy();
      expect(getByTestId(nutritionTableTestId + '::IsEditable').props.children).toEqual(false);
      expect(getByTestId(nutritionTableTestId + '::ShowRemoveButton').props.children).toEqual(
        false
      );
      expect(JSON.parse(getByTestId(nutritionTableTestId + '::Nutrition').props.children)).toEqual(
        mockNutrition
      );
    });

    test('does not render when no nutrition data provided', () => {
      const { queryByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={undefined}
          mode={recipeStateType.readOnly}
          parentTestId={defaultTestId}
        />
      );

      expect(queryByTestId(nutritionTableTestId)).toBeNull();
      expect(queryByTestId(nutritionEmptyStateTestId)).toBeNull();
    });

    test('renders with different portion weight', () => {
      const nutritionWithPortion: nutritionTableElement = {
        ...mockNutrition,
        portionWeight: 150,
      };

      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={nutritionWithPortion}
          mode={recipeStateType.readOnly}
          parentTestId={defaultTestId}
        />
      );

      expect(getByTestId(nutritionTableTestId)).toBeTruthy();
      expect(getByTestId(nutritionTableTestId + '::IsEditable').props.children).toBe(false);
      expect(
        JSON.parse(getByTestId(nutritionTableTestId + '::Nutrition').props.children).portionWeight
      ).toBe(150);
    });

    test('renders with decimal nutrition values', () => {
      const nutritionWithDecimals: nutritionTableElement = {
        ...mockNutrition,
        energyKcal: 123.456,
        fat: 1.23,
        salt: 0.123,
      };

      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={nutritionWithDecimals}
          mode={recipeStateType.readOnly}
          parentTestId={defaultTestId}
        />
      );

      const parsedData = JSON.parse(
        getByTestId(nutritionTableTestId + '::Nutrition').props.children
      );
      expect(parsedData.energyKcal).toBe(nutritionWithDecimals.energyKcal);
      expect(parsedData.fat).toBe(nutritionWithDecimals.fat);
      expect(parsedData.salt).toBe(nutritionWithDecimals.salt);
    });
  });

  describe('Add manual mode', () => {
    test('shows empty state when no nutrition data', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={undefined}
          mode={recipeStateType.addManual}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
        />
      );

      expect(getByTestId(nutritionEmptyStateTestId)).toBeTruthy();
      expect(getByTestId(nutritionEmptyStateTestId + '::ParentTestId').props.children).toBe(
        defaultTestId + '::RecipeNutrition'
      );
      expect(getByTestId(nutritionEmptyStateTestId + '::OnAddNutrition')).toBeTruthy();
    });

    test('calls onNutritionChange when adding nutrition', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={undefined}
          mode={recipeStateType.addManual}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
        />
      );

      fireEvent.press(getByTestId(nutritionEmptyStateTestId + '::OnAddNutrition'));

      expect(mockOnChange).toHaveBeenCalledWith({
        energyKcal: defaultValueNumber,
        energyKj: defaultValueNumber,
        fat: defaultValueNumber,
        saturatedFat: defaultValueNumber,
        carbohydrates: defaultValueNumber,
        sugars: defaultValueNumber,
        fiber: defaultValueNumber,
        protein: defaultValueNumber,
        salt: defaultValueNumber,
        portionWeight: defaultValueNumber,
      });
    });
  });

  describe('Add OCR mode', () => {
    test('shows empty state with OCR button when no nutrition data', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={undefined}
          mode={recipeStateType.addOCR}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
          withScan
        />
      );

      expect(getByTestId(nutritionEmptyStateTestId)).toBeTruthy();
      expect(getByTestId(nutritionEmptyStateTestId + '::ParentTestId').props.children).toBe(
        defaultTestId + '::RecipeNutrition'
      );
      expect(getByTestId(nutritionEmptyStateTestId + '::OnOCRNutrition')).toBeTruthy();
    });

    test('opens the OCR modal for nutrition when OCR button is pressed', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={undefined}
          mode={recipeStateType.addOCR}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
          withScan
        />
      );

      fireEvent.press(getByTestId(nutritionEmptyStateTestId + '::OnOCRNutrition'));

      expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(
        recipeColumnsNames.nutrition
      );
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    test('shows nutrition table when nutrition data is available', () => {
      const { getByTestId, queryByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={mockNutrition}
          mode={recipeStateType.addOCR}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
          withScan
        />
      );

      expect(getByTestId(nutritionTableTestId)).toBeTruthy();
      expect(queryByTestId(nutritionEmptyStateTestId)).toBeNull();
      expect(getByTestId(nutritionTableTestId + '::IsEditable').props.children).toEqual(true);
      expect(getByTestId(nutritionTableTestId + '::ShowRemoveButton').props.children).toEqual(true);
    });
  });

  describe('Add OCR mode scan button', () => {
    const scanButtonTestId = defaultTestId + '::RecipeNutrition::OpenModal';
    test('renders scan button under the table and opens the OCR modal on press', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={mockNutrition}
          mode={recipeStateType.addOCR}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
          withScan
        />
      );

      expect(getByTestId(scanButtonTestId + '::RoundButton::Icon').props.children).toBe(
        'line-scan'
      );
      expect(getByTestId(scanButtonTestId + '::RoundButton::Label').props.children).toBe(
        'recipe.roundButton.scan'
      );

      fireEvent.press(getByTestId(scanButtonTestId + '::RoundButton::OnPressFunction'));

      expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(
        recipeColumnsNames.nutrition
      );
    });

    test.each([recipeStateType.edit, recipeStateType.addManual, recipeStateType.readOnly])(
      'does not render scan button in %s mode',
      mode => {
        const { queryByTestId } = renderWithRecipeDialogs(
          <RecipeNutrition nutrition={mockNutrition} mode={mode} parentTestId={defaultTestId} />
        );

        expect(queryByTestId(scanButtonTestId + '::RoundButton::OnPressFunction')).toBeNull();
      }
    );

    test('does not render scan button in addOCR mode without withScan', () => {
      const { queryByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={mockNutrition}
          mode={recipeStateType.addOCR}
          parentTestId={defaultTestId}
        />
      );

      expect(queryByTestId(scanButtonTestId + '::RoundButton::OnPressFunction')).toBeNull();
    });
  });

  describe('Edit mode', () => {
    test('renders editable table with remove button', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={mockNutrition}
          mode={recipeStateType.edit}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
        />
      );

      expect(getByTestId(nutritionTableTestId)).toBeTruthy();
      expect(getByTestId(nutritionTableTestId + '::IsEditable').props.children).toEqual(true);
      expect(getByTestId(nutritionTableTestId + '::ShowRemoveButton').props.children).toEqual(true);
      expect(getByTestId(nutritionTableTestId + '::OnRemoveNutrition')).toBeTruthy();
      expect(JSON.parse(getByTestId(nutritionTableTestId + '::Nutrition').props.children)).toEqual(
        mockNutrition
      );
    });

    test('calls onNutritionChange when nutrition values change', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={mockNutrition}
          mode={recipeStateType.edit}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
        />
      );

      fireEvent.press(getByTestId(nutritionTableTestId + '::OnNutritionChange'));

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockNutrition,
        energyKcal: 300,
      });
    });

    test('calls onNutritionChange when removing nutrition', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={mockNutrition}
          mode={recipeStateType.edit}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
        />
      );

      fireEvent.press(getByTestId(nutritionTableTestId + '::OnRemoveNutrition'));

      expect(mockOnChange).toHaveBeenCalledWith(undefined);
    });

    test('handles nutrition changes with partial updates', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={mockNutrition}
          mode={recipeStateType.edit}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
        />
      );

      fireEvent.press(getByTestId(nutritionTableTestId + '::OnNutritionChange'));

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockNutrition,
        energyKcal: 300,
      });
    });
  });

  describe('Component props and behavior', () => {
    test('renders with custom testID structure', () => {
      const customTestId = 'CustomNutritionTest';
      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={mockNutrition}
          mode={recipeStateType.readOnly}
          parentTestId={customTestId}
        />
      );

      const expectedTestId = customTestId + '::RecipeNutrition::NutritionTable';

      expect(getByTestId(expectedTestId)).toBeTruthy();
      expect(JSON.parse(getByTestId(expectedTestId + '::Nutrition').props.children)).toEqual(
        mockNutrition
      );
    });

    test('handles mode transitions correctly', () => {
      const mockOnChange = jest.fn();
      // Test addManual mode with no data shows empty state
      const { rerender, queryByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={undefined}
          mode={recipeStateType.addManual}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
        />
      );

      expect(queryByTestId(nutritionEmptyStateTestId)).toBeTruthy();
      expect(queryByTestId(nutritionTableTestId)).toBeNull();

      // Test addOCR mode with no data shows empty state with OCR button
      rerender(
        <RecipeNutrition
          nutrition={undefined}
          mode={recipeStateType.addOCR}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
          withScan
        />
      );

      expect(queryByTestId(nutritionEmptyStateTestId)).toBeTruthy();
      expect(queryByTestId(nutritionTableTestId)).toBeNull();
      expect(queryByTestId(nutritionEmptyStateTestId + '::OnOCRNutrition')).toBeTruthy();

      // Test readOnly mode with data shows table
      rerender(
        <RecipeNutrition
          nutrition={mockNutrition}
          mode={recipeStateType.readOnly}
          parentTestId={defaultTestId}
        />
      );

      expect(queryByTestId(nutritionEmptyStateTestId)).toBeNull();
      expect(queryByTestId(nutritionTableTestId)).toBeTruthy();

      // Test edit mode with data shows editable table
      rerender(
        <RecipeNutrition
          nutrition={mockNutrition}
          mode={recipeStateType.edit}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
        />
      );

      expect(queryByTestId(nutritionEmptyStateTestId)).toBeNull();
      expect(queryByTestId(nutritionTableTestId)).toBeTruthy();
      expect(queryByTestId(nutritionTableTestId + '::IsEditable')?.props.children).toEqual(true);
    });

    test('handles nutrition data with various portion weights', () => {
      const nutritionWith150gPortion: nutritionTableElement = {
        ...mockNutrition,
        portionWeight: 150,
      };

      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={nutritionWith150gPortion}
          mode={recipeStateType.readOnly}
          parentTestId={defaultTestId}
        />
      );

      const parsedData = JSON.parse(
        getByTestId(nutritionTableTestId + '::Nutrition').props.children
      );

      expect(parsedData.portionWeight).toBe(150);
      expect(parsedData.energyKcal).toBe(mockNutrition.energyKcal);
    });
  });

  describe('Error display', () => {
    test('renders error helper below table when error prop provided', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={mockNutrition}
          mode={recipeStateType.edit}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
          error='Nutrition is invalid'
        />
      );
      const helper = getByTestId(defaultTestId + '::RecipeNutrition::Error');
      expect(helper.props.children).toBe('Nutrition is invalid');
      expect(helper.props.type).toBe('error');
    });

    test('renders error helper below empty state when nutrition missing in edit mode', () => {
      const { getByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={undefined}
          mode={recipeStateType.addManual}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
          error='Required'
        />
      );
      expect(getByTestId(defaultTestId + '::RecipeNutrition::Error').props.children).toBe(
        'Required'
      );
    });

    test('omits error helper when error prop is absent', () => {
      const { queryByTestId } = renderWithRecipeDialogs(
        <RecipeNutrition
          nutrition={mockNutrition}
          mode={recipeStateType.edit}
          onNutritionChange={mockOnChange}
          parentTestId={defaultTestId}
        />
      );
      expect(queryByTestId(defaultTestId + '::RecipeNutrition::Error')).toBeNull();
    });
  });
});
