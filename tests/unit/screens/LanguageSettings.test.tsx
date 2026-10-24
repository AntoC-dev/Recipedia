import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LanguageSettings } from '@screens/LanguageSettings';
import { mockNavigationFunctions } from '@mocks/deps/react-navigation-mock';
import { mockGetLanguage, mockSetLanguage } from '@mocks/utils/settings-mock';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@utils/settings', () => require('@mocks/utils/settings-mock').settingsMock());

// Mock the route prop
const mockRoute = {
  key: 'LanguageSettings',
  name: 'LanguageSettings',
  params: {},
};

// Create props object that matches LanguageSettingsProp
// Using 'as any' to bypass TypeScript checks for testing purposes
const defaultProps = {
  navigation: mockNavigationFunctions,
  route: mockRoute,
} as any;

describe('LanguageSettings Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLanguage.mockResolvedValue('en');
  });

  test('renders correctly with available languages', async () => {
    const { getByTestId } = render(<LanguageSettings {...(defaultProps as any)} />);

    await waitFor(() => {
      expect(getByTestId('LanguageSettings::Item::0')).toBeTruthy();
    });

    expect(getByTestId('LanguageSettings::AppBar')).toBeTruthy();
    expect(getByTestId('LanguageSettings::AppBar::BackButton')).toBeTruthy();
    expect(getByTestId('LanguageSettings::Item::0::Title').props.children).toEqual('locale name');
    expect(getByTestId('LanguageSettings::Item::1::Title').props.children).toEqual('locale name');
  });

  test('changes language when a language option is pressed', async () => {
    const { getByTestId } = render(<LanguageSettings {...defaultProps} />);

    // Wait for the component to load
    await waitFor(() => {
      expect(getByTestId('LanguageSettings::Item::0')).toBeTruthy();
    });

    // Press the French language option
    fireEvent.press(getByTestId('LanguageSettings::Item::1'));

    // Wait for the language to change
    await waitFor(() => {
      expect(mockSetLanguage).toHaveBeenCalledWith('fr');
      expect(mockNavigationFunctions.goBack).toHaveBeenCalled();
    });
  });
});
