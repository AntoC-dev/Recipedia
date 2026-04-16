import React from 'react';
import { render } from '@testing-library/react-native';
import { AppStatusBar } from '@components/atomic/AppStatusBar';
import { DarkModeContext } from '@context/DarkModeContext';

// Mock expo-status-bar
jest.mock('expo-status-bar', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    StatusBar: (props: any) => React.createElement(View, { testID: 'StatusBar', ...props }),
  };
});

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
});
