import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import NumericTextInput, { NumericTextInputProps } from '@components/atomic/NumericTextInput';
import { TextInput } from 'react-native-paper';
import { defaultValueNumber } from '@utils/Constants';

const baseProps: NumericTextInputProps = {
  testID: 'numeric-input',
  value: 0,
};

describe('NumericTextInput', () => {
  test('renders with initial numeric value', () => {
    const { getByTestId } = render(<NumericTextInput {...baseProps} value={42.5} />);
    const input = getByTestId('numeric-input');
    expect(input.props.value).toEqual('42.5');
  });

  test('preserves partial decimal "2." while typing', () => {
    const { getByTestId } = render(<NumericTextInput {...baseProps} value={0} />);
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '2.');
    expect(input.props.value).toEqual('2.');
  });

  test('preserves full decimal "2.5" while typing', () => {
    const { getByTestId } = render(<NumericTextInput {...baseProps} value={0} />);
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '2.5');
    expect(input.props.value).toEqual('2.5');
  });

  test('parses "2." to 2 on blur', () => {
    const handleChangeValue = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={0} onChangeValue={handleChangeValue} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '2.');
    fireEvent(input, 'onBlur');

    expect(handleChangeValue).toHaveBeenCalledWith(2);
    expect(input.props.value).toEqual('2');
  });

  test('parses "2.5" to 2.5 on blur', () => {
    const handleChangeValue = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={0} onChangeValue={handleChangeValue} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '2.5');
    fireEvent(input, 'onBlur');

    expect(handleChangeValue).toHaveBeenCalledWith(2.5);
  });

  test('handles empty input by defaulting to defaultValueNumber', () => {
    const handleChangeValue = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={42} onChangeValue={handleChangeValue} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '');
    fireEvent(input, 'onBlur');

    expect(handleChangeValue).toHaveBeenCalledWith(defaultValueNumber);
    expect(input.props.value).toEqual('');
  });

  test('handles invalid input by defaulting to defaultValueNumber', () => {
    const handleChangeValue = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={5} onChangeValue={handleChangeValue} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, 'abc');
    fireEvent(input, 'onBlur');

    expect(handleChangeValue).toHaveBeenCalledWith(defaultValueNumber);
    expect(input.props.value).toEqual('');
  });

  test('does not call onChangeValue if value unchanged on blur', () => {
    const handleChangeValue = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={42} onChangeValue={handleChangeValue} />
    );
    const input = getByTestId('numeric-input');

    fireEvent(input, 'onBlur');

    expect(handleChangeValue).not.toHaveBeenCalled();
  });

  test('supports TextInput.Affix via right prop', () => {
    const { getByTestId, getByText } = render(
      <NumericTextInput {...baseProps} value={100} right={<TextInput.Affix text='g' />} />
    );

    const input = getByTestId('numeric-input');
    expect(input.props.right).toBeDefined();
    expect(getByText('g')).toBeTruthy();
  });

  test('supports dense mode', () => {
    const { getByTestId } = render(<NumericTextInput {...baseProps} dense />);
    const input = getByTestId('numeric-input');
    expect(input.props.dense).toBe(true);
  });

  test('supports label prop', () => {
    const { getByTestId } = render(<NumericTextInput {...baseProps} label='Weight' />);
    const input = getByTestId('numeric-input');
    expect(input.props.label).toEqual('Weight');
  });

  test('updates internal state when value prop changes', () => {
    const { getByTestId, rerender } = render(<NumericTextInput {...baseProps} value={10} />);
    const input = getByTestId('numeric-input');
    expect(input.props.value).toEqual('10');

    rerender(<NumericTextInput {...baseProps} value={20} />);
    expect(input.props.value).toEqual('20');
  });

  test('handles negative numbers correctly', () => {
    const handleChangeValue = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={0} onChangeValue={handleChangeValue} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '-5.5');
    fireEvent(input, 'onBlur');

    expect(handleChangeValue).toHaveBeenCalledWith(-5.5);
    expect(input.props.value).toEqual('-5.5');
  });

  test('uses numeric keyboard by default', () => {
    const { getByTestId } = render(<NumericTextInput {...baseProps} />);
    const input = getByTestId('numeric-input');
    expect(input.props.keyboardType).toEqual('numeric');
  });

  test('supports custom keyboard type', () => {
    const { getByTestId } = render(<NumericTextInput {...baseProps} keyboardType='decimal-pad' />);
    const input = getByTestId('numeric-input');
    expect(input.props.keyboardType).toEqual('decimal-pad');
  });

  test('respects editable prop', () => {
    const { getByTestId } = render(<NumericTextInput {...baseProps} editable={false} />);
    const input = getByTestId('numeric-input');
    expect(input.props.editable).toBe(false);
  });

  test('displays empty string when value is defaultValueNumber', () => {
    const { getByTestId } = render(<NumericTextInput {...baseProps} value={defaultValueNumber} />);
    const input = getByTestId('numeric-input');
    expect(input.props.value).toEqual('');
  });

  test('keeps defaultValueNumber when blurring empty field that started as defaultValueNumber', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={defaultValueNumber} onChangeValue={handleChange} />
    );
    const input = getByTestId('numeric-input');

    fireEvent(input, 'onBlur');
    expect(handleChange).not.toHaveBeenCalled();
  });

  test('converts to defaultValueNumber when blurring empty field that started with a real value', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={100} onChangeValue={handleChange} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '');
    fireEvent(input, 'onBlur');
    expect(handleChange).toHaveBeenCalledWith(defaultValueNumber);
  });

  test('allows changing from defaultValueNumber to a real value', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={defaultValueNumber} onChangeValue={handleChange} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '5');
    fireEvent(input, 'onBlur');
    expect(handleChange).toHaveBeenCalledWith(5);
  });

  test('handles invalid input from defaultValueNumber by staying at defaultValueNumber', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={defaultValueNumber} onChangeValue={handleChange} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, 'invalid');
    fireEvent(input, 'onBlur');
    expect(handleChange).not.toHaveBeenCalled();
  });

  describe('display formatting (2 decimal precision)', () => {
    test('rounds 4-decimal values to 2 decimals for display', () => {
      const { getByTestId } = render(<NumericTextInput {...baseProps} value={66.6667} />);
      const input = getByTestId('numeric-input');
      expect(input.props.value).toEqual('66.67');
    });

    test('rounds 133.3333 to 133.33 for display', () => {
      const { getByTestId } = render(<NumericTextInput {...baseProps} value={133.3333} />);
      const input = getByTestId('numeric-input');
      expect(input.props.value).toEqual('133.33');
    });

    test('rounds 133.3366 to 133.34 for display', () => {
      const { getByTestId } = render(<NumericTextInput {...baseProps} value={133.3366} />);
      const input = getByTestId('numeric-input');
      expect(input.props.value).toEqual('133.34');
    });

    test('preserves exact 2-decimal values', () => {
      const { getByTestId } = render(<NumericTextInput {...baseProps} value={42.75} />);
      const input = getByTestId('numeric-input');
      expect(input.props.value).toEqual('42.75');
    });

    test('handles integer values without adding decimals', () => {
      const { getByTestId } = render(<NumericTextInput {...baseProps} value={200} />);
      const input = getByTestId('numeric-input');
      expect(input.props.value).toEqual('200');
    });

    test('updates display when value prop changes to high-precision number', () => {
      const { getByTestId, rerender } = render(<NumericTextInput {...baseProps} value={100} />);
      const input = getByTestId('numeric-input');
      expect(input.props.value).toEqual('100');

      rerender(<NumericTextInput {...baseProps} value={66.6667} />);
      expect(input.props.value).toEqual('66.67');
    });
  });
});
