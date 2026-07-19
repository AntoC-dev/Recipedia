import React from 'react';
import { render } from '@testing-library/react-native';
import * as SystemUI from 'expo-system-ui';
import { useTheme } from 'react-native-paper';
import { AppStatusBar } from '@components/atomic/AppStatusBar';
import { DarkModeContext } from '@context/DarkModeContext';

describe('AppStatusBar component', () => {
  const renderWithDarkMode = (isDarkMode: boolean) => {
    return render(
      <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode: jest.fn() }}>
        <AppStatusBar />
      </DarkModeContext.Provider>
    );
  };

  it('renders dark style when isDarkMode is false', () => {
    const { getByTestId } = renderWithDarkMode(false);
    const statusBar = getByTestId('StatusBar');
    expect(statusBar.props.style).toBe('dark');
  });

  it('renders light style when isDarkMode is true', () => {
    const { getByTestId } = renderWithDarkMode(true);
    const statusBar = getByTestId('StatusBar');
    expect(statusBar.props.style).toBe('light');
  });

  it('sets animated prop to true', () => {
    const { getByTestId } = renderWithDarkMode(false);
    const statusBar = getByTestId('StatusBar');
    expect(statusBar.props.animated).toBe(true);
  });

  it('themes the system UI background with the active theme surface color', () => {
    (useTheme as jest.Mock).mockReturnValueOnce({ colors: { surface: '#123456' } });
    renderWithDarkMode(false);
    expect(SystemUI.setBackgroundColorAsync).toHaveBeenCalledWith('#123456');
  });
});
