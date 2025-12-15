import { fireEvent, render } from '@testing-library/react-native';
import { ProviderLogo } from '@components/molecules/ProviderLogo';
import React from 'react';

describe('ProviderLogo', () => {
  const defaultProps = {
    logoUrl: 'https://example.com/logo.png',
    testID: 'test-logo',
  };

  test('renders image when logoUrl is provided', () => {
    const { getByTestId, queryByTestId } = render(<ProviderLogo {...defaultProps} />);

    expect(getByTestId('test-logo::Image')).toBeTruthy();
    expect(queryByTestId('test-logo::FallbackIcon')).toBeNull();
  });

  test('renders fallback icon when logoUrl is empty', () => {
    const { getByTestId, queryByTestId } = render(<ProviderLogo logoUrl='' testID='test-logo' />);

    expect(getByTestId('test-logo::FallbackIcon')).toBeTruthy();
    expect(queryByTestId('test-logo::Image')).toBeNull();
  });

  test('renders fallback icon on image error', () => {
    const { getByTestId, queryByTestId } = render(<ProviderLogo {...defaultProps} />);

    fireEvent(getByTestId('test-logo::Image'), 'error');

    expect(getByTestId('test-logo::FallbackIcon')).toBeTruthy();
  });

  test('renders container with testID', () => {
    const { getByTestId } = render(<ProviderLogo {...defaultProps} />);

    expect(getByTestId('test-logo')).toBeTruthy();
  });

  test('applies custom size to image', () => {
    const { getByTestId } = render(<ProviderLogo {...defaultProps} size={60} />);

    const image = getByTestId('test-logo::Image');
    expect(image.props.style).toMatchObject({ width: 60, height: 60 });
  });
});
