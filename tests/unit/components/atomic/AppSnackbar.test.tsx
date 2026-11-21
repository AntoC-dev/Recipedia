import React from 'react';
import { render } from '@testing-library/react-native';
import { AppSnackbar, AppSnackbarProps } from '@components/atomic/AppSnackbar';
import { snackbarDurationsFor } from '@utils/snackbarDuration';
import { animationsDisabled } from '@utils/Constants';
import { bottomActionButtonHeight } from '@styles/spacing';

describe('AppSnackbar', () => {
  const snackbarId = 'AppSnackbar';
  const message = 'Recipe removed';
  const undoAction = { label: 'Undo', onPress: jest.fn() };
  const buildDurations = snackbarDurationsFor(animationsDisabled);

  const renderSnackbar = (props: Partial<AppSnackbarProps> = {}) =>
    render(
      <AppSnackbar testID={snackbarId} visible onDismiss={jest.fn()} {...props}>
        {props.children ?? message}
      </AppSnackbar>
    );

  const textOf = async (props: Partial<AppSnackbarProps>, suffix: string) => {
    const { getByTestId } = await renderSnackbar(props);
    return getByTestId(`${snackbarId}::${suffix}`).props.children;
  };

  describe('rendering', () => {
    test('shows the message', async () => {
      expect(await textOf({}, 'Text')).toBe(message);
    });

    test('renders the action label', async () => {
      expect(await textOf({ action: undoAction }, 'Action::Children')).toBe(undoAction.label);
    });

    test('renders nothing when not visible', async () => {
      const { queryByTestId } = await renderSnackbar({ visible: false });

      expect(queryByTestId(snackbarId)).toBeNull();
    });
  });

  describe('action testID', () => {
    test('derives the action testID from the snackbar testID', async () => {
      const { getByTestId } = await renderSnackbar({ action: undoAction });

      expect(getByTestId(`${snackbarId}::Action`)).toBeTruthy();
    });

    test('keeps the action testID when the action sets its own', async () => {
      const { getByTestId, queryByTestId } = await renderSnackbar({
        action: { ...undoAction, testID: 'CustomUndo' },
      });

      expect(getByTestId('CustomUndo')).toBeTruthy();
      expect(queryByTestId(`${snackbarId}::Action`)).toBeNull();
    });

    test('leaves the action testID unset when the snackbar has no testID', async () => {
      const { getByText } = await render(
        <AppSnackbar visible onDismiss={jest.fn()} action={undoAction}>
          {message}
        </AppSnackbar>
      );

      expect(getByText(undoAction.label)).toBeTruthy();
    });
  });

  describe('duration', () => {
    test('uses the message duration without action', async () => {
      expect(await textOf({}, 'Duration')).toBe(buildDurations.message);
    });

    test('uses the action duration with an action', async () => {
      expect(await textOf({ action: undoAction }, 'Duration')).toBe(buildDurations.action);
    });

    test('uses the explicit duration override', async () => {
      expect(await textOf({ action: undoAction, duration: 1234 }, 'Duration')).toBe(1234);
    });
  });

  describe('aboveBottomAction', () => {
    test('sits at the default position by default', async () => {
      expect(await textOf({}, 'WrapperBottom')).toBeUndefined();
    });

    test('lifts the snackbar by the bottom action button height', async () => {
      expect(await textOf({ aboveBottomAction: true }, 'WrapperBottom')).toBe(
        bottomActionButtonHeight
      );
    });
  });
});
