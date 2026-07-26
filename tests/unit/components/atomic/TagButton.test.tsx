import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Chip } from 'react-native-paper';
import { TagButton } from '@components/atomic/TagButton';

describe('TagButton', () => {
  const testID = 'TagButton';

  test('renders the tag text', () => {
    const { getByTestId } = render(<TagButton text='Vegetarian' testID={testID} />);

    expect(getByTestId(`${testID}::Chip::Children`)).toHaveTextContent('Vegetarian');
  });

  test('calls onPressFunction when pressed', () => {
    const onPressFunction = jest.fn();
    const { getByTestId } = render(
      <TagButton text='Breakfast' testID={testID} onPressFunction={onPressFunction} />
    );

    fireEvent.press(getByTestId(`${testID}::Chip`));

    expect(onPressFunction).toHaveBeenCalledTimes(1);
  });

  test('does not throw when pressed without an onPressFunction', () => {
    const { getByTestId } = render(<TagButton text='Lunch' testID={testID} />);

    expect(() => fireEvent.press(getByTestId(`${testID}::Chip`))).not.toThrow();
  });

  test('passes rightIcon as closeIcon and wires onClose to onPressFunction', () => {
    const onPressFunction = jest.fn();
    const { UNSAFE_getByType } = render(
      <TagButton
        text='Gluten-Free'
        rightIcon='close'
        testID={testID}
        onPressFunction={onPressFunction}
      />
    );

    const chip = UNSAFE_getByType(Chip);

    expect(chip.props.closeIcon).toBe('close');
    expect(chip.props.onClose).toBe(onPressFunction);
  });

  test('leaves onClose undefined when no rightIcon is provided', () => {
    const { UNSAFE_getByType } = render(<TagButton text='No Icon' testID={testID} />);

    const chip = UNSAFE_getByType(Chip);

    expect(chip.props.closeIcon).toBeUndefined();
    expect(chip.props.onClose).toBeUndefined();
  });

  test('does not pass an icon function when no leftIcon is provided', () => {
    const { UNSAFE_getByType } = render(<TagButton text='No Left Icon' testID={testID} />);

    const chip = UNSAFE_getByType(Chip);

    expect(chip.props.icon).toBeUndefined();
  });

  test('builds a left icon element with the theme color and Chip-provided size', () => {
    const { UNSAFE_getByType } = render(
      <TagButton text='Breakfast' leftIcon='coffee' testID={testID} />
    );

    const chip = UNSAFE_getByType(Chip);
    const iconElement = chip.props.icon({ size: 24 });

    expect(iconElement.props.source).toBe('coffee');
    expect(iconElement.props.size).toBe(24);
  });
});
