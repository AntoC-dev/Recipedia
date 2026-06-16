/**
 * Alert - Customizable confirmation dialog with flexible actions
 *
 * A versatile alert dialog component built on React Native Paper's Dialog with
 * support for both single-action confirmations and dual-action (confirm/cancel)
 * interactions. Features automatic layout adjustment and comprehensive callback handling.
 *
 * Key Features:
 * - Single or dual action button layouts
 * - Automatic layout adjustment based on button configuration
 * - Portal integration for proper overlay rendering
 * - Comprehensive callback system (confirm, cancel, close)
 * - Material Design styling and theming
 * - Accessibility support with proper test IDs
 * - Flexible content display with proper typography
 *
 * @example
 * ```typescript
 * // Simple confirmation dialog
 * <Alert
 *   testId="delete-recipe"
 *   isVisible={showDeleteDialog}
 *   title="Delete Recipe"
 *   content="Are you sure you want to delete this recipe?"
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   onClose={() => setShowDeleteDialog(false)}
 *   onConfirm={() => deleteRecipe()}
 *   onCancel={() => setShowDeleteDialog(false)}
 * />
 *
 * // Information dialog (single action)
 * <Alert
 *   testId="recipe-saved"
 *   isVisible={showSuccessDialog}
 *   title="Success"
 *   content="Recipe has been saved successfully!"
 *   confirmText="OK"
 *   onClose={() => setShowSuccessDialog(false)}
 * />
 * ```
 */

import React from 'react';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { StyleProp, View, ViewStyle } from 'react-native';

/**
 * Props for the Alert component
 */
export type AlertProps = {
  /** Unique identifier for testing and accessibility */
  testId: string;
  /** Whether the dialog is currently visible */
  isVisible: boolean;
  /** Title text displayed at the top of the dialog */
  title: string;
  /** Main content text of the dialog */
  content: string;
  /** Text for the primary confirm button */
  confirmText: string;
  /** Optional text for the cancel button (enables dual-action layout) */
  cancelText?: string;
  /** Callback fired when dialog is dismissed */
  onClose: () => void;
  /** Optional callback fired when confirm button is pressed */
  onConfirm?: () => void;
  /** Optional callback fired when cancel button is pressed */
  onCancel?: () => void;
  /** Optional style applied to the dialog surface (e.g. to offset its position) */
  style?: StyleProp<ViewStyle>;
};

/**
 * Alert component for customizable confirmation dialogs
 *
 * @param props - The component props
 * @returns JSX element representing a flexible alert dialog
 */
export function Alert({
  testId,
  isVisible,
  title,
  content,
  confirmText,
  cancelText,
  onClose,
  onConfirm,
  onCancel,
  style,
}: AlertProps) {
  const handleDismiss = () => {
    onClose();
  };

  const handleConfirm = () => {
    handleDismiss();
    onConfirm?.();
  };

  const handleCancel = () => {
    handleDismiss();
    onCancel?.();
  };

  const dialogTestId = testId + '::Dialog';

  // Let style by default if cancel not there. Otherwise, put cancel on the left and confirm on the right
  const actionStyle: StyleProp<ViewStyle> = cancelText
    ? {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }
    : {};

  return (
    <Portal>
      <Dialog visible={isVisible} onDismiss={handleDismiss} style={style}>
        <Dialog.Title testID={dialogTestId + '::Title'}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text testID={dialogTestId + '::Content'} variant={'bodyMedium'}>
            {content}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <View style={actionStyle}>
            {cancelText && (
              <Button testID={dialogTestId + '::Cancel'} mode={'outlined'} onPress={handleCancel}>
                {cancelText}
              </Button>
            )}
            <Button testID={dialogTestId + '::Confirm'} mode={'contained'} onPress={handleConfirm}>
              {confirmText}
            </Button>
          </View>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

export default Alert;
