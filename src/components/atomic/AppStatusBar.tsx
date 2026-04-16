import React, { useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { DarkModeContext } from '@context/DarkModeContext';

/**
 * AppStatusBar - Centralized status bar component
 *
 * Automatically handles status bar style based on the dark mode context.
 */
export function AppStatusBar() {
  const { isDarkMode } = useContext(DarkModeContext);

  return <StatusBar style={isDarkMode ? 'light' : 'dark'} animated={true} />;
}

export default AppStatusBar;
