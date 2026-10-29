import { fireEvent, render } from '@testing-library/react-native';
import { RecipeNumber, RecipeNumberProps } from '@components/organisms/RecipeNumber';
import React from 'react';
import { defaultValueNumber } from '@utils/Constants';

jest.mock('@components/atomic/RoundButton', () => ({
  RoundButton: require('@mocks/components/atomic/RoundButton-mock').roundButtonMock,
}));
jest.mock('@components/atomic/NumericTextInput', () => ({
  NumericTextInput: require('@mocks/components/atomic/NumericTextInput-mock').numericTextInputMock,
}));

describe('RecipeNumber Component', () => {
  const mockOpenModal = jest.fn();
  const mockManuallyFill = jest.fn();
  const mockSetTextToEdit = jest.fn();

  const defaultTestId = 'test-recipe-number';
  const defaultProps: RecipeNumberProps = {
    testID: defaultTestId,
    numberProps: {
      editType: 'read' as const,
      text: 'Preparation time: 25 minutes',
    },
  };

  const defaultEditProps: RecipeNumberProps = {
    testID: defaultTestId,
    numberProps: {
      testID: defaultTestId,
      editType: 'editable',
      prefixText: 'Serves',
      suffixText: 'people',
      textEditable: 4,
      setTextToEdit: mockSetTextToEdit,
    },
  };

  const defaultAddProps: RecipeNumberProps = {
    testID: defaultTestId,
    numberProps: {
      testID: defaultTestId,
      editType: 'add',
      prefixText: 'Cooking time:',
      suffixText: 'minutes',
      openModal: mockOpenModal,
      manuallyFill: mockManuallyFill,
    },
  };

  const renderRecipeNumber = async (props: RecipeNumberProps = defaultProps) => {
    return render(<RecipeNumber {...props} />);
  };

  const assertComponent = (
    getByTestId: any,
    queryByTestId: any,
    componentProps: RecipeNumberProps
  ) => {
    switch (componentProps.numberProps.editType) {
      case 'read':
        expect(getByTestId(componentProps.testID + '::Text').props.children).toBe(
          componentProps.numberProps.text
        );
        expect(queryByTestId(componentProps.testID + '::PrefixText')).toBeNull();
        expect(queryByTestId(componentProps.testID + '::SuffixText')).toBeNull();
        expect(queryByTestId(componentProps.testID + '::NumericTextInput')).toBeNull();
        expect(queryByTestId(componentProps.testID + '::OpenModal')).toBeNull();
        expect(queryByTestId(componentProps.testID + '::ManuallyFill')).toBeNull();
        break;
      case 'editable': {
        expect(getByTestId(componentProps.testID + '::PrefixText').props.children).toBe(
          componentProps.numberProps.prefixText
        );
        expect(getByTestId(componentProps.testID + '::SuffixText').props.children).toBe(
          componentProps.numberProps.suffixText
        );
        const expectedValue = componentProps.numberProps.textEditable ?? defaultValueNumber;
        expect(getByTestId(componentProps.testID + '::NumericTextInput').props.value).toEqual(
          expectedValue === defaultValueNumber ? '' : String(expectedValue)
        );
        expect(queryByTestId(componentProps.testID + '::OpenModal')).toBeNull();
        expect(queryByTestId(componentProps.testID + '::ManuallyFill')).toBeNull();
        break;
      }
      case 'add':
        expect(getByTestId(componentProps.testID + '::PrefixText').props.children).toBe(
          componentProps.numberProps.prefixText
        );
        expect(getByTestId(componentProps.testID + '::SuffixText').props.children).toBe(
          componentProps.numberProps.suffixText
        );
        expect(
          getByTestId(componentProps.testID + '::OpenModal::RoundButton::Icon').props.children
        ).toBe('line-scan');
        expect(
          getByTestId(componentProps.testID + '::OpenModal::RoundButton::Label').props.children
        ).toBe('recipe.roundButton.scan');
        expect(
          getByTestId(componentProps.testID + '::ManuallyFill::RoundButton::Icon').props.children
        ).toBe('pencil');
        expect(
          getByTestId(componentProps.testID + '::ManuallyFill::RoundButton::Label').props.children
        ).toBe('recipe.roundButton.addManually');
        expect(queryByTestId(componentProps.testID + '::NumericTextInput')).toBeNull();
        break;
    }
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders in read-only mode with correct text display', async () => {
    const { getByTestId, queryByTestId } = await renderRecipeNumber();
    assertComponent(getByTestId, queryByTestId, defaultProps);
  });

  test('renders in editable mode with text input and prefix/suffix', async () => {
    const { getByTestId, queryByTestId } = await renderRecipeNumber(defaultEditProps);

    assertComponent(getByTestId, queryByTestId, defaultEditProps);
  });

  test('handles text input changes in editable mode correctly', async () => {
    const inputChange = { ...defaultEditProps };
    const { getByTestId, queryByTestId } = await renderRecipeNumber(inputChange);

    assertComponent(getByTestId, queryByTestId, inputChange);

    const textInput = getByTestId('test-recipe-number::NumericTextInput');
    expect(mockSetTextToEdit).not.toHaveBeenCalled();

    let textNewValue = '8';

    await fireEvent.changeText(textInput, textNewValue);
    await fireEvent(textInput, 'onBlur');

    expect(mockSetTextToEdit).toHaveBeenCalledTimes(1);
    expect(mockSetTextToEdit).toHaveBeenCalledWith(Number(textNewValue));
    assertComponent(getByTestId, queryByTestId, inputChange);

    textNewValue = 'abc';

    await fireEvent.changeText(textInput, textNewValue);
    await fireEvent(textInput, 'onBlur');
    expect(mockSetTextToEdit).toHaveBeenCalledWith(defaultValueNumber);
    assertComponent(getByTestId, queryByTestId, inputChange);

    textNewValue = '2.5';

    await fireEvent.changeText(textInput, textNewValue);
    await fireEvent(textInput, 'onBlur');
    expect(mockSetTextToEdit).toHaveBeenCalledWith(Number(textNewValue));
    assertComponent(getByTestId, queryByTestId, inputChange);
  });

  test('handles default value correctly in editable mode', async () => {
    const props = {
      ...defaultEditProps,
      numberProps: { ...defaultEditProps.numberProps, textEditable: defaultValueNumber },
    };
    const { getByTestId, queryByTestId } = await renderRecipeNumber(props);

    assertComponent(getByTestId, queryByTestId, props);
  });

  test('renders in add mode with dual button options', async () => {
    const { getByTestId, queryByTestId } = await renderRecipeNumber(defaultAddProps);

    assertComponent(getByTestId, queryByTestId, defaultAddProps);
  });

  test('handles button presses in add mode correctly', async () => {
    const { getByTestId } = await renderRecipeNumber(defaultAddProps);

    expect(mockOpenModal).not.toHaveBeenCalled();
    expect(mockManuallyFill).not.toHaveBeenCalled();

    await fireEvent.press(
      getByTestId('test-recipe-number::OpenModal::RoundButton::OnPressFunction')
    );
    expect(mockOpenModal).toHaveBeenCalledTimes(1);
    expect(mockManuallyFill).not.toHaveBeenCalled();

    await fireEvent.press(
      getByTestId('test-recipe-number::ManuallyFill::RoundButton::OnPressFunction')
    );
    expect(mockManuallyFill).toHaveBeenCalledTimes(1);
    expect(mockOpenModal).toHaveBeenCalledTimes(1);
  });

  test('handles different prefix and suffix text combinations', async () => {
    const testCases = [
      { prefix: 'Cook for', suffix: 'hours' },
      { prefix: '', suffix: 'minutes' },
      { prefix: 'Prep time:', suffix: '' },
      { prefix: '', suffix: '' },
      { prefix: 'Very long prefix text here', suffix: 'very long suffix text here' },
    ];

    for (const { prefix, suffix } of testCases) {
      const props: RecipeNumberProps = {
        ...defaultProps,
        numberProps: {
          editType: 'editable',
          testID: defaultTestId,
          prefixText: prefix,
          suffixText: suffix,
          textEditable: 5,
          setTextToEdit: mockSetTextToEdit,
        },
      };
      const { getByTestId, queryByTestId, unmount } = await renderRecipeNumber(props);

      assertComponent(getByTestId, queryByTestId, props);
      await unmount();
    }
  });

  test('maintains state correctly across mode transitions', async () => {
    const maintainStateProps = { ...defaultEditProps };
    const { getByTestId, queryByTestId, rerender } = await renderRecipeNumber(maintainStateProps);
    assertComponent(getByTestId, queryByTestId, defaultEditProps);

    maintainStateProps.numberProps = {
      editType: 'add',
      testID: defaultTestId,
      prefixText: 'Cook for',
      suffixText: 'minutes',
      openModal: mockOpenModal,
      manuallyFill: mockManuallyFill,
    };
    await rerender(<RecipeNumber {...maintainStateProps} />);
    assertComponent(getByTestId, queryByTestId, maintainStateProps);

    maintainStateProps.numberProps = { editType: 'read', text: 'Final: 45 minutes' };
    await rerender(<RecipeNumber {...maintainStateProps} />);

    assertComponent(getByTestId, queryByTestId, maintainStateProps);
  });

  test('handles edge cases with numeric input validation', async () => {
    const { getByTestId } = await renderRecipeNumber(defaultEditProps);
    const textInput = getByTestId('test-recipe-number::NumericTextInput');

    const testCases = [
      { input: '0', expected: 0 },
      { input: '999', expected: 999 },
      { input: '-5', expected: -5 },
      { input: '3.14', expected: 3.14 },
      { input: '  5  ', expected: 5 },
    ];

    for (const [index, { input, expected }] of testCases.entries()) {
      await fireEvent.changeText(textInput, input);
      await fireEvent(textInput, 'onBlur');
      expect(mockSetTextToEdit).toHaveBeenNthCalledWith(index + 1, expected);
    }
  });

  test('uses different testID correctly for multiple instances', async () => {
    const customTestId = 'custom-recipe-number';
    const customProps: RecipeNumberProps = {
      testID: customTestId,
      numberProps: {
        editType: 'editable',
        testID: customTestId,
        prefixText: 'Custom',
        suffixText: 'units',
        textEditable: 10,
        setTextToEdit: mockSetTextToEdit,
      },
    };

    const { getByTestId, queryByTestId } = await renderRecipeNumber(customProps);

    assertComponent(getByTestId, queryByTestId, customProps);
  });

  test('handles rapid successive interactions without errors', async () => {
    const { getByTestId, queryByTestId } = await renderRecipeNumber(defaultAddProps);

    const openModalButton = getByTestId(
      'test-recipe-number::OpenModal::RoundButton::OnPressFunction'
    );
    const manualFillButton = getByTestId(
      'test-recipe-number::ManuallyFill::RoundButton::OnPressFunction'
    );

    await fireEvent.press(openModalButton);
    await fireEvent.press(manualFillButton);
    await fireEvent.press(openModalButton);
    await fireEvent.press(manualFillButton);
    await fireEvent.press(openModalButton);

    expect(mockOpenModal).toHaveBeenCalledTimes(3);
    expect(mockManuallyFill).toHaveBeenCalledTimes(2);
    assertComponent(getByTestId, queryByTestId, defaultAddProps);
  });

  test('preserves callback functionality across prop changes', async () => {
    const { getByTestId, rerender } = await renderRecipeNumber(defaultAddProps);

    await fireEvent.press(
      getByTestId('test-recipe-number::OpenModal::RoundButton::OnPressFunction')
    );
    expect(mockOpenModal).toHaveBeenCalledTimes(1);

    const newMockOpenModal = jest.fn();
    const newMockManuallyFill = jest.fn();

    await rerender(
      <RecipeNumber
        testID='test-recipe-number'
        numberProps={{
          editType: 'add',
          testID: 'test-recipe-number',
          prefixText: 'Updated time:',
          suffixText: 'hours',
          openModal: newMockOpenModal,
          manuallyFill: newMockManuallyFill,
        }}
      />
    );

    await fireEvent.press(
      getByTestId('test-recipe-number::OpenModal::RoundButton::OnPressFunction')
    );
    await fireEvent.press(
      getByTestId('test-recipe-number::ManuallyFill::RoundButton::OnPressFunction')
    );

    expect(newMockOpenModal).toHaveBeenCalledTimes(1);
    expect(newMockManuallyFill).toHaveBeenCalledTimes(1);
    expect(mockOpenModal).toHaveBeenCalledTimes(1);
    expect(mockManuallyFill).not.toHaveBeenCalled();
  });

  test('displays various text content correctly in read-only mode', async () => {
    const readOnlyTexts = [
      'Simple text',
      'Text with numbers: 123',
      'Special characters: @#$%^&*()',
      'Very long text that might cause display issues in the component',
      '',
      'Multiline\ntext\ncontent',
      'Text with emoji: 🍕👨‍🍳',
    ];

    for (const text of readOnlyTexts) {
      const readOnlyProps: RecipeNumberProps = {
        testID: defaultTestId,
        numberProps: { editType: 'read', text },
      };
      const { getByTestId, queryByTestId, unmount } = await renderRecipeNumber(readOnlyProps);

      assertComponent(getByTestId, queryByTestId, readOnlyProps);
      await unmount();
    }
  });

  test('maintains component stability during complex prop changes', async () => {
    const { getByTestId, queryByTestId, rerender } = await renderRecipeNumber(defaultEditProps);

    assertComponent(getByTestId, queryByTestId, defaultEditProps);

    const updatedProps = {
      ...defaultEditProps,
      numberProps: {
        ...defaultEditProps.numberProps,
        prefixText: 'New prefix',
        suffixText: 'new suffix',
        textEditable: 15,
      },
    };
    await rerender(<RecipeNumber {...updatedProps} />);

    assertComponent(getByTestId, queryByTestId, updatedProps);

    const textInput = getByTestId('test-recipe-number::NumericTextInput');
    await fireEvent.changeText(textInput, '20');
    await fireEvent(textInput, 'onBlur');
    expect(mockSetTextToEdit).toHaveBeenCalledWith(20);
  });

  describe('error display', () => {
    test('does not render error helper when error prop is absent', async () => {
      const { queryByTestId } = await renderRecipeNumber(defaultEditProps);
      expect(queryByTestId(defaultTestId + '::Error')).toBeNull();
    });

    test('renders error helper with the provided message in editable mode', async () => {
      const propsWithError: RecipeNumberProps = {
        ...defaultEditProps,
        error: 'Persons must be set',
      };
      const { getByTestId } = await renderRecipeNumber(propsWithError);
      const helper = getByTestId(defaultTestId + '::Error');
      expect(helper.props.children).toBe('Persons must be set');
      expect(helper.props.type).toBe('error');
    });

    test('renders error helper in read-only mode when provided', async () => {
      const propsWithError: RecipeNumberProps = {
        ...defaultProps,
        error: 'Should not normally appear here',
      };
      const { getByTestId } = await renderRecipeNumber(propsWithError);
      expect(getByTestId(defaultTestId + '::Error').props.children).toBe(
        'Should not normally appear here'
      );
    });

    test('renders error helper in add mode', async () => {
      const propsWithError: RecipeNumberProps = {
        ...defaultAddProps,
        error: 'Time is required',
      };
      const { getByTestId } = await renderRecipeNumber(propsWithError);
      expect(getByTestId(defaultTestId + '::Error').props.children).toBe('Time is required');
    });

    test('forwards onBlur to the underlying numeric input', async () => {
      const onBlur = jest.fn();
      const props: RecipeNumberProps = {
        testID: defaultTestId,
        numberProps: {
          testID: defaultTestId,
          editType: 'editable',
          prefixText: 'p',
          suffixText: 's',
          textEditable: 1,
          setTextToEdit: mockSetTextToEdit,
        },
        onBlur,
      };
      const { getByTestId } = await renderRecipeNumber(props);
      const input = getByTestId(defaultTestId + '::NumericTextInput');
      await fireEvent(input, 'onBlur');
      expect(onBlur).toHaveBeenCalled();
    });
  });
});
