import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { NutritionTable } from '@components/molecules/NutritionTable';
import { nutritionTableElement } from '@customTypes/DatabaseElementTypes';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/molecules/NutritionRow', () =>
  require('@mocks/components/molecules/NutritionRow-mock')
);
jest.mock('@components/molecules/NutritionEditForm', () =>
  require('@mocks/components/molecules/NutritionEditForm-mock')
);
jest.mock('@components/dialogs/Alert', () => ({
  Alert: require('@mocks/components/dialogs/Alert-mock').alertMock,
}));

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

describe('NutritionTable', () => {
  const testId = 'test';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Read-only mode', () => {
    test('renders with nutrition data and title', async () => {
      const { getByTestId } = await render(
        <NutritionTable nutrition={mockNutrition} parentTestId={testId} />
      );

      expect(getByTestId(`${testId}::NutritionTable`)).toBeTruthy();
      expect(getByTestId(`${testId}::NutritionTable::Title`).props.children).toBe(
        'recipe.nutrition.title'
      );
    });

    test('renders in read-only mode without subtitle (indicates segmented buttons present)', async () => {
      const { getByTestId, queryByTestId } = await render(
        <NutritionTable nutrition={mockNutrition} parentTestId={testId} />
      );

      expect(getByTestId(`${testId}::NutritionTable`)).toBeTruthy();
      expect(getByTestId(`${testId}::NutritionTable::Title`)).toBeTruthy();

      // Verify we're in read-only mode (no subtitle, which indicates segmented buttons are present)
      expect(queryByTestId(`${testId}::NutritionTable::Subtitle`)).toBeNull();
      expect(queryByTestId(`${testId}::NutritionTable::EditForm`)).toBeNull();
    });

    test('renders all nutrition rows with correct testIds and values', async () => {
      const { getByTestId } = await render(
        <NutritionTable nutrition={mockNutrition} parentTestId={testId} />
      );

      const nutritionData = [
        { field: 'EnergyKcal', expectedValue: '250', expectedLabel: 'recipe.nutrition.energyKcal' },
        { field: 'EnergyKj', expectedValue: '1046', expectedLabel: 'recipe.nutrition.energyKj' },
        { field: 'Fat', expectedValue: '15', expectedLabel: 'recipe.nutrition.fat' },
        {
          field: 'SaturatedFat',
          expectedValue: '8',
          expectedLabel: 'recipe.nutrition.saturatedFat',
        },
        {
          field: 'Carbohydrates',
          expectedValue: '25',
          expectedLabel: 'recipe.nutrition.carbohydrates',
        },
        { field: 'Sugars', expectedValue: '12', expectedLabel: 'recipe.nutrition.sugars' },
        { field: 'Fiber', expectedValue: '2.5', expectedLabel: 'recipe.nutrition.fiber' },
        { field: 'Protein', expectedValue: '6', expectedLabel: 'recipe.nutrition.protein' },
        { field: 'Salt', expectedValue: '0.8', expectedLabel: 'recipe.nutrition.salt' },
      ];

      nutritionData.forEach(({ field, expectedValue, expectedLabel }) => {
        expect(getByTestId(`${testId}::NutritionTable::NutritionRow::${field}`)).toBeTruthy();

        expect(
          getByTestId(`${testId}::NutritionTable::NutritionRow::${field}::Label`).props.children
        ).toBe(expectedLabel);

        expect(
          getByTestId(`${testId}::NutritionTable::NutritionRow::${field}::Value`).props.children
        ).toBe(expectedValue);
      });
    });

    test('renders component successfully in read-only mode', async () => {
      const { getByTestId, queryByTestId } = await render(
        <NutritionTable nutrition={mockNutrition} parentTestId={testId} />
      );

      expect(getByTestId(`${testId}::NutritionTable`)).toBeTruthy();
      expect(getByTestId(`${testId}::NutritionTable::Title`)).toBeTruthy();

      // Verify component is in read-only mode (SegmentedButtons cannot be tested directly)
      expect(queryByTestId(`${testId}::NutritionTable::Subtitle`)).toBeNull();
      expect(queryByTestId(`${testId}::NutritionTable::EditForm`)).toBeNull();

      // Verify nutrition rows are rendered
      expect(getByTestId(`${testId}::NutritionTable::NutritionRow::EnergyKcal`)).toBeTruthy();
    });

    test('does not render edit form in read-only mode', async () => {
      const { queryByTestId } = await render(
        <NutritionTable nutrition={mockNutrition} parentTestId={testId} />
      );

      expect(queryByTestId(`${testId}::NutritionTable::EditForm`)).toBeNull();
    });
  });

  describe('Edit mode', () => {
    test('renders subtitle instead of segmented buttons when editable', async () => {
      const { getByTestId } = await render(
        <NutritionTable nutrition={mockNutrition} isEditable={true} parentTestId={testId} />
      );

      expect(getByTestId(`${testId}::NutritionTable::Subtitle`).props.children).toBe(
        'recipe.nutrition.per100g'
      );
    });

    test('renders edit form when isEditable is true', async () => {
      const mockOnNutritionChange = jest.fn();
      const mockOnRemoveNutrition = jest.fn();

      const { getByTestId } = await render(
        <NutritionTable
          nutrition={mockNutrition}
          isEditable={true}
          onNutritionChange={mockOnNutritionChange}
          onRemoveNutrition={mockOnRemoveNutrition}
          showRemoveButton={true}
          parentTestId={testId}
        />
      );

      expect(getByTestId(`${testId}::NutritionTable::EditForm`)).toBeTruthy();

      expect(getByTestId(`${testId}::NutritionTable::EditForm::PortionWeight`).props.children).toBe(
        '100'
      );

      expect(
        getByTestId(`${testId}::NutritionTable::EditForm::ShowRemoveButton`).props.children
      ).toBe('true');
    });

    test('calls onNutritionChange when nutrition row values change', async () => {
      const mockOnNutritionChange = jest.fn();

      const { getByTestId } = await render(
        <NutritionTable
          nutrition={mockNutrition}
          isEditable={true}
          onNutritionChange={mockOnNutritionChange}
          parentTestId={testId}
        />
      );

      await fireEvent.press(
        getByTestId(`${testId}::NutritionTable::NutritionRow::EnergyKcal::OnValueChange`)
      );

      expect(mockOnNutritionChange).toHaveBeenCalledWith({ energyKcal: 999 });
    });

    test('calls onNutritionChange when portion weight changes', async () => {
      const mockOnNutritionChange = jest.fn();

      const { getByTestId } = await render(
        <NutritionTable
          nutrition={mockNutrition}
          isEditable={true}
          onNutritionChange={mockOnNutritionChange}
          parentTestId={testId}
        />
      );

      await fireEvent.press(
        getByTestId(`${testId}::NutritionTable::EditForm::OnPortionWeightChange`)
      );

      expect(mockOnNutritionChange).toHaveBeenCalledWith({ portionWeight: 150 });
    });
  });

  describe('Delete functionality', () => {
    test('shows delete dialog when remove button pressed in edit form', async () => {
      const mockOnRemoveNutrition = jest.fn();

      const { getByTestId } = await render(
        <NutritionTable
          nutrition={mockNutrition}
          isEditable={true}
          onRemoveNutrition={mockOnRemoveNutrition}
          showRemoveButton={true}
          parentTestId={testId}
        />
      );

      expect(getByTestId(`${testId}::DeleteAlert::Alert::Title`).props.children).toBe(
        'recipe.nutrition.removeNutrition'
      );

      expect(getByTestId(`${testId}::DeleteAlert::Alert::Content`).props.children).toBe(
        'recipe.nutrition.confirmDelete'
      );
    });

    test('calls onRemoveNutrition when delete is confirmed', async () => {
      const mockOnRemoveNutrition = jest.fn();

      const { getByTestId } = await render(
        <NutritionTable
          nutrition={mockNutrition}
          isEditable={true}
          onRemoveNutrition={mockOnRemoveNutrition}
          showRemoveButton={true}
          parentTestId={testId}
        />
      );

      await fireEvent.press(getByTestId(`${testId}::NutritionTable::EditForm::OnRemoveNutrition`));

      await fireEvent.press(getByTestId(`${testId}::DeleteAlert::Alert::OnConfirm`));

      expect(mockOnRemoveNutrition).toHaveBeenCalledTimes(1);
    });

    test('does not call onRemoveNutrition when delete is canceled', async () => {
      const mockOnRemoveNutrition = jest.fn();

      const { getByTestId } = await render(
        <NutritionTable
          nutrition={mockNutrition}
          isEditable={true}
          onRemoveNutrition={mockOnRemoveNutrition}
          showRemoveButton={true}
          parentTestId={testId}
        />
      );

      await fireEvent.press(getByTestId(`${testId}::NutritionTable::EditForm::OnRemoveNutrition`));

      await fireEvent.press(getByTestId(`${testId}::DeleteAlert::Alert::OnCancel`));

      expect(mockOnRemoveNutrition).not.toHaveBeenCalled();
    });
  });

  describe('Props handling', () => {
    test('renders with correct testId structure', async () => {
      const customTestId = 'CustomTest';
      const { getByTestId } = await render(
        <NutritionTable nutrition={mockNutrition} parentTestId={customTestId} />
      );

      expect(getByTestId(`${customTestId}::NutritionTable`)).toBeTruthy();
      expect(getByTestId(`${customTestId}::NutritionTable::Title`).props.children).toBe(
        'recipe.nutrition.title'
      );
    });

    test('handles undefined onNutritionChange gracefully', async () => {
      const { getByTestId } = await render(
        <NutritionTable nutrition={mockNutrition} isEditable={true} parentTestId={testId} />
      );

      expect(getByTestId(`${testId}::NutritionTable`)).toBeTruthy();
      expect(getByTestId(`${testId}::NutritionTable::EditForm`)).toBeTruthy();

      // The component should render without errors even without onNutritionChange
      const portionWeightElement = getByTestId(
        `${testId}::NutritionTable::EditForm::PortionWeight`
      );
      expect(portionWeightElement.props.children).toBe('100');
    });

    test('handles undefined onRemoveNutrition gracefully', async () => {
      const { getByTestId } = await render(
        <NutritionTable
          nutrition={mockNutrition}
          isEditable={true}
          showRemoveButton={true}
          parentTestId={testId}
        />
      );

      expect(getByTestId(`${testId}::NutritionTable`)).toBeTruthy();
      expect(getByTestId(`${testId}::NutritionTable::EditForm`)).toBeTruthy();

      // The component should render without errors even without onRemoveNutrition
      const showRemoveButtonElement = getByTestId(
        `${testId}::NutritionTable::EditForm::ShowRemoveButton`
      );
      expect(showRemoveButtonElement.props.children).toBe('true');

      expect(getByTestId(`${testId}::NutritionTable::EditForm::PortionWeight`).props.children).toBe(
        '100'
      );
    });
  });
});
