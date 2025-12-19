import { fireEvent, render } from '@testing-library/react-native';
import { ProviderListItem } from '@components/molecules/ProviderListItem';
import React from 'react';
import { RecipeProvider } from '@customTypes/BulkImportTypes';

const mockProvider: RecipeProvider = {
  id: 'test-provider',
  name: 'Test Provider',
  logoUrl: 'https://example.com/logo.png',
  getBaseUrl: jest.fn(),
  discoverRecipeUrls: jest.fn(),
  parseSelectedRecipes: jest.fn(),
  fetchRecipe: jest.fn(),
};

describe('ProviderListItem', () => {
  const defaultProps = {
    provider: mockProvider,
    onPress: jest.fn(),
    testID: 'test-provider-item',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders provider name', () => {
    const { getByTestId } = render(<ProviderListItem {...defaultProps} />);

    expect(getByTestId('test-provider-item::Title').props.children).toBe('Test Provider');
  });

  test('renders provider description from i18n', () => {
    const { getByTestId } = render(<ProviderListItem {...defaultProps} />);

    expect(getByTestId('test-provider-item::Description').props.children).toBe(
      'bulkImport.provider_test-provider.Description'
    );
  });

  test('renders logo with correct testID', () => {
    const { getByTestId } = render(<ProviderListItem {...defaultProps} />);

    expect(getByTestId('test-provider-item::Logo')).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<ProviderListItem {...defaultProps} onPress={onPress} />);

    fireEvent.press(getByTestId('test-provider-item'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
