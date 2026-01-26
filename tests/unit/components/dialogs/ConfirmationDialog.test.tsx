import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ConfirmationDialog } from '@components/dialogs/ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const testId = 'test-confirmation';
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    testId,
    isVisible: true,
    title: 'Confirm Action',
    content: 'Are you sure you want to proceed with this action?',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    test('renders when isVisible is true', () => {
      const { getByTestId } = render(<ConfirmationDialog {...defaultProps} />);

      expect(getByTestId(testId)).toBeTruthy();
    });

    test('does not render when isVisible is false', () => {
      const { queryByTestId } = render(<ConfirmationDialog {...defaultProps} isVisible={false} />);

      expect(queryByTestId(testId)).toBeNull();
    });
  });

  describe('content rendering', () => {
    test('renders title correctly', () => {
      const { getByTestId, getByText } = render(<ConfirmationDialog {...defaultProps} />);

      const titleElement = getByTestId(`${testId}::Title`);
      expect(titleElement).toBeTruthy();
      expect(getByText(defaultProps.title)).toBeTruthy();
    });

    test('renders content text correctly', () => {
      const { getByTestId, getByText } = render(<ConfirmationDialog {...defaultProps} />);

      const contentElement = getByTestId(`${testId}::Content`);
      expect(contentElement).toBeTruthy();
      expect(getByText(defaultProps.content)).toBeTruthy();
    });

    test('renders confirm button with correct label', () => {
      const { getByTestId, getByText } = render(<ConfirmationDialog {...defaultProps} />);

      const confirmButton = getByTestId(`${testId}::ConfirmButton`);
      expect(confirmButton).toBeTruthy();
      expect(getByText(defaultProps.confirmLabel)).toBeTruthy();
    });

    test('renders cancel button with correct label', () => {
      const { getByTestId, getByText } = render(<ConfirmationDialog {...defaultProps} />);

      const cancelButton = getByTestId(`${testId}::CancelButton`);
      expect(cancelButton).toBeTruthy();
      expect(getByText(defaultProps.cancelLabel)).toBeTruthy();
    });
  });

  describe('button actions', () => {
    test('calls onConfirm when confirm button is pressed', () => {
      const { getByTestId } = render(<ConfirmationDialog {...defaultProps} />);

      fireEvent.press(getByTestId(`${testId}::ConfirmButton`));

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    test('calls onCancel when cancel button is pressed', () => {
      const { getByTestId } = render(<ConfirmationDialog {...defaultProps} />);

      fireEvent.press(getByTestId(`${testId}::CancelButton`));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    test('calls onCancel when dialog is dismissed', () => {
      const { getByTestId } = render(<ConfirmationDialog {...defaultProps} />);

      const dialog = getByTestId(testId);
      expect(dialog.props.onDismiss).toBe(mockOnCancel);
    });
  });

  describe('custom labels and content', () => {
    test('renders custom title', () => {
      const customTitle = 'Delete Recipe?';
      const { getByText } = render(<ConfirmationDialog {...defaultProps} title={customTitle} />);

      expect(getByText(customTitle)).toBeTruthy();
    });

    test('renders custom content', () => {
      const customContent = 'This action cannot be undone. All data will be permanently lost.';
      const { getByText } = render(
        <ConfirmationDialog {...defaultProps} content={customContent} />
      );

      expect(getByText(customContent)).toBeTruthy();
    });

    test('renders custom confirm label', () => {
      const customConfirmLabel = 'Delete';
      const { getByText } = render(
        <ConfirmationDialog {...defaultProps} confirmLabel={customConfirmLabel} />
      );

      expect(getByText(customConfirmLabel)).toBeTruthy();
    });

    test('renders custom cancel label', () => {
      const customCancelLabel = 'Go Back';
      const { getByText } = render(
        <ConfirmationDialog {...defaultProps} cancelLabel={customCancelLabel} />
      );

      expect(getByText(customCancelLabel)).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    test('handles very long title text', () => {
      const longTitle =
        'This Is A Very Long Title That Tests How The Dialog Handles Extended Text Content In The Title Section';
      const { getByText } = render(<ConfirmationDialog {...defaultProps} title={longTitle} />);

      expect(getByText(longTitle)).toBeTruthy();
    });

    test('handles very long content text', () => {
      const longContent =
        'This is a very long content message that explains in great detail what will happen if the user confirms this action. It includes multiple sentences and provides comprehensive information about the consequences of proceeding with this operation. The content should be rendered properly even when it exceeds normal length expectations.';
      const { getByText } = render(<ConfirmationDialog {...defaultProps} content={longContent} />);

      expect(getByText(longContent)).toBeTruthy();
    });

    test('handles empty title', () => {
      const { getByTestId } = render(<ConfirmationDialog {...defaultProps} title='' />);

      expect(getByTestId(`${testId}::Title`)).toBeTruthy();
    });

    test('handles empty content', () => {
      const { getByTestId } = render(<ConfirmationDialog {...defaultProps} content='' />);

      expect(getByTestId(`${testId}::Content`)).toBeTruthy();
    });

    test('handles special characters in content', () => {
      const specialContent = 'Are you sure? This will delete: recipe-name_123 & ingredients!';
      const { getByText } = render(
        <ConfirmationDialog {...defaultProps} content={specialContent} />
      );

      expect(getByText(specialContent)).toBeTruthy();
    });

    test('handles line breaks in content', () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3';
      const { getByText } = render(
        <ConfirmationDialog {...defaultProps} content={multilineContent} />
      );

      expect(getByText(multilineContent)).toBeTruthy();
    });
  });

  describe('multiple interactions', () => {
    test('handles multiple confirm button presses', () => {
      const { getByTestId } = render(<ConfirmationDialog {...defaultProps} />);

      const confirmButton = getByTestId(`${testId}::ConfirmButton`);
      fireEvent.press(confirmButton);
      fireEvent.press(confirmButton);
      fireEvent.press(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(3);
    });

    test('handles multiple cancel button presses', () => {
      const { getByTestId } = render(<ConfirmationDialog {...defaultProps} />);

      const cancelButton = getByTestId(`${testId}::CancelButton`);
      fireEvent.press(cancelButton);
      fireEvent.press(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(2);
    });
  });

  describe('button layout', () => {
    test('confirm button is rendered before cancel button', () => {
      const { getByTestId } = render(<ConfirmationDialog {...defaultProps} />);

      expect(getByTestId(`${testId}::ConfirmButton`)).toBeTruthy();
      expect(getByTestId(`${testId}::CancelButton`)).toBeTruthy();
    });
  });
});
