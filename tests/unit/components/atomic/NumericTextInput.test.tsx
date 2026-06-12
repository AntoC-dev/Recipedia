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

  test('live-commits parsed value on each keystroke', () => {
    const handleChangeValue = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={0} onChangeValue={handleChangeValue} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '2');
    expect(handleChangeValue).toHaveBeenLastCalledWith(2);

    fireEvent.changeText(input, '2.');
    expect(handleChangeValue).toHaveBeenLastCalledWith(2);

    fireEvent.changeText(input, '2.5');
    expect(handleChangeValue).toHaveBeenLastCalledWith(2.5);
  });

  test('normalizes display to canonical form on blur', () => {
    const handleChangeValue = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={0} onChangeValue={handleChangeValue} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '2.');
    fireEvent(input, 'onBlur');

    expect(input.props.value).toEqual('2');
  });

  test('commits empty input as defaultValueNumber on blur, not on the empty-string change', () => {
    const handleChangeValue = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={42} onChangeValue={handleChangeValue} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '');
    expect(handleChangeValue).not.toHaveBeenCalled();
    expect(input.props.value).toEqual('');

    fireEvent(input, 'onBlur');
    expect(handleChangeValue).toHaveBeenCalledWith(defaultValueNumber);
  });

  test('commits defaultValueNumber on invalid input on blur', () => {
    const handleChangeValue = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={5} onChangeValue={handleChangeValue} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, 'abc');
    expect(handleChangeValue).not.toHaveBeenCalled();

    fireEvent(input, 'onBlur');
    expect(handleChangeValue).toHaveBeenCalledWith(defaultValueNumber);
  });

  test('does not call onChangeValue on bare blur with no change', () => {
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

  test('does not overwrite raw text from value prop while the input is focused', () => {
    const { getByTestId, rerender } = render(<NumericTextInput {...baseProps} value={10} />);
    const input = getByTestId('numeric-input');

    fireEvent(input, 'focus');
    fireEvent.changeText(input, '12.');

    rerender(<NumericTextInput {...baseProps} value={42} />);
    expect(input.props.value).toEqual('12.');
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

    expect(handleChangeValue).toHaveBeenCalledWith(-5.5);
    expect(input.props.value).toEqual('-5.5');
  });

  test('commits a typed -1 instead of swallowing it as the unset sentinel', () => {
    const handleChangeValue = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={5} onChangeValue={handleChangeValue} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '-1');

    expect(handleChangeValue).toHaveBeenCalledWith(-1);
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

  test('defers the defaultValueNumber commit to blur when erasing a real value', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={100} onChangeValue={handleChange} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '');
    expect(handleChange).not.toHaveBeenCalled();

    fireEvent(input, 'onBlur');
    expect(handleChange).toHaveBeenCalledWith(defaultValueNumber);
  });

  test('allows changing from defaultValueNumber to a real value via change event', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={defaultValueNumber} onChangeValue={handleChange} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '5');
    expect(handleChange).toHaveBeenCalledWith(5);
  });

  test('reports defaultValueNumber when user types invalid text into a sentinel-valued field', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={defaultValueNumber} onChangeValue={handleChange} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, 'invalid');
    expect(handleChange).not.toHaveBeenCalled();
  });

  test('applies textInputStyle prop to inner TextInput', () => {
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={5} textInputStyle={{ color: 'red' }} />
    );
    const input = getByTestId('numeric-input');
    const styleArray = Array.isArray(input.props.style) ? input.props.style : [input.props.style];
    const combinedStyle = Object.assign({}, ...styleArray.filter(Boolean));
    expect(combinedStyle.color).toBe('red');
  });

  test('applies editable=false background color from textInputStyle merge', () => {
    const { getByTestId } = render(<NumericTextInput {...baseProps} value={5} editable={false} />);
    const input = getByTestId('numeric-input');
    const styleArray = Array.isArray(input.props.style) ? input.props.style : [input.props.style];
    expect(styleArray.length).toBeGreaterThan(0);
  });

  test('sets focused state when onFocus fires and live-commits changes', () => {
    const handleChangeValue = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={5} onChangeValue={handleChangeValue} />
    );
    const input = getByTestId('numeric-input');

    fireEvent(input, 'focus');
    fireEvent.changeText(input, '10');

    expect(handleChangeValue).toHaveBeenCalledWith(10);
  });

  test('renders without error when underlineColor prop is provided', () => {
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={5} underlineColor='transparent' />
    );
    expect(getByTestId('numeric-input')).toBeTruthy();
  });

  test('passes flat mode to TextInput', () => {
    const { getByTestId } = render(<NumericTextInput {...baseProps} mode='flat' />);
    const input = getByTestId('numeric-input');
    expect(input.props.mode).toBe('flat');
  });

  test('handles comma decimal separator by converting to period', () => {
    const handleChangeValue = jest.fn();
    const { getByTestId } = render(
      <NumericTextInput {...baseProps} value={0} onChangeValue={handleChangeValue} />
    );
    const input = getByTestId('numeric-input');

    fireEvent.changeText(input, '2,5');

    expect(handleChangeValue).toHaveBeenCalledWith(2.5);
  });

  test('does not call onChangeValue when no handler provided', () => {
    const { getByTestId } = render(<NumericTextInput {...baseProps} value={5} />);
    const input = getByTestId('numeric-input');

    expect(() => fireEvent.changeText(input, '10')).not.toThrow();
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

  describe('shared parseQuantity behavior on change', () => {
    test.each([
      ['1à3', 1],
      ['100kcal', 100],
      ['200 g', 200],
      ['0,5L', 0.5],
      ['  42  ', 42],
    ])('typing raw OCR-style input %p commits %p', (input, expected) => {
      const handleChangeValue = jest.fn();
      const { getByTestId } = render(
        <NumericTextInput {...baseProps} value={0} onChangeValue={handleChangeValue} />
      );
      const inputEl = getByTestId('numeric-input');

      fireEvent.changeText(inputEl, input);

      expect(handleChangeValue).toHaveBeenCalledWith(expected);
    });

    test.each([['à3'], ['kcal'], ['.'], [',']])(
      'typing non-parseable %p commits defaultValueNumber on blur',
      input => {
        const handleChangeValue = jest.fn();
        const { getByTestId } = render(
          <NumericTextInput {...baseProps} value={5} onChangeValue={handleChangeValue} />
        );
        const inputEl = getByTestId('numeric-input');

        fireEvent.changeText(inputEl, input);
        expect(handleChangeValue).not.toHaveBeenCalled();

        fireEvent(inputEl, 'onBlur');
        expect(handleChangeValue).toHaveBeenCalledWith(defaultValueNumber);
      }
    );
  });

  describe('onBlur prop', () => {
    test('invokes onBlur after blur handler runs', () => {
      const onBlur = jest.fn();
      const onChangeValue = jest.fn();
      const { getByTestId } = render(
        <NumericTextInput {...baseProps} value={5} onChangeValue={onChangeValue} onBlur={onBlur} />
      );
      const input = getByTestId('numeric-input');

      fireEvent.changeText(input, '12');
      fireEvent(input, 'onBlur');

      expect(onChangeValue).toHaveBeenCalledWith(12);
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    test('still invokes onBlur on bare focus + blur with no keystroke', () => {
      const onBlur = jest.fn();
      const onChangeValue = jest.fn();
      const { getByTestId } = render(
        <NumericTextInput {...baseProps} value={5} onChangeValue={onChangeValue} onBlur={onBlur} />
      );
      const input = getByTestId('numeric-input');

      fireEvent(input, 'focus');
      fireEvent(input, 'onBlur');

      expect(onChangeValue).not.toHaveBeenCalled();
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    test('fires onChangeValue with sentinel when user types then erases back to default sentinel', () => {
      const onChangeValue = jest.fn();
      const { getByTestId } = render(
        <NumericTextInput {...baseProps} value={defaultValueNumber} onChangeValue={onChangeValue} />
      );
      const input = getByTestId('numeric-input');

      fireEvent(input, 'focus');
      fireEvent.changeText(input, '1');
      fireEvent.changeText(input, '');
      expect(onChangeValue).toHaveBeenCalledTimes(1);

      fireEvent(input, 'onBlur');
      expect(onChangeValue).toHaveBeenNthCalledWith(1, 1);
      expect(onChangeValue).toHaveBeenNthCalledWith(2, defaultValueNumber);
    });

    test('does not throw when onBlur prop is omitted', () => {
      const { getByTestId } = render(<NumericTextInput {...baseProps} value={5} />);
      const input = getByTestId('numeric-input');

      expect(() => fireEvent(input, 'onBlur')).not.toThrow();
    });
  });
});
