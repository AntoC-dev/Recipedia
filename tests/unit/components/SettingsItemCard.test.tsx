import { fireEvent, render } from '@testing-library/react-native';
import SettingsItemCard, { SettingsItemCardProps } from '@components/molecules/SettingsItemCard';
import { ingredientTableElement, tagTableElement } from '@customTypes/DatabaseElementTypes';
import { testIngredients } from '@test-data/ingredientsDataset';
import React from 'react';
import { testTags } from '@test-data/tagsDataset';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

jest.mock('@components/molecules/SeasonalityCalendar', () => ({
  SeasonalityCalendar: require('@mocks/components/molecules/SeasonalityCalendar-mock')
    .seasonalityCalendarMock,
}));

describe('SettingsItemCard Component', () => {
  const mockOnDelete = jest.fn();
  const mockOnEdit = jest.fn();

  const testIDProp = 'SettingsItemCard';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ingredient', () => {
    const defaultProps: SettingsItemCardProps<ingredientTableElement> = {
      type: 'ingredient',
      testIdPrefix: `${testIDProp}::10`,
      item: testIngredients[9]!,
      onEdit: mockOnEdit,
      onDelete: mockOnDelete,
    };
    test('renders without crashing', () => {
      const { getByTestId, queryByTestId } = render(<SettingsItemCard {...defaultProps} />);

      expect(queryByTestId(`${testIDProp}::10::TagName`)).toBeNull();
      expect(queryByTestId(`${testIDProp}::10::Unsupported`)).toBeNull();

      expect(getByTestId(`${testIDProp}::10::IngredientName`).props.children).toEqual(
        defaultProps.item.name
      );
      expect(getByTestId(`${testIDProp}::10::IntroType`).props.children).toEqual(['type', ':']);
      expect(getByTestId(`${testIDProp}::10::Type`).props.children).toEqual(defaultProps.item.type);
      expect(getByTestId(`${testIDProp}::10::IntroUnit`).props.children).toEqual(['unit', ':']);
      expect(getByTestId(`${testIDProp}::10::Unit`).props.children).toEqual(defaultProps.item.unit);

      expect(
        getByTestId(`${testIDProp}::10::SeasonalityCalendar::SelectedMonths`).props.children
      ).toEqual(JSON.stringify(defaultProps.item.season));
      expect(
        getByTestId(`${testIDProp}::10::SeasonalityCalendar::ReadOnly`).props.children
      ).toEqual(true);
      expect(getByTestId(`${testIDProp}::10::SeasonalityCalendar::OnMonthsChange`)).toBeTruthy();

      expect(getByTestId(`${testIDProp}::10::EditButton`)).toBeTruthy();
      expect(getByTestId(`${testIDProp}::10::DeleteButton`)).toBeTruthy();
    });

    test('edit button', () => {
      const { getByTestId } = render(<SettingsItemCard {...defaultProps} />);

      fireEvent.press(getByTestId(`${testIDProp}::10::EditButton`));

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(defaultProps.item);
    });

    test('delete button', () => {
      const { getByTestId } = render(<SettingsItemCard {...defaultProps} />);

      fireEvent.press(getByTestId(`${testIDProp}::10::DeleteButton`));

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(defaultProps.item);
    });
  });

  describe('tag', () => {
    const defaultProps: SettingsItemCardProps<tagTableElement> = {
      type: 'tag',
      testIdPrefix: `${testIDProp}::14`,
      item: testTags[13]!,
      onEdit: mockOnEdit,
      onDelete: mockOnDelete,
    };

    test('renders', () => {
      const { getByTestId, queryByTestId } = render(<SettingsItemCard {...defaultProps} />);

      expect(getByTestId(`${testIDProp}::14::TagName`).props.children).toEqual(
        defaultProps.item.name
      );
      expect(queryByTestId(`${testIDProp}::14::Unsupported`)).toBeNull();

      expect(queryByTestId(`${testIDProp}::14::IngredientName`)).toBeNull();
      expect(queryByTestId(`${testIDProp}::14::IntroType`)).toBeNull();
      expect(queryByTestId(`${testIDProp}::14::Type`)).toBeNull();
      expect(queryByTestId(`${testIDProp}::14::IntroUnit`)).toBeNull();
      expect(queryByTestId(`${testIDProp}::14::Unit`)).toBeNull();

      expect(queryByTestId(`${testIDProp}::14::SeasonalityCalendar::SelectedMonths`)).toBeNull();
      expect(queryByTestId(`${testIDProp}::14::SeasonalityCalendar::ReadOnly`)).toBeNull();
      expect(queryByTestId(`${testIDProp}::14::SeasonalityCalendar::OnMonthsChange`)).toBeNull();

      expect(queryByTestId(`${testIDProp}::14::EditButton`)).toBeTruthy();
      expect(queryByTestId(`${testIDProp}::14::DeleteButton`)).toBeTruthy();
    });

    test('edit button', () => {
      const { getByTestId } = render(<SettingsItemCard {...defaultProps} />);

      fireEvent.press(getByTestId(`${testIDProp}::14::EditButton`));

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(defaultProps.item);
    });

    test('delete button', () => {
      const { getByTestId } = render(<SettingsItemCard {...defaultProps} />);

      fireEvent.press(getByTestId(`${testIDProp}::14::DeleteButton`));

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(defaultProps.item);
    });
  });
});
