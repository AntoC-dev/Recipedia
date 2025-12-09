import React from 'react';
import { Button, Text, View } from 'react-native';
import type { SimilarityDialogProps } from '@components/dialogs/SimilarityDialog';
import { ingredientType } from '@customTypes/DatabaseElementTypes';

export function SimilarityDialog({ testId, isVisible, onClose, item }: SimilarityDialogProps) {
  const mockTestId = `${testId}::SimilarityDialog::Mock`;

  return (
    <View testID={mockTestId}>
      <Text testID={`${mockTestId}::isVisible`}>{String(isVisible)}</Text>
      <Button testID={`${mockTestId}::onClose`} title='onClose' onPress={onClose} />
      <Text testID={`${mockTestId}::item.type`}>{item.type}</Text>
      <Text testID={`${mockTestId}::item.newItemName`}>{item.newItemName}</Text>
      <Text testID={`${mockTestId}::item.similarItem`}>
        {item.similarItem ? JSON.stringify(item.similarItem) : 'undefined'}
      </Text>
      <Button
        testID={`${mockTestId}::item.onConfirm`}
        title='item.onConfirm'
        onPress={() => {
          if (item.type === 'Tag') {
            item.onConfirm({ id: 1, name: item.newItemName });
          } else {
            item.onConfirm({
              id: 1,
              name: item.newItemName,
              type: ingredientType.vegetable,
              unit: 'g',
              quantity: '100',
              season: [],
            });
          }
          onClose();
        }}
      />
      {item.onUseExisting && item.similarItem && (
        <Button
          testID={`${mockTestId}::item.onUseExisting`}
          title='item.onUseExisting'
          onPress={() => {
            if (item.type === 'Tag' && item.similarItem) {
              item.onUseExisting?.(item.similarItem);
            } else if (item.type === 'Ingredient' && item.similarItem) {
              item.onUseExisting?.(item.similarItem);
            }
            onClose();
          }}
        />
      )}
      {item.onDismiss && (
        <Button
          testID={`${mockTestId}::item.onDismiss`}
          title='item.onDismiss'
          onPress={() => {
            item.onDismiss?.();
            onClose();
          }}
        />
      )}
    </View>
  );
}

export default SimilarityDialog;
