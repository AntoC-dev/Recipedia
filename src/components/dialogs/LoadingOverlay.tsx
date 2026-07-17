/**
 * LoadingOverlay - Full-screen loading indicator with message and optional progress
 *
 * A reusable loading overlay component that displays a centered activity indicator
 * or progress bar with an optional message. Used to block user interaction while
 * asynchronous operations complete, particularly during app initialization or data loading.
 *
 * Key Features:
 * - Full-screen overlay with semi-transparent backdrop
 * - Centered activity indicator (indeterminate) or progress bar (determinate)
 * - Optional loading message with proper typography
 * - Portal integration for proper z-index layering
 * - Prevents user interaction when visible
 * - Progress percentage display when progress is provided
 *
 * @example
 * ```typescript
 * // Indeterminate loading
 * <LoadingOverlay
 *   visible={isLoading}
 *   message="Loading recipes..."
 * />
 *
 * // Determinate progress
 * <LoadingOverlay
 *   visible={isLoading}
 *   message="Scaling recipes..."
 *   progress={75}
 * />
 * ```
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Portal, ProgressBar, Text, useTheme } from 'react-native-paper';
import { padding, progressBarHeight, screenWidth } from '@styles/spacing';

export type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
  progress?: number;
  testID?: string;
};

export function LoadingOverlay({
  visible,
  message,
  progress,
  testID = 'LoadingOverlay',
}: LoadingOverlayProps) {
  const { colors } = useTheme();

  if (!visible) {
    return null;
  }

  const hasProgress = progress !== undefined && progress !== null && progress >= 0;
  const testIDOverlay = testID + '::Overlay';

  return (
    <Portal>
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: colors.backdrop,
          },
        ]}
        testID={testIDOverlay}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              shadowColor: colors.shadow,
            },
          ]}
        >
          {hasProgress ? (
            <>
              <ProgressBar
                progress={progress / 100}
                color={colors.primary}
                style={styles.progressBar}
                testID={testIDOverlay + '::ProgressBar'}
              />
              <Text
                variant='titleMedium'
                style={{ fontWeight: 'bold', marginTop: padding.small }}
                testID={testIDOverlay + '::ProgressText'}
              >
                {Math.round(progress)}%
              </Text>
            </>
          ) : (
            <ActivityIndicator size='large' animating={true} testID={testIDOverlay + '::Spinner'} />
          )}
          {message && (
            <Text
              variant='bodyLarge'
              style={{
                marginTop: padding.large,
                textAlign: 'center',
              }}
              testID={testIDOverlay + '::Message'}
            >
              {message}
            </Text>
          )}
        </View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    padding: padding.extraLarge,
    alignItems: 'center',
    elevation: 8,
  },
  progressBar: {
    width: screenWidth / 2,
    maxWidth: 300,
    height: progressBarHeight,
    borderRadius: progressBarHeight / 2,
  },
});
