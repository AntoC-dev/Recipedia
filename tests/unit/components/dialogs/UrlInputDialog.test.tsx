import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { UrlInputDialog } from '@components/dialogs/UrlInputDialog';
import React from 'react';

describe('UrlInputDialog', () => {
  const defaultProps = {
    testId: 'test',
    isVisible: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dialog when visible', () => {
    const { getByTestId } = render(<UrlInputDialog {...defaultProps} />);

    expect(getByTestId('test::UrlDialog::Title')).toBeTruthy();
  });

  test('renders input field when not loading', () => {
    const { getByTestId } = render(<UrlInputDialog {...defaultProps} />);

    expect(getByTestId('test::UrlDialog::Input::CustomTextInput')).toBeTruthy();
  });

  test('shows loading indicator when isLoading', () => {
    const { getByTestId } = render(<UrlInputDialog {...defaultProps} isLoading={true} />);

    expect(getByTestId('test::UrlDialog::Loading')).toBeTruthy();
  });

  test('calls onClose when cancel pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<UrlInputDialog {...defaultProps} onClose={onClose} />);

    fireEvent.press(getByTestId('test::UrlDialog::CancelButton'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('does not call onClose when cancel pressed during loading', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <UrlInputDialog {...defaultProps} onClose={onClose} isLoading={true} />
    );

    fireEvent.press(getByTestId('test::UrlDialog::CancelButton'));

    expect(onClose).not.toHaveBeenCalled();
  });

  test('submit button is disabled when URL is empty', () => {
    const { getByTestId } = render(<UrlInputDialog {...defaultProps} />);

    expect(getByTestId('test::UrlDialog::SubmitButton').props.accessibilityState.disabled).toBe(
      true
    );
  });

  test('shows validation error for invalid URL', async () => {
    const { getByTestId } = render(<UrlInputDialog {...defaultProps} />);

    fireEvent.changeText(getByTestId('test::UrlDialog::Input::CustomTextInput'), 'invalid-url');

    await waitFor(() => {
      expect(getByTestId('test::UrlDialog::HelperText').props.children).toBe(
        'urlDialog.errorInvalidUrl'
      );
    });
  });

  test('calls onSubmit with normalized URL when valid URL submitted', async () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<UrlInputDialog {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.changeText(
      getByTestId('test::UrlDialog::Input::CustomTextInput'),
      'https://example.com/recipe'
    );

    await waitFor(() => {
      expect(getByTestId('test::UrlDialog::SubmitButton').props.accessibilityState.disabled).toBe(
        false
      );
    });

    fireEvent.press(getByTestId('test::UrlDialog::SubmitButton'));

    expect(onSubmit).toHaveBeenCalledWith('https://example.com/recipe');
  });

  test('displays external error message', () => {
    const { getByTestId } = render(
      <UrlInputDialog {...defaultProps} error='Network error occurred' />
    );

    expect(getByTestId('test::UrlDialog::HelperText').props.children).toBe(
      'Network error occurred'
    );
  });

  test('clears URL when dialog becomes visible', async () => {
    const { getByTestId, rerender } = render(
      <UrlInputDialog {...defaultProps} isVisible={false} />
    );

    rerender(<UrlInputDialog {...defaultProps} isVisible={true} />);

    await waitFor(() => {
      expect(getByTestId('test::UrlDialog::Input::CustomTextInput').props.value).toBe('');
    });
  });
});
