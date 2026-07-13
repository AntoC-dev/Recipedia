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
  const mockTags = [testTags[7]!, testTags[0]!, testTags[8]!];

  const mockIngredients = [testIngredients[1]!, testIngredients[4]!];

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

      for (const ingredient of defaultProps.items) {
        const prefix = `${defaultProps.testIdPrefix}::${ingredient.id}::SettingsItemCard`;
        expect(getByTestId(`${prefix}::Type`).props.children).toEqual('ingredient');
        expect(getByTestId(`${prefix}::Item`).props.children).toEqual(JSON.stringify(ingredient));
        expect(getByTestId(`${prefix}::OnEdit`)).toBeTruthy();
        expect(getByTestId(`${prefix}::OnDelete`)).toBeTruthy();
      }
    });

    test('calls onEditPress when edit button is pressed', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.press(
        getByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[0]!.id}::SettingsItemCard::OnEdit`
        )
      );

      expect(mockOnEdit).toHaveBeenCalledWith(defaultProps.items[0]);
    });

    test('calls onDeletePress when delete button is pressed', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.press(
        getByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[0]!.id}::SettingsItemCard::OnDelete`
        )
      );

      expect(mockOnDelete).toHaveBeenCalledWith(defaultProps.items[0]);
    });

    test('renders the search bar', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      expect(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`)).toBeTruthy();
    });

    test('shows all items when search query is empty', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      expect(
        getByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[0]!.id}::SettingsItemCard::Item`
        )
      ).toBeTruthy();
      expect(
        getByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[1]!.id}::SettingsItemCard::Item`
        )
      ).toBeTruthy();
    });

    test('filters items by name (case-insensitive)', () => {
      const { getByTestId, queryByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'ground');

      expect(
        getByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[0]!.id}::SettingsItemCard::Item`
        ).props.children
      ).toEqual(JSON.stringify(mockIngredients[0]));
      expect(
        queryByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[1]!.id}::SettingsItemCard::Item`
        )
      ).toBeNull();
    });

    test('shows no items when no match', () => {
      const { getByTestId, queryByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'xyz');

      expect(
        queryByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[0]!.id}::SettingsItemCard::Item`
        )
      ).toBeNull();
    });

    test('clears filter when search is cleared', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'ground');
      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), '');

      expect(
        getByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[0]!.id}::SettingsItemCard::Item`
        )
      ).toBeTruthy();
      expect(
        getByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[1]!.id}::SettingsItemCard::Item`
        )
      ).toBeTruthy();
    });

    test('filters are applied per character', () => {
      const { getByTestId, queryByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'tac');

      expect(
        getByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[1]!.id}::SettingsItemCard::Item`
        ).props.children
      ).toEqual(JSON.stringify(mockIngredients[1]));
      expect(
        queryByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[0]!.id}::SettingsItemCard::Item`
        )
      ).toBeNull();
    });

    test('uses item name as key when id is missing', () => {
      const noIdIngredients: ingredientTableElement[] = [
        { ...mockIngredients[0]!, id: undefined as any },
        { ...mockIngredients[1]!, id: undefined as any },
      ];
      const props: SettingsItemListProps<ingredientTableElement> = {
        ...defaultProps,
        items: noIdIngredients,
      };

      const { getByTestId } = render(<SettingsItemList {...props} />);

      expect(
        getByTestId(
          `${defaultProps.testIdPrefix}::${noIdIngredients[0]!.name}::SettingsItemCard::Item`
        )
      ).toBeTruthy();
      expect(
        getByTestId(
          `${defaultProps.testIdPrefix}::${noIdIngredients[1]!.name}::SettingsItemCard::Item`
        )
      ).toBeTruthy();
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

      for (const tag of defaultProps.items) {
        const prefix = `${defaultProps.testIdPrefix}::${tag.id}::SettingsItemCard`;
        expect(getByTestId(`${prefix}::Type`).props.children).toEqual('tag');
        expect(getByTestId(`${prefix}::Item`).props.children).toEqual(JSON.stringify(tag));
        expect(getByTestId(`${prefix}::OnEdit`)).toBeTruthy();
        expect(getByTestId(`${prefix}::OnDelete`)).toBeTruthy();
      }
    });

    test('calls onEditPress when edit button is pressed', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.press(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[0]!.id}::SettingsItemCard::OnEdit`)
      );

      expect(mockOnEdit).toHaveBeenCalledWith(defaultProps.items[0]);
    });

    test('calls onDeletePress when delete button is pressed', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.press(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[0]!.id}::SettingsItemCard::OnDelete`)
      );

      expect(mockOnDelete).toHaveBeenCalledWith(defaultProps.items[0]);
    });

    test('renders the search bar', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      expect(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`)).toBeTruthy();
    });

    test('shows all items when search query is empty', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      expect(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[0]!.id}::SettingsItemCard::Item`)
      ).toBeTruthy();
      expect(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[1]!.id}::SettingsItemCard::Item`)
      ).toBeTruthy();
      expect(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[2]!.id}::SettingsItemCard::Item`)
      ).toBeTruthy();
    });

    test('filters items by name (case-insensitive)', () => {
      const { getByTestId, queryByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'soup');

      expect(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[0]!.id}::SettingsItemCard::Item`).props
          .children
      ).toEqual(JSON.stringify(mockTags[0]));
      expect(
        queryByTestId(`${defaultProps.testIdPrefix}::${mockTags[1]!.id}::SettingsItemCard::Item`)
      ).toBeNull();
    });

    test('shows no items when no match', () => {
      const { getByTestId, queryByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'xyz');

      expect(
        queryByTestId(`${defaultProps.testIdPrefix}::${mockTags[0]!.id}::SettingsItemCard::Item`)
      ).toBeNull();
    });

    test('clears filter when search is cleared', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'soup');
      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), '');

      expect(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[0]!.id}::SettingsItemCard::Item`)
      ).toBeTruthy();
      expect(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[1]!.id}::SettingsItemCard::Item`)
      ).toBeTruthy();
      expect(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[2]!.id}::SettingsItemCard::Item`)
      ).toBeTruthy();
    });

    test('filters are applied per character', () => {
      const { getByTestId } = render(<SettingsItemList {...defaultProps} />);

      fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'ital');

      expect(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[1]!.id}::SettingsItemCard::Item`).props
          .children
      ).toEqual(JSON.stringify(mockTags[1]));
    });
  });
});
