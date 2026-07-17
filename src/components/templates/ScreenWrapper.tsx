import React from 'react';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { AppStatusBar } from '@components/atomic/AppStatusBar';
import { ColorValue } from 'react-native';

interface ScreenWrapperProps {
  children: React.ReactNode;
  edges?: Edge[];
  backgroundColor?: ColorValue;
  testID?: string;
}

/**
 * ScreenWrapper - A template component for all screens in the app
 *
 * Provides a consistent layout with SafeAreaView and AppStatusBar.
 *
 * @param children - The content of the screen
 * @param edges - The edges to apply safe area insets to (default: ['bottom', 'top', 'left', 'right'])
 * @param backgroundColor - Background color for the screen (default: theme.colors.background)
 * @param testID - Test identifier for the wrapper
 */
export function ScreenWrapper({
  children,
  edges = ['bottom', 'top', 'left', 'right'],
  backgroundColor,
  testID,
}: ScreenWrapperProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: backgroundColor || colors.background,
      }}
      edges={edges}
      testID={testID}
    >
      <AppStatusBar />
      {children}
    </SafeAreaView>
  );
}
