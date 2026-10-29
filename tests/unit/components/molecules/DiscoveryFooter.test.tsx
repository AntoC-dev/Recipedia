import { fireEvent, render } from '@testing-library/react-native';
import { DiscoveryFooter } from '@components/molecules/DiscoveryFooter';
import React from 'react';

describe('DiscoveryFooter', () => {
  const defaultProps = {
    error: null,
    selectedCount: 5,
    onContinue: jest.fn(),
    testID: 'test-footer',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders continue button', async () => {
    const { getByTestId } = await render(<DiscoveryFooter {...defaultProps} />);

    expect(getByTestId('test-footer::ContinueButton')).toBeTruthy();
  });

  test('calls onContinue when button pressed', async () => {
    const onContinue = jest.fn();
    const { getByTestId } = await render(
      <DiscoveryFooter {...defaultProps} onContinue={onContinue} />
    );

    await fireEvent.press(getByTestId('test-footer::ContinueButton'));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  test('disables button when selectedCount is 0', async () => {
    const { getByTestId } = await render(<DiscoveryFooter {...defaultProps} selectedCount={0} />);

    expect(getByTestId('test-footer::ContinueButton').props.accessibilityState.disabled).toBe(true);
  });

  test('enables button when has selection', async () => {
    const { getByTestId } = await render(<DiscoveryFooter {...defaultProps} />);

    expect(getByTestId('test-footer::ContinueButton').props.accessibilityState.disabled).toBe(
      false
    );
  });

  test('does not show error when null', async () => {
    const { queryByText } = await render(<DiscoveryFooter {...defaultProps} />);

    expect(queryByText(/error/i)).toBeNull();
  });

  test('shows error message when provided', async () => {
    const { getByText } = await render(
      <DiscoveryFooter {...defaultProps} error='Network error occurred' />
    );

    expect(getByText('Network error occurred')).toBeTruthy();
  });
});
