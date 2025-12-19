import React from 'react';
import { Button, Text, View } from 'react-native';
import type { ValidationQueueProps } from '@components/dialogs/ValidationQueue';
import { ingredientType } from '@customTypes/DatabaseElementTypes';

export function ValidationQueue(props: ValidationQueueProps) {
  const mockTestId = `${props.testId}::ValidationQueue::Mock`;

  return (
    <View testID={mockTestId}>
      <Text testID={`${mockTestId}::type`}>{props.type}</Text>
      <Text testID={`${mockTestId}::items`}>{JSON.stringify(props.items)}</Text>
      <Button testID={`${mockTestId}::onComplete`} title='onComplete' onPress={props.onComplete} />
      <Button
        testID={`${mockTestId}::onValidated`}
        title='onValidated'
        onPress={() =>
          props.type === 'Tag'
            ? props.onValidated({ id: 1, name: 'originalTag' }, { id: 2, name: 'mockTag' })
            : props.onValidated(
                { name: 'originalIngredient', quantity: '50' },
                {
                  id: 1,
                  name: 'mockIngredient',
                  type: ingredientType.vegetable,
                  unit: 'g',
                  quantity: '100',
                  season: [],
                }
              )
        }
      />
      {props.onDismissed && (
        <Button
          testID={`${mockTestId}::onDismissed`}
          title='onDismissed'
          onPress={() =>
            props.type === 'Tag'
              ? props.onDismissed?.({ id: 1, name: 'mockTag' })
              : props.onDismissed?.({
                  id: 1,
                  name: 'mockIngredient',
                  type: ingredientType.vegetable,
                  unit: 'g',
                  quantity: '100',
                  season: [],
                })
          }
        />
      )}
    </View>
  );
}

export default ValidationQueue;
