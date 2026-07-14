import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ErrorFallback } from '@components/molecules/ErrorFallback';
import { mockInsets } from '@mocks/deps/safe-area-context-mock';
import { padding } from '@styles/spacing';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

jest.mock('react-native-safe-area-context', () =>
  require('@mocks/deps/safe-area-context-mock').safeAreaContextMock()
);

describe('ErrorFallback', () => {
  test('renders title, message and report action in recoverable mode', () => {
    const { getByTestId } = render(
      <ErrorFallback onReport={jest.fn().mockResolvedValue(undefined)} />
    );

    expect(getByTestId('ErrorFallback::Title')).toBeTruthy();
    expect(getByTestId('ErrorFallback::Message')).toHaveTextContent('errorBoundary.message');
    expect(getByTestId('ErrorFallback::Report')).toBeTruthy();
  });

  test('uses provided testID', () => {
    const { getByTestId } = render(
      <ErrorFallback onReport={jest.fn().mockResolvedValue(undefined)} testID='Boom' />
    );

    expect(getByTestId('Boom')).toBeTruthy();
    expect(getByTestId('Boom::Report')).toBeTruthy();
  });

  test('pads the container with the safe-area insets', () => {
    const { getByTestId } = render(
      <ErrorFallback onReport={jest.fn().mockResolvedValue(undefined)} />
    );

    const style = StyleSheet.flatten(getByTestId('ErrorFallback').props.style);

    expect(style.paddingTop).toBe(mockInsets.top + padding.veryLarge);
    expect(style.paddingBottom).toBe(mockInsets.bottom + padding.veryLarge);
  });

  test('calls onReport when the report action is pressed', async () => {
    const onReport = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<ErrorFallback onReport={onReport} />);

    fireEvent.press(getByTestId('ErrorFallback::Report'));

    await waitFor(() => expect(onReport).toHaveBeenCalledTimes(1));
  });

  test('disables the report action while reporting is in progress', async () => {
    let resolveReport: () => void = () => {};
    const onReport = jest.fn(
      () =>
        new Promise<void>(resolve => {
          resolveReport = resolve;
        })
    );
    const { getByTestId } = render(<ErrorFallback onReport={onReport} />);

    fireEvent.press(getByTestId('ErrorFallback::Report'));

    await waitFor(() => expect(getByTestId('ErrorFallback::Report')).toBeDisabled());

    resolveReport();

    await waitFor(() => expect(getByTestId('ErrorFallback::Report')).toBeEnabled());
  });

  test('shows the persistent message and no action when persistent', () => {
    const { getByTestId, queryByTestId } = render(<ErrorFallback persistent />);

    expect(getByTestId('ErrorFallback::Message')).toHaveTextContent(
      'errorBoundary.persistentMessage'
    );
    expect(queryByTestId('ErrorFallback::Report')).toBeNull();
  });
});
