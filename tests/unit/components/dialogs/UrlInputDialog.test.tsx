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

  test('renders dialog when visible', async () => {
    const { getByTestId } = await render(<UrlInputDialog {...defaultProps} />);

    expect(getByTestId('test::UrlDialog::Title')).toBeTruthy();
  });

  test('renders input field when not loading', async () => {
    const { getByTestId } = await render(<UrlInputDialog {...defaultProps} />);

    expect(getByTestId('test::UrlDialog::Input::CustomTextInput')).toBeTruthy();
  });

  test('shows loading indicator when isLoading', async () => {
    const { getByTestId } = await render(<UrlInputDialog {...defaultProps} isLoading={true} />);

    expect(getByTestId('test::UrlDialog::Loading')).toBeTruthy();
  });

  test('calls onClose when cancel pressed', async () => {
    const onClose = jest.fn();
    const { getByTestId } = await render(<UrlInputDialog {...defaultProps} onClose={onClose} />);

    await fireEvent.press(getByTestId('test::UrlDialog::CancelButton'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('does not call onClose when cancel pressed during loading', async () => {
    const onClose = jest.fn();
    const { getByTestId } = await render(
      <UrlInputDialog {...defaultProps} onClose={onClose} isLoading={true} />
    );

    await fireEvent.press(getByTestId('test::UrlDialog::CancelButton'));

    expect(onClose).not.toHaveBeenCalled();
  });

  test('submit button is disabled when URL is empty', async () => {
    const { getByTestId } = await render(<UrlInputDialog {...defaultProps} />);

    expect(getByTestId('test::UrlDialog::SubmitButton').props.accessibilityState.disabled).toBe(
      true
    );
  });

  test('shows validation error for invalid URL', async () => {
    const { getByTestId } = await render(<UrlInputDialog {...defaultProps} />);

    await fireEvent.changeText(
      getByTestId('test::UrlDialog::Input::CustomTextInput'),
      'invalid-url'
    );

    await waitFor(() => {
      expect(getByTestId('test::UrlDialog::HelperText').props.children).toBe(
        'urlDialog.errorInvalidUrl'
      );
    });
  });

  test('calls onSubmit with normalized URL when valid URL submitted', async () => {
    const onSubmit = jest.fn();
    const { getByTestId } = await render(<UrlInputDialog {...defaultProps} onSubmit={onSubmit} />);

    await fireEvent.changeText(
      getByTestId('test::UrlDialog::Input::CustomTextInput'),
      'https://example.com/recipe'
    );

    await waitFor(() => {
      expect(getByTestId('test::UrlDialog::SubmitButton').props.accessibilityState.disabled).toBe(
        false
      );
    });

    await fireEvent.press(getByTestId('test::UrlDialog::SubmitButton'));

    expect(onSubmit).toHaveBeenCalledWith('https://example.com/recipe');
  });

  test('displays external error message', async () => {
    const { getByTestId } = await render(
      <UrlInputDialog {...defaultProps} error='Network error occurred' />
    );

    expect(getByTestId('test::UrlDialog::HelperText').props.children).toBe(
      'Network error occurred'
    );
  });

  test('clears URL when dialog becomes visible', async () => {
    const { getByTestId, rerender } = await render(
      <UrlInputDialog {...defaultProps} isVisible={false} />
    );

    await rerender(<UrlInputDialog {...defaultProps} isVisible={true} />);

    await waitFor(() => {
      expect(getByTestId('test::UrlDialog::Input::CustomTextInput').props.value).toBe('');
    });
  });
});
