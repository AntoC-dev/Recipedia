/**
 * ConfirmationDialog - Generic confirmation dialog for user decisions
 *
 * A reusable dialog that asks the user to confirm or cancel an action.
 * Supports customizable title, content, and button labels.
 *
 * @example
 * ```typescript
 * <ConfirmationDialog
 *   testId="delete-confirmation"
 *   isVisible={showConfirm}
 *   title="Delete recipe?"
 *   content="This action cannot be undone."
 *   confirmLabel="Delete"
 *   cancelLabel="Cancel"
 *   onConfirm={() => deleteRecipe()}
 *   onCancel={() => setShowConfirm(false)}
 * />
 * ```
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { padding } from '@styles/spacing';

export type ConfirmationDialogProps = {
  testId: string;
  isVisible: boolean;
  title: string;
  content: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    gap: padding.small,
  },
});

/**
 * A generic confirmation dialog with customizable labels.
 */
export function ConfirmationDialog({
  testId,
  isVisible,
  title,
  content,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <Portal>
      <Dialog visible={isVisible} onDismiss={onCancel} testID={testId}>
        <Dialog.Title testID={`${testId}::Title`}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text testID={`${testId}::Content`} variant='bodyMedium'>
            {content}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <View style={styles.actionButton}>
            <Button testID={`${testId}::ConfirmButton`} mode='contained' onPress={onConfirm}>
              {confirmLabel}
            </Button>
            <Button testID={`${testId}::CancelButton`} mode='outlined' onPress={onCancel}>
              {cancelLabel}
            </Button>
          </View>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

export default ConfirmationDialog;
