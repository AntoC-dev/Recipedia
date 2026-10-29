import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SettingsItemList, SettingsItemListProps } from '@components/organisms/SettingsItemList';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import { ingredientTableElement, tagTableElement } from '@customTypes/DatabaseElementTypes';
import {
  resetUseDeferredMountMock,
  setMockDeferredMountReady,
} from '@mocks/hooks/useDeferredMount-mock';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

jest.mock('@components/molecules/SettingsItemCard', () => ({
  SettingsItemCard: require('@mocks/components/molecules/SettingsItemCard-mock')
    .settingsItemCardMock,
}));

jest.mock('@hooks/useDeferredMount', () => ({
  useDeferredMount: require('@mocks/hooks/useDeferredMount-mock').useDeferredMountMock,
}));

describe('SettingsItemList Component', () => {
  const mockTags = [testTags[7]!, testTags[0]!, testTags[8]!];

  const mockIngredients = [testIngredients[1]!, testIngredients[4]!];

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    resetUseDeferredMountMock();
  });

  describe('ingredient', () => {
    const defaultProps: SettingsItemListProps<ingredientTableElement> = {
      testIdPrefix: 'IngredientList',
      type: 'ingredient',
      items: mockIngredients,
      onEdit: mockOnEdit,
      onDelete: mockOnDelete,
    };

    test('renders', async () => {
      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

      for (const ingredient of defaultProps.items) {
        const prefix = `${defaultProps.testIdPrefix}::${ingredient.id}::SettingsItemCard`;
        expect(getByTestId(`${prefix}::Type`).props.children).toEqual('ingredient');
        expect(getByTestId(`${prefix}::Item`).props.children).toEqual(JSON.stringify(ingredient));
        expect(getByTestId(`${prefix}::OnEdit`)).toBeTruthy();
        expect(getByTestId(`${prefix}::OnDelete`)).toBeTruthy();
      }
    });

    test('calls onEditPress when edit button is pressed', async () => {
      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

      await fireEvent.press(
        getByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[0]!.id}::SettingsItemCard::OnEdit`
        )
      );

      expect(mockOnEdit).toHaveBeenCalledWith(defaultProps.items[0]);
    });

    test('calls onDeletePress when delete button is pressed', async () => {
      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

      await fireEvent.press(
        getByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[0]!.id}::SettingsItemCard::OnDelete`
        )
      );

      expect(mockOnDelete).toHaveBeenCalledWith(defaultProps.items[0]);
    });

    test('renders the search bar', async () => {
      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

      expect(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`)).toBeTruthy();
    });

    test('shows all items when search query is empty', async () => {
      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

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

    test('filters items by name (case-insensitive)', async () => {
      const { getByTestId, queryByTestId } = await render(<SettingsItemList {...defaultProps} />);

      await fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'ground');

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

    test('shows no items when no match', async () => {
      const { getByTestId, queryByTestId } = await render(<SettingsItemList {...defaultProps} />);

      await fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'xyz');

      expect(
        queryByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[0]!.id}::SettingsItemCard::Item`
        )
      ).toBeNull();
    });

    test('clears filter when search is cleared', async () => {
      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

      await fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'ground');
      await fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), '');

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

    test('filters are applied per character', async () => {
      const { getByTestId, queryByTestId } = await render(<SettingsItemList {...defaultProps} />);

      await fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'tac');

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
  });

  describe('deferred rendering', () => {
    const defaultProps: SettingsItemListProps<ingredientTableElement> = {
      testIdPrefix: 'IngredientList',
      type: 'ingredient',
      items: mockIngredients,
      onEdit: mockOnEdit,
      onDelete: mockOnDelete,
    };

    test('defers the list but keeps the search bar while interactions pend', async () => {
      setMockDeferredMountReady(false);

      const { getByTestId, queryByTestId } = await render(<SettingsItemList {...defaultProps} />);

      expect(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`)).toBeTruthy();
      expect(
        queryByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[0]!.id}::SettingsItemCard::Item`
        )
      ).toBeNull();
    });

    test('renders the list once interactions have settled', async () => {
      setMockDeferredMountReady(true);

      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

      expect(
        getByTestId(
          `${defaultProps.testIdPrefix}::${mockIngredients[0]!.id}::SettingsItemCard::Item`
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

    test('renders', async () => {
      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

      for (const tag of defaultProps.items) {
        const prefix = `${defaultProps.testIdPrefix}::${tag.id}::SettingsItemCard`;
        expect(getByTestId(`${prefix}::Type`).props.children).toEqual('tag');
        expect(getByTestId(`${prefix}::Item`).props.children).toEqual(JSON.stringify(tag));
        expect(getByTestId(`${prefix}::OnEdit`)).toBeTruthy();
        expect(getByTestId(`${prefix}::OnDelete`)).toBeTruthy();
      }
    });

    test('calls onEditPress when edit button is pressed', async () => {
      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

      await fireEvent.press(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[0]!.id}::SettingsItemCard::OnEdit`)
      );

      expect(mockOnEdit).toHaveBeenCalledWith(defaultProps.items[0]);
    });

    test('calls onDeletePress when delete button is pressed', async () => {
      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

      await fireEvent.press(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[0]!.id}::SettingsItemCard::OnDelete`)
      );

      expect(mockOnDelete).toHaveBeenCalledWith(defaultProps.items[0]);
    });

    test('renders the search bar', async () => {
      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

      expect(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`)).toBeTruthy();
    });

    test('shows all items when search query is empty', async () => {
      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

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

    test('filters items by name (case-insensitive)', async () => {
      const { getByTestId, queryByTestId } = await render(<SettingsItemList {...defaultProps} />);

      await fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'soup');

      expect(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[0]!.id}::SettingsItemCard::Item`)
          .props.children
      ).toEqual(JSON.stringify(mockTags[0]));
      expect(
        queryByTestId(`${defaultProps.testIdPrefix}::${mockTags[1]!.id}::SettingsItemCard::Item`)
      ).toBeNull();
    });

    test('shows no items when no match', async () => {
      const { getByTestId, queryByTestId } = await render(<SettingsItemList {...defaultProps} />);

      await fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'xyz');

      expect(
        queryByTestId(`${defaultProps.testIdPrefix}::${mockTags[0]!.id}::SettingsItemCard::Item`)
      ).toBeNull();
    });

    test('clears filter when search is cleared', async () => {
      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

      await fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'soup');
      await fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), '');

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

    test('filters are applied per character', async () => {
      const { getByTestId } = await render(<SettingsItemList {...defaultProps} />);

      await fireEvent.changeText(getByTestId(`${defaultProps.testIdPrefix}::SearchBar`), 'ital');

      expect(
        getByTestId(`${defaultProps.testIdPrefix}::${mockTags[1]!.id}::SettingsItemCard::Item`)
          .props.children
      ).toEqual(JSON.stringify(mockTags[1]));
    });
  });
});
