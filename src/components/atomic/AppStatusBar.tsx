import React, { useContext, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useTheme } from 'react-native-paper';
import { DarkModeContext } from '@context/DarkModeContext';

/**
 * AppStatusBar - Centralized status bar component
 *
 * Handles the status bar style based on the dark mode context and keeps the
 * system UI background (Android navigation bar, iOS root view) themed to the
 * active surface color so it matches the bottom bar sitting above it.
 */
export function AppStatusBar() {
  const { isDarkMode } = useContext(DarkModeContext);
  const { colors } = useTheme();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.surface);
  }, [colors.surface]);

  return <StatusBar style={isDarkMode ? 'light' : 'dark'} animated={true} />;
}
