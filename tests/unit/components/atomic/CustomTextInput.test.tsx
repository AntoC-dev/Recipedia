import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import CustomTextInput, { CustomTextInputProps } from '@components/atomic/CustomTextInput';

// Helpers for props
const baseProps: CustomTextInputProps = {
  testID: 'custom-input',
  value: 'initial',
};

describe('CustomTextInput', () => {
  test('renders with label and value', () => {
    const { getByTestId, getAllByText } = render(
      <CustomTextInput {...baseProps} label='Email' value='test@example.com' />
    );
    const input = getByTestId('custom-input::CustomTextInput');
    expect(input.props.value).toEqual('test@example.com');
    // expect(input.props.label).toEqual('Email');
    expect(getAllByText('Email').length).toBeGreaterThan(0);
  });

  test('fires onChangeText when text changes', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(<CustomTextInput {...baseProps} onChangeText={handleChange} />);

    const input = getByTestId('custom-input::CustomTextInput');
    fireEvent.changeText(input, 'hello');
    expect(handleChange).toHaveBeenCalledWith('hello');
  });

  test('calls onFocus and onBlur at appropriate times', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId } = render(
      <CustomTextInput {...baseProps} onFocus={onFocus} onBlur={onBlur} />
    );
    const input = getByTestId('custom-input::CustomTextInput');

    fireEvent(input, 'onFocus');
    expect(onFocus).toHaveBeenCalled();
    fireEvent(input, 'onBlur');
    expect(onBlur).toHaveBeenCalled();
  });

  test('calls onEndEditing when editing ends', () => {
    const onEndEditing = jest.fn();
    const { getByTestId } = render(<CustomTextInput {...baseProps} onEndEditing={onEndEditing} />);
    const input = getByTestId('custom-input::CustomTextInput');

    fireEvent(input, 'onEndEditing');
    expect(onEndEditing).toHaveBeenCalled();
  });

  test('is not editable when prop editable is false', () => {
    const { getByTestId } = render(<CustomTextInput {...baseProps} editable={false} />);
    const input = getByTestId('custom-input::CustomTextInput');
    expect(input.props.editable).toBe(false);
  });

  test('passes multiline prop to the underlying input', () => {
    const { getByTestId } = render(<CustomTextInput {...baseProps} multiline value={'abc\ndef'} />);
    expect(getByTestId('custom-input::CustomTextInput').props.multiline).toBe(true);
  });

  test('is editable by default when editable prop is true', () => {
    const { getByTestId } = render(<CustomTextInput {...baseProps} editable />);
    const input = getByTestId('custom-input::CustomTextInput');

    expect(input.props.editable).toBe(true);
  });

  test('renders placeholder text on the input element', () => {
    const { getByTestId } = render(
      <CustomTextInput {...baseProps} placeholder='Enter a value...' />
    );
    expect(getByTestId('custom-input::CustomTextInput').props.placeholder).toBe('Enter a value...');
  });

  test('allows direct text input without any pre-interaction', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <CustomTextInput {...baseProps} onChangeText={handleChange} editable />
    );

    const input = getByTestId('custom-input::CustomTextInput');
    fireEvent.changeText(input, 'TestTag');
    expect(handleChange).toHaveBeenCalledWith('TestTag');
    expect(input.props.editable).toBe(true);
  });

  describe('displayValue cursor-fix behavior', () => {
    test('initialises displayed value from value prop', () => {
      const { getByTestId } = render(<CustomTextInput testID='custom-input' value='hello' />);
      expect(getByTestId('custom-input::CustomTextInput').props.value).toBe('hello');
    });

    test('renders empty string when value prop is undefined', () => {
      const { getByTestId } = render(<CustomTextInput testID='custom-input' />);
      expect(getByTestId('custom-input::CustomTextInput').props.value).toBe('');
    });

    test('updates displayed value immediately when user types', () => {
      const { getByTestId } = render(<CustomTextInput {...baseProps} value='test' />);
      const input = getByTestId('custom-input::CustomTextInput');

      fireEvent.changeText(input, 'NewTest');

      expect(input.props.value).toBe('NewTest');
    });

    test('retains typed text when parent re-renders with stale same value during validation', () => {
      const onChangeText = jest.fn();
      const { getByTestId, rerender } = render(
        <CustomTextInput {...baseProps} value='Italian' onChangeText={onChangeText} />
      );
      const input = getByTestId('custom-input::CustomTextInput');

      fireEvent.changeText(input, 'New Italian');
      rerender(<CustomTextInput {...baseProps} value='Italian' onChangeText={onChangeText} />);

      expect(input.props.value).toBe('New Italian');
      expect(onChangeText).toHaveBeenCalledWith('New Italian');
    });

    test('syncs displayed value when parent provides a new external value', () => {
      const { getByTestId, rerender } = render(<CustomTextInput {...baseProps} value='original' />);
      const input = getByTestId('custom-input::CustomTextInput');

      rerender(<CustomTextInput {...baseProps} value='updated' />);

      expect(input.props.value).toBe('updated');
    });

    test('syncs to empty string when parent clears value to undefined', () => {
      const { getByTestId, rerender } = render(<CustomTextInput {...baseProps} value='text' />);
      const input = getByTestId('custom-input::CustomTextInput');

      rerender(<CustomTextInput {...baseProps} value={undefined} />);

      expect(input.props.value).toBe('');
    });

    test('applies a subsequent external change after user has typed', () => {
      const { getByTestId, rerender } = render(<CustomTextInput {...baseProps} value='original' />);
      const input = getByTestId('custom-input::CustomTextInput');

      fireEvent.changeText(input, 'typed');
      rerender(<CustomTextInput {...baseProps} value='server-reset' />);

      expect(input.props.value).toBe('server-reset');
    });
  });
});
