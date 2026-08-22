import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet, ViewStyle } from 'react-native';
import Alert, { AlertProps } from '@components/dialogs/Alert';
import { dialogActionStyles } from '@styles/buttons';
import React from 'react';

describe('Alert Dialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    testId: 'test-alert',
    isVisible: true,
    title: 'Test Title',
    content: 'Test content message',
    confirmText: 'Confirm',
    onClose: mockOnClose,
  };

  // Helper function to render Alert with default props
  const renderAlert = (overrideProps = {}) => {
    const prop: AlertProps = { ...defaultProps, ...overrideProps };
    return render(<Alert {...prop} />);
  };

  // Helper function to assert the initial single-action dialog state
  const assertSingleActionDialog = (getByTestId: any) => {
    // Assert dialog structure is present
    expect(getByTestId('test-alert::Dialog::Title')).toBeTruthy();
    expect(getByTestId('test-alert::Dialog::Content')).toBeTruthy();
    expect(getByTestId('test-alert::Dialog::Confirm')).toBeTruthy();

    // Assert content is correct
    expect(getByTestId('test-alert::Dialog::Title').props.children).toEqual(defaultProps.title);
    expect(getByTestId('test-alert::Dialog::Content').props.children).toEqual(defaultProps.content);
    // Check button content exists
    expect(getByTestId('test-alert::Dialog::Confirm').props.children).toBeDefined();

    // Assert cancel button is NOT present in the single-action layout
    expect(() => getByTestId('test-alert::Dialog::Cancel')).toThrow();
  };

  // Helper function to assert a dual-action dialog state
  const assertDualActionDialog = (getByTestId: any) => {
    // Assert dialog structure is present
    expect(getByTestId('test-alert::Dialog::Title')).toBeTruthy();
    expect(getByTestId('test-alert::Dialog::Content')).toBeTruthy();
    expect(getByTestId('test-alert::Dialog::Confirm')).toBeTruthy();
    expect(getByTestId('test-alert::Dialog::Cancel')).toBeTruthy();

    // Assert content is correct
    expect(getByTestId('test-alert::Dialog::Title').props.children).toEqual(defaultProps.title);
    expect(getByTestId('test-alert::Dialog::Content').props.children).toEqual(defaultProps.content);
    // Check button content exists
    expect(getByTestId('test-alert::Dialog::Confirm').props.children).toBeDefined();
    // Check cancel button content exists
    expect(getByTestId('test-alert::Dialog::Cancel').props.children).toBeDefined();
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders single-action dialog correctly when cancelText is not provided', () => {
    const { getByTestId } = renderAlert();

    // Assert single-action dialog layout
    assertSingleActionDialog(getByTestId);
  });

  test('renders dual-action dialog correctly when cancelText is provided', () => {
    const { getByTestId } = renderAlert({
      cancelText: 'Cancel',
      onCancel: mockOnCancel,
    });

    // Assert dual-action dialog layout
    assertDualActionDialog(getByTestId);
  });

  test('does not render dialog when isVisible is false', () => {
    const { queryByTestId } = renderAlert({ isVisible: false });

    // Assert dialog elements are not accessible when not visible
    expect(queryByTestId('test-alert::Dialog::Title')).toBeNull();
    expect(queryByTestId('test-alert::Dialog::Content')).toBeNull();
    expect(queryByTestId('test-alert::Dialog::Confirm')).toBeNull();
    expect(queryByTestId('test-alert::Dialog::Cancel')).toBeNull();
  });

  test('calls onClose and onConfirm when confirm button is pressed', () => {
    const { getByTestId } = renderAlert({ onConfirm: mockOnConfirm });

    assertSingleActionDialog(getByTestId);
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('test-alert::Dialog::Confirm'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);

    // Assert dialog structure is still present (component doesn't auto-hide)
    assertSingleActionDialog(getByTestId);
  });

  test('calls onClose and onCancel when cancel button is pressed in dual-action layout', () => {
    const { getByTestId } = renderAlert({
      cancelText: 'Cancel',
      onCancel: mockOnCancel,
      onConfirm: mockOnConfirm,
    });

    assertDualActionDialog(getByTestId);
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnCancel).not.toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('test-alert::Dialog::Cancel'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();

    // Assert dialog structure is still present
    assertDualActionDialog(getByTestId);
  });

  test('works correctly without optional onConfirm callback', () => {
    const { getByTestId } = renderAlert({ onConfirm: undefined });

    // Assert initial state
    assertSingleActionDialog(getByTestId);
    expect(mockOnClose).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('test-alert::Dialog::Confirm'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Assert dialog structure is still present
    assertSingleActionDialog(getByTestId);
  });

  test('works correctly without optional onCancel callback in dual-action layout', () => {
    const { getByTestId } = renderAlert({
      cancelText: 'Cancel',
      onCancel: undefined,
    });

    assertDualActionDialog(getByTestId);
    expect(mockOnClose).not.toHaveBeenCalled();

    // Press cancel button (should not throw error)
    fireEvent.press(getByTestId('test-alert::Dialog::Cancel'));

    // Assert only onClose was called (onCancel was undefined)
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Assert dialog structure is still present
    assertDualActionDialog(getByTestId);
  });

  test('displays custom title and content correctly', () => {
    const customProps = {
      title: 'Custom Alert Title',
      content: 'This is a custom alert message with detailed information.',
      confirmText: 'Custom Confirm',
      cancelText: 'Custom Cancel',
    };

    const { getByTestId } = renderAlert(customProps);

    // Assert custom content is displayed correctly
    expect(getByTestId('test-alert::Dialog::Title').props.children).toEqual('Custom Alert Title');
    expect(getByTestId('test-alert::Dialog::Content').props.children).toEqual(
      'This is a custom alert message with detailed information.'
    );
    expect(getByTestId('test-alert::Dialog::Confirm')).toBeTruthy();
    expect(getByTestId('test-alert::Dialog::Cancel')).toBeTruthy();
  });

  test('uses different testId correctly for multiple instances', () => {
    const { getByTestId } = renderAlert({ testId: 'custom-alert-id' });

    // Assert elements use the custom testId
    expect(getByTestId('custom-alert-id::Dialog::Title')).toBeTruthy();
    expect(getByTestId('custom-alert-id::Dialog::Content')).toBeTruthy();
    expect(getByTestId('custom-alert-id::Dialog::Confirm')).toBeTruthy();

    // Assert old testId elements don't exist
    expect(() => getByTestId('test-alert::Dialog::Title')).toThrow();
    expect(() => getByTestId('test-alert::Dialog::Content')).toThrow();
    expect(() => getByTestId('test-alert::Dialog::Confirm')).toThrow();

    // Assert content is still correct
    expect(getByTestId('custom-alert-id::Dialog::Title').props.children).toEqual('Test Title');
    expect(getByTestId('custom-alert-id::Dialog::Content').props.children).toEqual(
      'Test content message'
    );
  });

  test('maintains proper button order in dual-action layout', () => {
    const { getByTestId } = renderAlert({
      cancelText: 'Cancel',
      confirmText: 'OK',
      onCancel: mockOnCancel,
      onConfirm: mockOnConfirm,
    });

    const cancelButton = getByTestId('test-alert::Dialog::Cancel');
    const confirmButton = getByTestId('test-alert::Dialog::Confirm');

    expect(cancelButton).toBeTruthy();
    expect(confirmButton).toBeTruthy();

    // Test both buttons work independently
    fireEvent.press(cancelButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();

    expect(cancelButton).toBeTruthy();
    expect(confirmButton).toBeTruthy();

    jest.clearAllMocks();

    fireEvent.press(confirmButton);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();

    expect(cancelButton).toBeTruthy();
    expect(confirmButton).toBeTruthy();
  });

  test('restores the Material button sizing that Dialog.Actions strips with compact', () => {
    const { getByTestId } = renderAlert({
      cancelText: 'Cancel',
      onCancel: mockOnCancel,
    });

    const cancelStyle = StyleSheet.flatten(
      getByTestId('test-alert::Dialog::Cancel').props.style as ViewStyle
    );
    const confirmStyle = StyleSheet.flatten(
      getByTestId('test-alert::Dialog::Confirm').props.style as ViewStyle
    );

    expect(cancelStyle).toMatchObject(StyleSheet.flatten(dialogActionStyles.button));
    expect(confirmStyle).toMatchObject(StyleSheet.flatten(dialogActionStyles.button));
  });

  test('leaves the actions row to Dialog.Actions instead of nesting its own layout', () => {
    const { getByTestId, queryByTestId } = renderAlert({
      cancelText: 'Cancel',
      onCancel: mockOnCancel,
    });

    expect(queryByTestId('test-alert::Dialog::Actions')).toBeNull();
    expect(getByTestId('test-alert::Dialog::Cancel')).toBeTruthy();
    expect(getByTestId('test-alert::Dialog::Confirm')).toBeTruthy();
  });
});
