import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { RoundButton } from '@components/atomic/RoundButton';

describe('RoundButton', () => {
  const testID = 'AddRecipe';
  const buttonId = testID + '::RoundButton';

  test('renders the icon on the button', () => {
    const { getByTestId } = render(
      <RoundButton icon='plus' testID={testID} onPressFunction={jest.fn()} />
    );

    expect(getByTestId(buttonId + '::Icon')).toHaveTextContent('plus');
  });

  test('calls onPressFunction when pressed', () => {
    const onPressFunction = jest.fn();
    const { getByTestId } = render(
      <RoundButton icon='plus' testID={testID} onPressFunction={onPressFunction} />
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

  test('renders an empty label when one is explicitly empty', () => {
    const { getByTestId } = render(
      <RoundButton icon='plus' testID={testID} label='' onPressFunction={jest.fn()} />
    );

    expect(getByTestId(buttonId + '::Label')).toHaveTextContent('');
  });

  test('renders no label when none is provided', () => {
    const { queryByTestId } = render(
      <RoundButton icon='plus' testID={testID} onPressFunction={jest.fn()} />
    );

    expect(queryByTestId(buttonId + '::Label')).toBeNull();
  });

  test('applies a custom container style on top of the default one', () => {
    const { getByTestId } = render(
      <RoundButton
        icon='plus'
        testID={testID}
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
