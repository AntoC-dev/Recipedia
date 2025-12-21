import { fireEvent, render } from '@testing-library/react-native';
import { BulkImportSettings } from '@screens/BulkImportSettings';
import React from 'react';
import { mockGoBack, mockNavigate } from '@mocks/deps/react-navigation-mock';

jest.mock('@react-navigation/native', () => {
  const { reactNavigationMock } = require('@mocks/deps/react-navigation-mock');
  return reactNavigationMock();
});

describe('BulkImportSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders app bar with title', () => {
    const { getByTestId } = render(<BulkImportSettings />);

    expect(getByTestId('BulkImportSettings::AppBar')).toBeTruthy();
  });

  test('renders subheader', () => {
    const { getByTestId } = render(<BulkImportSettings />);

    expect(getByTestId('BulkImportSettings::Subheader')).toBeTruthy();
  });

  test('renders provider list items', () => {
    const { getByTestId } = render(<BulkImportSettings />);

    expect(getByTestId('BulkImportSettings::Provider::hellofresh')).toBeTruthy();
  });

  test('navigates to discovery when provider pressed', () => {
    const { getByTestId } = render(<BulkImportSettings />);

    fireEvent.press(getByTestId('BulkImportSettings::Provider::hellofresh'));

    expect(mockNavigate).toHaveBeenCalledWith('BulkImportDiscovery', {
      providerId: 'hellofresh',
    });
  });

  test('navigates back when app bar back pressed', () => {
    const { getByTestId } = render(<BulkImportSettings />);

    fireEvent.press(getByTestId('BulkImportSettings::AppBar::BackButton'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  test('displays provider names', () => {
    const { getByTestId } = render(<BulkImportSettings />);

    expect(getByTestId('BulkImportSettings::Provider::hellofresh::Title').props.children).toBe(
      'HelloFresh'
    );
  });
});
