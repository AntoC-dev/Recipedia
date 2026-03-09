import React from 'react';
import { Button, Text, View } from 'react-native';
import type { ValidationProgressProps } from '@components/molecules/ValidationProgress';
import type {
  FormIngredientElement,
  ingredientTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { ingredientType } from '@customTypes/DatabaseElementTypes';

export function ValidationProgress(props: ValidationProgressProps) {
  const mockTestId = `${props.testID}::${props.type}Validation`;

  const handleOnValidated = () => {
    if (props.type === 'Tag') {
      const items = props.items as tagTableElement[];
      const item = items[0];
      if (item) {
        (props.onValidated as (original: tagTableElement, validated: tagTableElement) => void)(
          item,
          { id: 999, name: item.name }
        );
      }
    } else {
      const items = props.items as FormIngredientElement[];
      const item = items[0];
      if (item) {
        const mockValidated: ingredientTableElement = {
          id: 999,
          name: item.name ?? 'MockIngredient',
          type: ingredientType.vegetable,
          unit: item.unit ?? 'g',
          quantity: item.quantity ?? '100',
          season: [],
        };
        (
          props.onValidated as (
            original: FormIngredientElement,
            validated: ingredientTableElement
          ) => void
        )(item, mockValidated);
      }
    }
  };

  return (
    <View testID={mockTestId}>
      <Text testID={`${mockTestId}::type`}>{props.type}</Text>
      <Text testID={`${mockTestId}::items`}>{JSON.stringify(props.items)}</Text>
      <Text testID={`${mockTestId}::progress`}>{JSON.stringify(props.progress)}</Text>
      <Button
        testID={`${mockTestId}::onValidated`}
        title='onValidated'
        onPress={handleOnValidated}
      />
      <Button testID={`${mockTestId}::onComplete`} title='onComplete' onPress={props.onComplete} />
      <Button
        testID={`${mockTestId}::onDismissed`}
        title='onDismissed'
        onPress={props.onDismissed}
      />
    </View>
  );
}
