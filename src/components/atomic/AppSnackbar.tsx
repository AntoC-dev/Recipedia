/**
 * AppSnackbar - Paper `Snackbar` with the app-wide duration and layout rules.
 *
 * The only place allowed to import Paper's `Snackbar` (enforced by ESLint).
 *
 * - Duration comes from {@link snackbarDuration} unless `duration` is passed:
 *   shorter for a plain message, longer with an action.
 * - The action gets the testID `<testID>::Action` unless it sets its own.
 * - `aboveBottomAction` lifts the snackbar over the screen's `BottomActionButton`.
 *
 * @module components/atomic/AppSnackbar
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar, SnackbarProps } from 'react-native-paper';
import { snackbarDuration } from '@utils/snackbarDuration';
import { bottomActionButtonHeight } from '@styles/spacing';

export type AppSnackbarProps = Omit<SnackbarProps, 'children' | 'duration' | 'wrapperStyle'> & {
  /** Message shown in the snackbar */
  children: string;
  /** Overrides the shared duration, in milliseconds */
  duration?: number;
  /** Lift the snackbar above the screen's `BottomActionButton` (default `false`) */
  aboveBottomAction?: boolean;
};

export function AppSnackbar({
  children,
  duration,
  aboveBottomAction = false,
  ...snackbarProps
}: AppSnackbarProps) {
  const { action, testID } = snackbarProps;

  return (
    <Snackbar
      {...snackbarProps}
      wrapperStyle={aboveBottomAction ? styles.aboveBottomAction : undefined}
      action={action && { testID: testID && `${testID}::Action`, ...action }}
      duration={duration ?? snackbarDuration(action !== undefined)}
    >
      {children}
    </Snackbar>
  );
}

const styles = StyleSheet.create({
  aboveBottomAction: {
    bottom: bottomActionButtonHeight,
  },
});
