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

  const renderRecipeNumber = (props: RecipeNumberProps = defaultProps) => {
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
          getByTestId(componentProps.testID + '::OpenModal::RoundButton::Size').props.children
        ).toBe('medium');
        expect(
          getByTestId(componentProps.testID + '::OpenModal::RoundButton::Icon').props.children
        ).toBe('line-scan');
        expect(
          getByTestId(componentProps.testID + '::ManuallyFill::RoundButton::Size').props.children
        ).toBe('medium');
        expect(
          getByTestId(componentProps.testID + '::ManuallyFill::RoundButton::Icon').props.children
        ).toBe('pencil');
        expect(queryByTestId(componentProps.testID + '::NumericTextInput')).toBeNull();
        break;
    }
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders in read-only mode with correct text display', () => {
    const { getByTestId, queryByTestId } = renderRecipeNumber();
    assertComponent(getByTestId, queryByTestId, defaultProps);
  });

  test('renders in editable mode with text input and prefix/suffix', () => {
    const { getByTestId, queryByTestId } = renderRecipeNumber(defaultEditProps);

    assertComponent(getByTestId, queryByTestId, defaultEditProps);
  });

  test('handles text input changes in editable mode correctly', () => {
    const inputChange = { ...defaultEditProps };
    const { getByTestId, queryByTestId } = renderRecipeNumber(inputChange);

    assertComponent(getByTestId, queryByTestId, inputChange);

    const textInput = getByTestId('test-recipe-number::NumericTextInput');
    expect(mockSetTextToEdit).not.toHaveBeenCalled();

    let textNewValue = '8';

    fireEvent.changeText(textInput, textNewValue);
    fireEvent(textInput, 'onBlur');

    expect(mockSetTextToEdit).toHaveBeenCalledTimes(1);
    expect(mockSetTextToEdit).toHaveBeenCalledWith(Number(textNewValue));
    assertComponent(getByTestId, queryByTestId, inputChange);

    textNewValue = 'abc';

    fireEvent.changeText(textInput, textNewValue);
    fireEvent(textInput, 'onBlur');
    expect(mockSetTextToEdit).toHaveBeenCalledWith(defaultValueNumber);
    assertComponent(getByTestId, queryByTestId, inputChange);

    textNewValue = '2.5';

    fireEvent.changeText(textInput, textNewValue);
    fireEvent(textInput, 'onBlur');
    expect(mockSetTextToEdit).toHaveBeenCalledWith(Number(textNewValue));
    assertComponent(getByTestId, queryByTestId, inputChange);
  });

  test('handles default value correctly in editable mode', () => {
    const props = {
      ...defaultEditProps,
      numberProps: { ...defaultEditProps.numberProps, textEditable: defaultValueNumber },
    };
    const { getByTestId, queryByTestId } = renderRecipeNumber(props);

    assertComponent(getByTestId, queryByTestId, props);
  });

  test('renders in add mode with dual button options', () => {
    const { getByTestId, queryByTestId } = renderRecipeNumber(defaultAddProps);

    assertComponent(getByTestId, queryByTestId, defaultAddProps);
  });

  test('handles button presses in add mode correctly', () => {
    const { getByTestId } = renderRecipeNumber(defaultAddProps);

    expect(mockOpenModal).not.toHaveBeenCalled();
    expect(mockManuallyFill).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('test-recipe-number::OpenModal::RoundButton::OnPressFunction'));
    expect(mockOpenModal).toHaveBeenCalledTimes(1);
    expect(mockManuallyFill).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('test-recipe-number::ManuallyFill::RoundButton::OnPressFunction'));
    expect(mockManuallyFill).toHaveBeenCalledTimes(1);
    expect(mockOpenModal).toHaveBeenCalledTimes(1);
  });

  test('handles different prefix and suffix text combinations', () => {
    const testCases = [
      { prefix: 'Cook for', suffix: 'hours' },
      { prefix: '', suffix: 'minutes' },
      { prefix: 'Prep time:', suffix: '' },
      { prefix: '', suffix: '' },
      { prefix: 'Very long prefix text here', suffix: 'very long suffix text here' },
    ];

    testCases.forEach(({ prefix, suffix }) => {
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
      const { getByTestId, queryByTestId, unmount } = renderRecipeNumber(props);

      assertComponent(getByTestId, queryByTestId, props);
      unmount();
    });
  });

  test('maintains state correctly across mode transitions', () => {
    const maintainStateProps = { ...defaultEditProps };
    const { getByTestId, queryByTestId, rerender } = renderRecipeNumber(maintainStateProps);
    assertComponent(getByTestId, queryByTestId, defaultEditProps);

    maintainStateProps.numberProps = {
      editType: 'add',
      testID: defaultTestId,
      prefixText: 'Cook for',
      suffixText: 'minutes',
      openModal: mockOpenModal,
      manuallyFill: mockManuallyFill,
    };
    rerender(<RecipeNumber {...maintainStateProps} />);
    assertComponent(getByTestId, queryByTestId, maintainStateProps);

    maintainStateProps.numberProps = { editType: 'read', text: 'Final: 45 minutes' };
    rerender(<RecipeNumber {...maintainStateProps} />);

    assertComponent(getByTestId, queryByTestId, maintainStateProps);
  });

  test('handles edge cases with numeric input validation', () => {
    const { getByTestId } = renderRecipeNumber(defaultEditProps);
    const textInput = getByTestId('test-recipe-number::NumericTextInput');

    const testCases = [
      { input: '0', expected: 0 },
      { input: '999', expected: 999 },
      { input: '-5', expected: -5 },
      { input: '3.14', expected: 3.14 },
      { input: '  5  ', expected: 5 },
    ];

    testCases.forEach(({ input, expected }, index) => {
      fireEvent.changeText(textInput, input);
      fireEvent(textInput, 'onBlur');
      expect(mockSetTextToEdit).toHaveBeenNthCalledWith(index + 1, expected);
    });
  });

  test('uses different testID correctly for multiple instances', () => {
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

    const { getByTestId, queryByTestId } = renderRecipeNumber(customProps);

    assertComponent(getByTestId, queryByTestId, customProps);
  });

  test('handles rapid successive interactions without errors', () => {
    const { getByTestId, queryByTestId } = renderRecipeNumber(defaultAddProps);

    const openModalButton = getByTestId(
      'test-recipe-number::OpenModal::RoundButton::OnPressFunction'
    );
    const manualFillButton = getByTestId(
      'test-recipe-number::ManuallyFill::RoundButton::OnPressFunction'
    );

    fireEvent.press(openModalButton);
    fireEvent.press(manualFillButton);
    fireEvent.press(openModalButton);
    fireEvent.press(manualFillButton);
    fireEvent.press(openModalButton);

    expect(mockOpenModal).toHaveBeenCalledTimes(3);
    expect(mockManuallyFill).toHaveBeenCalledTimes(2);
    assertComponent(getByTestId, queryByTestId, defaultAddProps);
  });

  test('preserves callback functionality across prop changes', () => {
    const { getByTestId, rerender } = renderRecipeNumber(defaultAddProps);

    fireEvent.press(getByTestId('test-recipe-number::OpenModal::RoundButton::OnPressFunction'));
    expect(mockOpenModal).toHaveBeenCalledTimes(1);

    const newMockOpenModal = jest.fn();
    const newMockManuallyFill = jest.fn();

    rerender(
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

    fireEvent.press(getByTestId('test-recipe-number::OpenModal::RoundButton::OnPressFunction'));
    fireEvent.press(getByTestId('test-recipe-number::ManuallyFill::RoundButton::OnPressFunction'));

    expect(newMockOpenModal).toHaveBeenCalledTimes(1);
    expect(newMockManuallyFill).toHaveBeenCalledTimes(1);
    expect(mockOpenModal).toHaveBeenCalledTimes(1);
    expect(mockManuallyFill).not.toHaveBeenCalled();
  });

  test('displays various text content correctly in read-only mode', () => {
    const readOnlyTexts = [
      'Simple text',
      'Text with numbers: 123',
      'Special characters: @#$%^&*()',
      'Very long text that might cause display issues in the component',
      '',
      'Multiline\ntext\ncontent',
      'Text with emoji: 🍕👨‍🍳',
    ];

    readOnlyTexts.forEach(text => {
      const readOnlyProps: RecipeNumberProps = {
        testID: defaultTestId,
        numberProps: { editType: 'read', text },
      };
      const { getByTestId, queryByTestId, unmount } = renderRecipeNumber(readOnlyProps);

      assertComponent(getByTestId, queryByTestId, readOnlyProps);
      unmount();
    });
  });

  test('maintains component stability during complex prop changes', () => {
    const { getByTestId, queryByTestId, rerender } = renderRecipeNumber(defaultEditProps);

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
    rerender(<RecipeNumber {...updatedProps} />);

    assertComponent(getByTestId, queryByTestId, updatedProps);

    const textInput = getByTestId('test-recipe-number::NumericTextInput');
    fireEvent.changeText(textInput, '20');
    fireEvent(textInput, 'onBlur');
    expect(mockSetTextToEdit).toHaveBeenCalledWith(20);
  });

  describe('error display', () => {
    test('does not render error helper when error prop is absent', () => {
      const { queryByTestId } = renderRecipeNumber(defaultEditProps);
      expect(queryByTestId(defaultTestId + '::Error')).toBeNull();
    });

    test('renders error helper with the provided message in editable mode', () => {
      const propsWithError: RecipeNumberProps = {
        ...defaultEditProps,
        error: 'Persons must be set',
      };
      const { getByTestId } = renderRecipeNumber(propsWithError);
      const helper = getByTestId(defaultTestId + '::Error');
      expect(helper.props.children).toBe('Persons must be set');
      expect(helper.props.type).toBe('error');
    });

    test('renders error helper in read-only mode when provided', () => {
      const propsWithError: RecipeNumberProps = {
        ...defaultProps,
        error: 'Should not normally appear here',
      };
      const { getByTestId } = renderRecipeNumber(propsWithError);
      expect(getByTestId(defaultTestId + '::Error').props.children).toBe(
        'Should not normally appear here'
      );
    });

    test('renders error helper in add mode', () => {
      const propsWithError: RecipeNumberProps = {
        ...defaultAddProps,
        error: 'Time is required',
      };
      const { getByTestId } = renderRecipeNumber(propsWithError);
      expect(getByTestId(defaultTestId + '::Error').props.children).toBe('Time is required');
    });

    test('forwards onBlur to the underlying numeric input', () => {
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
      const { getByTestId } = renderRecipeNumber(props);
      const input = getByTestId(defaultTestId + '::NumericTextInput');
      fireEvent(input, 'onBlur');
      expect(onBlur).toHaveBeenCalled();
    });
  });
});
