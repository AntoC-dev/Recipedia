import { fireEvent, render } from '@testing-library/react-native';
import { ProviderLogo } from '@components/molecules/ProviderLogo';
import React from 'react';

describe('ProviderLogo', () => {
  const defaultProps = {
    logoUrl: 'https://example.com/logo.png',
    testID: 'test-logo',
  };

  test('renders image when logoUrl is provided', async () => {
    const { getByTestId, queryByTestId } = await render(<ProviderLogo {...defaultProps} />);

    expect(getByTestId('test-logo::Image')).toBeTruthy();
    expect(queryByTestId('test-logo::FallbackIcon')).toBeNull();
  });

  test('renders fallback icon when logoUrl is empty', async () => {
    const { getByTestId, queryByTestId } = await render(
      <ProviderLogo logoUrl='' testID='test-logo' />
    );

    expect(getByTestId('test-logo::FallbackIcon')).toBeTruthy();
    expect(queryByTestId('test-logo::Image')).toBeNull();
  });

  test('renders fallback icon on image error', async () => {
    const { getByTestId, queryByTestId } = await render(<ProviderLogo {...defaultProps} />);

    await fireEvent(getByTestId('test-logo::Image'), 'error');

    expect(getByTestId('test-logo::FallbackIcon')).toBeTruthy();
  });

  test('renders container with testID', async () => {
    const { getByTestId } = await render(<ProviderLogo {...defaultProps} />);

    expect(getByTestId('test-logo')).toBeTruthy();
  });

  test('applies custom size to image', async () => {
    const { getByTestId } = await render(<ProviderLogo {...defaultProps} size={60} />);

    const image = getByTestId('test-logo::Image');
    expect(image.props.style).toMatchObject({ width: 60, height: 60 });
  });
});
