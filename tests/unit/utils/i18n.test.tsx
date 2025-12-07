import i18n, { useI18n } from '@utils/i18n';
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Button, Text, View } from 'react-native';

jest.unmock('@utils/i18n');

// Make sure i18n is initialized before tests run
beforeAll(async () => {
  // Wait for i18n initialization to complete
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

// Test component that uses the useI18n hook
const TestComponent = () => {
  const { getLocale, setLocale, t, getAvailableLocales, getLocaleName } = useI18n();

  return (
    <View>
      <Text testID='current-locale'>{getLocale()}</Text>
      <Text testID='translated-text'>{t('home')}</Text>
      <Text testID='translated-shopping'>{t('shopping')}</Text>
      <Text testID='available-locales'>{JSON.stringify(getAvailableLocales())}</Text>
      <Text testID='locale-name-en'>{getLocaleName('en')}</Text>
      <Text testID='locale-name-fr'>{getLocaleName('fr')}</Text>
      <Button testID='change-to-fr' onPress={() => setLocale('fr')} title='Change to French' />
      <Button testID='change-to-en' onPress={() => setLocale('en')} title='Change to English' />
    </View>
  );
};

describe('i18n utility', () => {
  beforeEach(async () => {
    // Reset to English before each test
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  test('useI18n hook provides translation functionality', async () => {
    // Initialize component before using it
    const component = render(<TestComponent />);

    // Verify initial locale is English
    expect(component.getByTestId('current-locale').props.children).toEqual('en');

    // Verify translations work with English locale
    expect(component.getByTestId('translated-text').props.children).toEqual('Home');
    expect(component.getByTestId('translated-shopping').props.children).toEqual('Shopping');
  });

  test('useI18n hook allows changing the locale', async () => {
    // Initialize component before using it
    const component = render(<TestComponent />);

    // Verify initial locale is English
    expect(component.getByTestId('current-locale').props.children).toEqual('en');
    expect(component.getByTestId('translated-text').props.children).toEqual('Home');

    // Change locale to French
    await act(async () => {
      fireEvent.press(component.getByTestId('change-to-fr'));
    });

    // Rerender to see the changes
    component.rerender(<TestComponent />);

    // Verify locale changed to French
    expect(component.getByTestId('current-locale').props.children).toEqual('fr');

    // Verify translations now use French
    expect(component.getByTestId('translated-text').props.children).toEqual('Accueil');
    expect(component.getByTestId('translated-shopping').props.children).toEqual('Courses');

    // Change back to English
    await act(async () => {
      fireEvent.press(component.getByTestId('change-to-en'));
    });
    component.rerender(<TestComponent />);

    // Verify locale changed back to English
    expect(component.getByTestId('current-locale').props.children).toEqual('en');
    expect(component.getByTestId('translated-text').props.children).toEqual('Home');
  });

  test('useI18n hook provides locale utilities', async () => {
    // Initialize component before using it
    const component = render(<TestComponent />);

    // Test getAvailableLocales
    const availableLocales = JSON.parse(component.getByTestId('available-locales').props.children);
    expect(availableLocales).toContain('en');
    expect(availableLocales).toContain('fr');
    expect(availableLocales.length).toEqual(2);

    // Test getLocaleName
    expect(component.getByTestId('locale-name-en').props.children).toEqual('English');
    expect(component.getByTestId('locale-name-fr').props.children).toEqual('Français');
  });
});
