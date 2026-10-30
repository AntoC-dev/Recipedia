import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';
import { TagButton } from '@components/atomic/TagButton';

describe('TagButton', () => {
  const testID = 'TagButton';

  test('renders the tag text', async () => {
    const { getByTestId } = await render(<TagButton text='Vegetarian' testID={testID} />);

    expect(getByTestId(`${testID}::Chip::Children`)).toHaveTextContent('Vegetarian');
  });

  test('calls onPressFunction when pressed', async () => {
    const onPressFunction = jest.fn();
    const { getByTestId } = await render(
      <TagButton text='Breakfast' testID={testID} onPressFunction={onPressFunction} />
    );

    await fireEvent.press(getByTestId(`${testID}::Chip`));

    expect(onPressFunction).toHaveBeenCalledTimes(1);
  });

  test('does not throw when pressed without an onPressFunction', async () => {
    const { getByTestId } = await render(<TagButton text='Lunch' testID={testID} />);

    await fireEvent.press(getByTestId(`${testID}::Chip`));
  });

  test('passes rightIcon as closeIcon and wires onClose to onPressFunction', async () => {
    const onPressFunction = jest.fn();
    const { getByTestId } = await render(
      <TagButton
        text='Gluten-Free'
        rightIcon='close'
        testID={testID}
        onPressFunction={onPressFunction}
      />
    );

    expect(getByTestId(`${testID}::Chip::CloseIcon`)).toHaveTextContent('close');

    await fireEvent.press(getByTestId(`${testID}::Chip::OnClose`));

    expect(onPressFunction).toHaveBeenCalledTimes(1);
  });

  test('leaves onClose undefined when no rightIcon is provided', async () => {
    const { queryByTestId } = await render(<TagButton text='No Icon' testID={testID} />);

    expect(queryByTestId(`${testID}::Chip::CloseIcon`)).toBeNull();
    expect(queryByTestId(`${testID}::Chip::OnClose`)).toBeNull();
  });

  test('does not pass an icon function when no leftIcon is provided', async () => {
    const { queryByTestId } = await render(<TagButton text='No Left Icon' testID={testID} />);

    expect(queryByTestId(`${testID}::Chip::Icon`)).toBeNull();
  });

  test('builds a left icon element with the theme color and Chip-provided size', async () => {
    const { getByTestId } = await render(
      <TagButton text='Breakfast' leftIcon='coffee' testID={testID} />
    );

    const icon = getByTestId(`${testID}::Chip::Icon`).children[0] as TestInstance;

    expect(icon).toHaveTextContent('coffee');
    expect(icon.props.size).toBe(24);
  });
});
