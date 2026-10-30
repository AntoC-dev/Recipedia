import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CustomTextInput, CustomTextInputProps } from '@components/atomic/CustomTextInput';

// Helpers for props
const baseProps: CustomTextInputProps = {
  testID: 'custom-input',
  value: 'initial',
};

describe('CustomTextInput', () => {
  test('renders with label and value', async () => {
    const { getByTestId, getAllByText } = await render(
      <CustomTextInput {...baseProps} label='Email' value='test@example.com' />
    );
    const input = getByTestId('custom-input::CustomTextInput');
    expect(input.props.value).toEqual('test@example.com');
    // expect(input.props.label).toEqual('Email');
    expect(getAllByText('Email').length).toBeGreaterThan(0);
  });

  test('fires onChangeText when text changes', async () => {
    const handleChange = jest.fn();
    const { getByTestId } = await render(
      <CustomTextInput {...baseProps} onChangeText={handleChange} />
    );

    const input = getByTestId('custom-input::CustomTextInput');
    await fireEvent.changeText(input, 'hello');
    expect(handleChange).toHaveBeenCalledWith('hello');
  });

  test('calls onFocus and onBlur at appropriate times', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId } = await render(
      <CustomTextInput {...baseProps} onFocus={onFocus} onBlur={onBlur} />
    );
    const input = getByTestId('custom-input::CustomTextInput');

    await fireEvent(input, 'onFocus');
    expect(onFocus).toHaveBeenCalled();
    await fireEvent(input, 'onBlur');
    expect(onBlur).toHaveBeenCalled();
  });

  test('calls onEndEditing when editing ends', async () => {
    const onEndEditing = jest.fn();
    const { getByTestId } = await render(
      <CustomTextInput {...baseProps} onEndEditing={onEndEditing} />
    );
    const input = getByTestId('custom-input::CustomTextInput');

    await fireEvent(input, 'onEndEditing');
    expect(onEndEditing).toHaveBeenCalled();
  });

  test('is not editable when prop editable is false', async () => {
    const { getByTestId } = await render(<CustomTextInput {...baseProps} editable={false} />);
    const input = getByTestId('custom-input::CustomTextInput');
    expect(input.props.editable).toBe(false);
  });

  test('passes multiline prop to the underlying input', async () => {
    const { getByTestId } = await render(
      <CustomTextInput {...baseProps} multiline value={'abc\ndef'} />
    );
    expect(getByTestId('custom-input::CustomTextInput').props.multiline).toBe(true);
  });

  test('disables inner scrolling when multiline so the parent scroll view keeps the gesture', async () => {
    const { getByTestId } = await render(
      <CustomTextInput {...baseProps} multiline value={'abc\ndef'} />
    );
    expect(getByTestId('custom-input::CustomTextInput').props.scrollEnabled).toBe(false);
  });

  test('leaves inner scrolling untouched for single-line inputs', async () => {
    const { getByTestId } = await render(<CustomTextInput {...baseProps} value='abc' />);
    expect(getByTestId('custom-input::CustomTextInput').props.scrollEnabled).toBeUndefined();
  });

  test('is editable by default when editable prop is true', async () => {
    const { getByTestId } = await render(<CustomTextInput {...baseProps} editable />);
    const input = getByTestId('custom-input::CustomTextInput');

    expect(input.props.editable).toBe(true);
  });

  test('renders placeholder text on the input element', async () => {
    const { getByTestId } = await render(
      <CustomTextInput {...baseProps} placeholder='Enter a value...' />
    );
    expect(getByTestId('custom-input::CustomTextInput').props.placeholder).toBe('Enter a value...');
  });

  test('allows direct text input without any pre-interaction', async () => {
    const handleChange = jest.fn();
    const { getByTestId } = await render(
      <CustomTextInput {...baseProps} onChangeText={handleChange} editable />
    );

    const input = getByTestId('custom-input::CustomTextInput');
    await fireEvent.changeText(input, 'TestTag');
    expect(handleChange).toHaveBeenCalledWith('TestTag');
    expect(input.props.editable).toBe(true);
  });

  describe('displayValue cursor-fix behavior', () => {
    test('initialises displayed value from value prop', async () => {
      const { getByTestId } = await render(<CustomTextInput testID='custom-input' value='hello' />);
      expect(getByTestId('custom-input::CustomTextInput').props.value).toBe('hello');
    });

    test('renders empty string when value prop is undefined', async () => {
      const { getByTestId } = await render(<CustomTextInput testID='custom-input' />);
      expect(getByTestId('custom-input::CustomTextInput').props.value).toBe('');
    });

    test('updates displayed value immediately when user types', async () => {
      const { getByTestId } = await render(<CustomTextInput {...baseProps} value='test' />);
      const input = getByTestId('custom-input::CustomTextInput');

      await fireEvent.changeText(input, 'NewTest');

      expect(input.props.value).toBe('NewTest');
    });

    test('retains typed text when parent re-renders with stale same value during validation', async () => {
      const onChangeText = jest.fn();
      const { getByTestId, rerender } = await render(
        <CustomTextInput {...baseProps} value='Italian' onChangeText={onChangeText} />
      );
      const input = getByTestId('custom-input::CustomTextInput');

      await fireEvent.changeText(input, 'New Italian');
      await rerender(
        <CustomTextInput {...baseProps} value='Italian' onChangeText={onChangeText} />
      );

      expect(input.props.value).toBe('New Italian');
      expect(onChangeText).toHaveBeenCalledWith('New Italian');
    });

    test('syncs displayed value when parent provides a new external value', async () => {
      const { getByTestId, rerender } = await render(
        <CustomTextInput {...baseProps} value='original' />
      );
      const input = getByTestId('custom-input::CustomTextInput');

      await rerender(<CustomTextInput {...baseProps} value='updated' />);

      expect(input.props.value).toBe('updated');
    });

    test('syncs to empty string when parent clears value to undefined', async () => {
      const { getByTestId, rerender } = await render(
        <CustomTextInput {...baseProps} value='text' />
      );
      const input = getByTestId('custom-input::CustomTextInput');

      await rerender(<CustomTextInput {...baseProps} value={undefined} />);

      expect(input.props.value).toBe('');
    });

    test('applies a subsequent external change after user has typed', async () => {
      const { getByTestId, rerender } = await render(
        <CustomTextInput {...baseProps} value='original' />
      );
      const input = getByTestId('custom-input::CustomTextInput');

      await fireEvent.changeText(input, 'typed');
      await rerender(<CustomTextInput {...baseProps} value='server-reset' />);

      expect(input.props.value).toBe('server-reset');
    });
  });

  describe('commit-on-blur behavior', () => {
    test('fires onEndEditing with current displayed text on endEditing', async () => {
      const onEndEditing = jest.fn();
      const { getByTestId } = await render(
        <CustomTextInput {...baseProps} value='hello' onEndEditing={onEndEditing} />
      );
      const input = getByTestId('custom-input::CustomTextInput');

      await fireEvent.changeText(input, 'hello world');
      await fireEvent(input, 'endEditing');

      expect(onEndEditing).toHaveBeenCalledWith('hello world');
    });

    test('fires onEndEditing with current text on blur', async () => {
      const onEndEditing = jest.fn();
      const { getByTestId } = await render(
        <CustomTextInput {...baseProps} value='initial' onEndEditing={onEndEditing} />
      );
      const input = getByTestId('custom-input::CustomTextInput');

      await fireEvent.changeText(input, 'typed text');
      await fireEvent(input, 'blur');

      expect(onEndEditing).toHaveBeenCalledWith('typed text');
    });

    test('does not fire onEndEditing twice when Done key fires both endEditing and blur', async () => {
      const onEndEditing = jest.fn();
      const { getByTestId } = await render(
        <CustomTextInput {...baseProps} value='initial' onEndEditing={onEndEditing} />
      );
      const input = getByTestId('custom-input::CustomTextInput');

      await fireEvent.changeText(input, 'committed');
      await fireEvent(input, 'endEditing');
      await fireEvent(input, 'blur');

      expect(onEndEditing).toHaveBeenCalledTimes(1);
      expect(onEndEditing).toHaveBeenCalledWith('committed');
    });

    test('onChangeText still fires per-keystroke when provided', async () => {
      const onChangeText = jest.fn();
      const { getByTestId } = await render(
        <CustomTextInput {...baseProps} onChangeText={onChangeText} />
      );
      const input = getByTestId('custom-input::CustomTextInput');

      await fireEvent.changeText(input, 'a');
      await fireEvent.changeText(input, 'ab');

      expect(onChangeText).toHaveBeenCalledTimes(2);
      expect(onChangeText).toHaveBeenNthCalledWith(1, 'a');
      expect(onChangeText).toHaveBeenNthCalledWith(2, 'ab');
    });

    test('displayValue updates immediately regardless of onEndEditing usage', async () => {
      const onEndEditing = jest.fn();
      const { getByTestId } = await render(
        <CustomTextInput {...baseProps} value='start' onEndEditing={onEndEditing} />
      );
      const input = getByTestId('custom-input::CustomTextInput');

      await fireEvent.changeText(input, 'typing...');

      expect(input.props.value).toBe('typing...');
      expect(onEndEditing).not.toHaveBeenCalled();
    });
  });
});
