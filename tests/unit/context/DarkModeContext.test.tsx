import React, { useContext } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, Pressable } from 'react-native';
import { DarkModeContext } from '@context/DarkModeContext';

describe('DarkModeContext', () => {
  test('provides default values', async () => {
    const TestComponent = () => {
      const { isDarkMode } = useContext(DarkModeContext);
      return <Text testID='dark-mode-value'>{String(isDarkMode)}</Text>;
    };

    const { getByTestId } = await render(<TestComponent />);

    expect(getByTestId('dark-mode-value').props.children).toBe('false');
  });

  test('provides toggleDarkMode function', async () => {
    const TestComponent = () => {
      const { toggleDarkMode } = useContext(DarkModeContext);
      return (
        <Pressable testID='toggle-button' onPress={toggleDarkMode}>
          <Text>Toggle</Text>
        </Pressable>
      );
    };

    const { getByTestId } = await render(<TestComponent />);

    await fireEvent.press(getByTestId('toggle-button'));
  });

  test('custom provider overrides default values', async () => {
    const mockToggle = jest.fn();
    const TestComponent = () => {
      const { isDarkMode, toggleDarkMode } = useContext(DarkModeContext);
      return (
        <View>
          <Text testID='dark-mode-value'>{String(isDarkMode)}</Text>
          <Pressable testID='toggle-button' onPress={toggleDarkMode}>
            <Text>Toggle</Text>
          </Pressable>
        </View>
      );
    };

    const { getByTestId } = await render(
      <DarkModeContext.Provider value={{ isDarkMode: true, toggleDarkMode: mockToggle }}>
        <TestComponent />
      </DarkModeContext.Provider>
    );

    expect(getByTestId('dark-mode-value').props.children).toBe('true');

    await fireEvent.press(getByTestId('toggle-button'));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});
