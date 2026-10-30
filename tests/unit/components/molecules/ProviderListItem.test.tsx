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
  extractImageFromHtml: jest.fn().mockReturnValue(null),
  canHandleUrl: jest.fn().mockReturnValue(false),
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

  test('renders provider name', async () => {
    const { getByTestId } = await render(<ProviderListItem {...defaultProps} />);

    expect(getByTestId('test-provider-item::Title').props.children).toBe('Test Provider');
  });

  test('renders provider description from i18n', async () => {
    const { getByTestId } = await render(<ProviderListItem {...defaultProps} />);

    expect(getByTestId('test-provider-item::Description').props.children).toBe(
      'bulkImport.provider.description'
    );
  });

  test('renders logo with correct testID', async () => {
    const { getByTestId } = await render(<ProviderListItem {...defaultProps} />);

    expect(getByTestId('test-provider-item::Logo')).toBeTruthy();
  });

  test('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(<ProviderListItem {...defaultProps} onPress={onPress} />);

    await fireEvent.press(getByTestId('test-provider-item'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
