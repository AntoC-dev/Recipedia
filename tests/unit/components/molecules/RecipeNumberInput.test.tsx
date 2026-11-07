import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { RecipeNumberInput, RecipeNumberInputProps } from '@components/molecules/RecipeNumberInput';
import { defaultValueNumber } from '@utils/Constants';

jest.mock('@components/atomic/NumericTextInput', () => ({
  NumericTextInput: require('@mocks/components/atomic/NumericTextInput-mock').numericTextInputMock,
}));

describe('RecipeNumberInput', () => {
  const testID = 'RecipePersons';
  const inputId = testID + '::NumericTextInput';
  const setTextToEdit = jest.fn();

  const renderInput = (props: Partial<RecipeNumberInputProps> = {}) =>
    render(
      <RecipeNumberInput
        testID={testID}
        textEditable={4}
        setTextToEdit={setTextToEdit}
        {...props}
      />
    );

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders a numeric keyboard input with the current value', async () => {
    const { getByTestId } = await renderInput();

    expect(getByTestId(inputId).props.value).toBe('4');
    expect(getByTestId(inputId).props.keyboardType).toBe('numeric');
  });

  test('does not force a width on the numeric input', async () => {
    const { getByTestId } = await renderInput();

    expect(getByTestId(inputId).props.style).toBeUndefined();
  });

  test('renders an empty input for the default value', async () => {
    const { getByTestId } = await renderInput({ textEditable: defaultValueNumber });

    expect(getByTestId(inputId).props.value).toBe('');
  });

  test('falls back to the default value when the number is undefined', async () => {
    const { getByTestId } = await renderInput({ textEditable: undefined as unknown as number });

    expect(getByTestId(inputId).props.value).toBe('');
  });

  test('forwards the parsed value on change', async () => {
    const { getByTestId } = await renderInput();

    await fireEvent.changeText(getByTestId(inputId), '6');

    expect(setTextToEdit).toHaveBeenCalledWith(6);
  });

  test('forwards the blur handler', async () => {
    const onBlur = jest.fn();
    const { getByTestId } = await renderInput({ onBlur });

    await fireEvent(getByTestId(inputId), 'blur');

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('renders the right adornment next to the input', async () => {
    const { getByTestId, getByText } = await renderInput({ right: <Text>adornment</Text> });

    expect(getByTestId(inputId + '::Right')).toContainElement(getByText('adornment'));
  });

  test('renders no right adornment by default', async () => {
    const { queryByTestId } = await renderInput();

    expect(queryByTestId(inputId + '::Right')).toBeNull();
  });
});
