import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { RoundButton } from '@components/atomic/RoundButton';

describe('RoundButton', () => {
  const testID = 'AddRecipe';
  const buttonId = testID + '::RoundButton';

  test('renders the icon on the button', () => {
    const { getByTestId } = render(
      <RoundButton icon='plus' testID={testID} label='Add recipe' onPressFunction={jest.fn()} />
    );

    expect(getByTestId(buttonId + '::Icon')).toHaveTextContent('plus');
  });

  test('calls onPressFunction when pressed', () => {
    const onPressFunction = jest.fn();
    const { getByTestId } = render(
      <RoundButton
        icon='plus'
        testID={testID}
        label='Add recipe'
        onPressFunction={onPressFunction}
      />
    );

    fireEvent.press(getByTestId(buttonId));

    expect(onPressFunction).toHaveBeenCalled();
  });

  test('renders a label when one is provided', () => {
    const { getByTestId } = render(
      <RoundButton icon='plus' testID={testID} label='Add recipe' onPressFunction={jest.fn()} />
    );

    expect(getByTestId(buttonId + '::Label')).toHaveTextContent('Add recipe');
  });

  test('exposes the label as the button accessibility label', () => {
    const { getByTestId } = render(
      <RoundButton icon='plus' testID={testID} label='Add recipe' onPressFunction={jest.fn()} />
    );

    expect(getByTestId(buttonId).props.accessibilityLabel).toBe('Add recipe');
  });

  test('applies a custom container style on top of the default one', () => {
    const { getByTestId } = render(
      <RoundButton
        icon='plus'
        testID={testID}
        label='Add recipe'
        style={{ marginTop: 24 }}
        onPressFunction={jest.fn()}
      />
    );

    expect(getByTestId(buttonId + '::Container')).toHaveStyle({
      alignItems: 'center',
      marginTop: 24,
    });
  });
});
