import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { RecipeTextInput, RecipeTextInputProps } from '@components/molecules/RecipeTextInput';
import { recipeTextStyles } from '@styles/recipeComponents';

jest.mock('@components/atomic/CustomTextInput', () => ({
  CustomTextInput: require('@mocks/components/atomic/CustomTextInput-mock').CustomTextInputMock,
}));

describe('RecipeTextInput', () => {
  const testID = 'RecipeTitle';
  const inputId = testID + '::CustomTextInput';
  const setTextToEdit = jest.fn();

  const renderInput = (props: Partial<RecipeTextInputProps> = {}) =>
    render(
      <RecipeTextInput
        testID={testID}
        textEditable='Initial text'
        setTextToEdit={setTextToEdit}
        {...props}
      />
    );

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders a multiline input with the current text', async () => {
    const { getByTestId } = await renderInput();

    expect(getByTestId(inputId).props.value).toBe('Initial text');
    expect(getByTestId(inputId).props.multiline).toBe(true);
  });

  test('applies the recipe text element style', async () => {
    const { getByTestId } = await renderInput();

    expect(getByTestId(inputId)).toHaveStyle(recipeTextStyles.containerElement);
  });

  test('renders an empty value when the text is undefined', async () => {
    const { getByTestId } = await renderInput({ textEditable: undefined as unknown as string });

    expect(getByTestId(inputId).props.value).toBe('');
  });

  test('commits every keystroke', async () => {
    const { getByTestId } = await renderInput();

    await fireEvent.changeText(getByTestId(inputId), 'Updated');

    expect(setTextToEdit).toHaveBeenCalledTimes(1);
    expect(setTextToEdit).toHaveBeenCalledWith('Updated');
  });

  test('commits when editing ends', async () => {
    const { getByTestId } = await renderInput();

    await fireEvent(getByTestId(inputId), 'endEditing', { nativeEvent: { text: 'Final' } });

    expect(setTextToEdit).toHaveBeenCalledWith('Final');
  });

  test('forwards the blur handler', async () => {
    const onBlur = jest.fn();
    const { getByTestId } = await renderInput({ onBlur });

    await fireEvent(getByTestId(inputId), 'blur');

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('renders the right adornment next to the input', async () => {
    const { getByTestId, getByText } = await renderInput({ right: <Text>adornment</Text> });

    expect(getByTestId(testID + '::Right')).toContainElement(getByText('adornment'));
  });

  test('renders no right adornment by default', async () => {
    const { queryByTestId } = await renderInput();

    expect(queryByTestId(testID + '::Right')).toBeNull();
  });
});
