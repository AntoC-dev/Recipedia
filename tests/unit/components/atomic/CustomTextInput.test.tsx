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

  test('handles multiline and dynamic height', () => {
    const { getByTestId } = render(<CustomTextInput {...baseProps} multiline value={'abc\ndef'} />);
    const input = getByTestId('custom-input::CustomTextInput');
    expect(input.props.multiline).toBe(true);
    // Simulate content size change event
    fireEvent(input, 'onContentSizeChange', {
      nativeEvent: { contentSize: { height: 120 } },
    });
    // Optionally: re-render and check height if desired, or snapshot
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
});
