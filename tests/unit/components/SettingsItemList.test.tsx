import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import SettingsItemList, { SettingsItemListProps } from '@components/organisms/SettingsItemList';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import { ingredientTableElement, tagTableElement } from '@customTypes/DatabaseElementTypes';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

jest.mock('@components/molecules/SettingsItemCard', () => ({
  SettingsItemCard: require('@mocks/components/molecules/SettingsItemCard-mock')
    .settingsItemCardMock,
}));

describe('SettingsItemList Component', () => {
  const mockTags = [testTags[7], testTags[0], testTags[8]];

  const mockIngredients = [testIngredients[1], testIngredients[4]];

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ingredient', () => {
    const defaultProps: SettingsItemListProps<ingredientTableElement> = {
      testIdPrefix: 'IngredientList',
      type: 'ingredient',
      items: mockIngredients,
      onEdit: mockOnEdit,
      onDelete: mockOnDelete,
    };

    test('renders', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      let index = 0;
      for (const ingredient of defaultProps.items) {
        expect(
          getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::${index}::Type`).props
            .children
        ).toEqual('ingredient');
        expect(
          getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::${index}::Item`).props
            .children
        ).toEqual(JSON.stringify(ingredient));
        expect(
          getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::${index}::OnEdit`)
        ).toBeTruthy();
        expect(
          getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::${index}::OnDelete`)
        ).toBeTruthy();
        ++index;
      }
    });

    test('calls onEditPress when edit button is pressed', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.press(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::OnEdit`));

      expect(mockOnEdit).toHaveBeenCalledWith(defaultProps.items[0]);
    });

    test('calls onDeletePress when delete button is pressed', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.press(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::OnDelete`));

      expect(mockOnDelete).toHaveBeenCalledWith(defaultProps.items[0]);
    });

    test('renders the search bar', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      expect(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`)).toBeTruthy();
    });

    test('shows all items when search query is empty', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      expect(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::Item`)).toBeTruthy();
      expect(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::1::Item`)).toBeTruthy();
    });

    test('filters items by name (case-insensitive)', () => {
      const { getByTestId, queryByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'ground');

      expect(
        getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::Item`).props.children
      ).toEqual(JSON.stringify(mockIngredients[0]));
      expect(queryByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::1::Item`)).toBeNull();
    });

    test('shows no items when no match', () => {
      const { getByTestId, queryByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'xyz');

      expect(queryByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::Item`)).toBeNull();
    });

    test('clears filter when search is cleared', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'ground');
      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), '');

      expect(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::Item`)).toBeTruthy();
      expect(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::1::Item`)).toBeTruthy();
    });

    test('filters are applied per character', () => {
      const { getByTestId, queryByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'tac');

      expect(
        getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::Item`).props.children
      ).toEqual(JSON.stringify(mockIngredients[1]));
      expect(queryByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::1::Item`)).toBeNull();
    });
  });

  describe('tag', () => {
    const defaultProps: SettingsItemListProps<tagTableElement> = {
      testIdPrefix: 'TagList',
      type: 'tag',
      items: mockTags,
      onEdit: mockOnEdit,
      onDelete: mockOnDelete,
    };

    test('renders', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      let index = 0;
      for (const tag of defaultProps.items) {
        expect(
          getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::${index}::Type`).props
            .children
        ).toEqual('tag');
        expect(
          getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::${index}::Item`).props
            .children
        ).toEqual(JSON.stringify(tag));
        expect(
          getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::${index}::OnEdit`)
        ).toBeTruthy();
        expect(
          getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::${index}::OnDelete`)
        ).toBeTruthy();
        ++index;
      }
    });

    test('calls onEditPress when edit button is pressed', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.press(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::OnEdit`));

      expect(mockOnEdit).toHaveBeenCalledWith(defaultProps.items[0]);
    });

    test('calls onDeletePress when delete button is pressed', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.press(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::OnDelete`));

      expect(mockOnDelete).toHaveBeenCalledWith(defaultProps.items[0]);
    });

    test('renders the search bar', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      expect(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`)).toBeTruthy();
    });

    test('shows all items when search query is empty', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      expect(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::Item`)).toBeTruthy();
      expect(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::1::Item`)).toBeTruthy();
      expect(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::2::Item`)).toBeTruthy();
    });

    test('filters items by name (case-insensitive)', () => {
      const { getByTestId, queryByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'soup');

      expect(
        getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::Item`).props.children
      ).toEqual(JSON.stringify(mockTags[0]));
      expect(queryByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::1::Item`)).toBeNull();
    });

    test('shows no items when no match', () => {
      const { getByTestId, queryByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'xyz');

      expect(queryByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::Item`)).toBeNull();
    });

    test('clears filter when search is cleared', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'soup');
      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), '');

      expect(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::Item`)).toBeTruthy();
      expect(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::1::Item`)).toBeTruthy();
      expect(getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::2::Item`)).toBeTruthy();
    });

    test('filters are applied per character', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'ital');

      expect(
        getByTestId(`${defaultProps.testIdPrefix}::SettingsItemCard::0::Item`).props.children
      ).toEqual(JSON.stringify(mockTags[1]));
    });
  });
});
