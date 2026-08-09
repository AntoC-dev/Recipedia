import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AlertProps } from '@components/dialogs/Alert';

export function alertMock({
  title,
  testId,
  cancelText,
  isVisible,
  onCancel,
  content,
  onConfirm,
  confirmText,
  onClose,
}: AlertProps) {
  const dialogTestId = testId + '::Alert';

  // Always render the mock and show isVisible state as text
  return (
    <View>
      <Text testID={dialogTestId + '::IsVisible'}>{isVisible}</Text>
      <Text testID={dialogTestId + '::TestId'}>{testId}</Text>
      <Text testID={dialogTestId + '::Title'}>{title}</Text>
      <Text testID={dialogTestId + '::Content'}>{content}</Text>
      <Text testID={dialogTestId + '::ConfirmText'}>{confirmText}</Text>
      {cancelText && <Text testID={dialogTestId + '::CancelText'}>{cancelText}</Text>}

      <TouchableOpacity testID={dialogTestId + '::OnClose'} onPress={onClose}>
        <Text>OnClose</Text>
      </TouchableOpacity>

      {onConfirm && (
        <TouchableOpacity
          testID={dialogTestId + '::OnConfirm'}
          onPress={() => {
            onClose();
            void onConfirm();
          }}
        >
          <Text>OnConfirm</Text>
        </TouchableOpacity>
      )}

      {onCancel && (
        <TouchableOpacity
          testID={dialogTestId + '::OnCancel'}
          onPress={() => {
            onClose();
            onCancel();
          }}
        >
          <Text>OnCancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
