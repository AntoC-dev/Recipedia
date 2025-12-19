import { fireEvent, render } from '@testing-library/react-native';
import { DiscoveryFooter } from '@components/molecules/DiscoveryFooter';
import React from 'react';

describe('DiscoveryFooter', () => {
  const defaultProps = {
    error: null,
    selectedCount: 5,
    isDiscovering: false,
    onContinue: jest.fn(),
    testID: 'test-footer',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders continue button', () => {
    const { getByTestId } = render(<DiscoveryFooter {...defaultProps} />);

    expect(getByTestId('test-footer::ContinueButton')).toBeTruthy();
  });

  test('calls onContinue when button pressed', () => {
    const onContinue = jest.fn();
    const { getByTestId } = render(<DiscoveryFooter {...defaultProps} onContinue={onContinue} />);

    fireEvent.press(getByTestId('test-footer::ContinueButton'));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  test('disables button when selectedCount is 0', () => {
    const { getByTestId } = render(<DiscoveryFooter {...defaultProps} selectedCount={0} />);

    expect(getByTestId('test-footer::ContinueButton').props.accessibilityState.disabled).toBe(true);
  });

  test('disables button when discovering', () => {
    const { getByTestId } = render(<DiscoveryFooter {...defaultProps} isDiscovering={true} />);

    expect(getByTestId('test-footer::ContinueButton').props.accessibilityState.disabled).toBe(true);
  });

  test('enables button when has selection and not discovering', () => {
    const { getByTestId } = render(<DiscoveryFooter {...defaultProps} />);

    expect(getByTestId('test-footer::ContinueButton').props.accessibilityState.disabled).toBe(
      false
    );
  });

  test('does not show error when null', () => {
    const { queryByText } = render(<DiscoveryFooter {...defaultProps} />);

    expect(queryByText(/error/i)).toBeNull();
  });

  test('shows error message when provided', () => {
    const { getByText } = render(
      <DiscoveryFooter {...defaultProps} error='Network error occurred' />
    );

    expect(getByText('Network error occurred')).toBeTruthy();
  });
});
