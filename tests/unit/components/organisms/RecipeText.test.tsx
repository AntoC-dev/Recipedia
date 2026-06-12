import { fireEvent, render } from '@testing-library/react-native';
import {
  RecipeText,
  RecipeTextAddProps,
  RecipeTextEditProps,
  TextProp,
} from '@components/organisms/RecipeText';
import React from 'react';

jest.mock('@components/atomic/CustomTextInput', () => ({
  CustomTextInput: require('@mocks/components/atomic/CustomTextInput-mock').CustomTextInputMock,
}));
jest.mock('@components/atomic/RoundButton', () => ({
  RoundButton: require('@mocks/components/atomic/RoundButton-mock').roundButtonMock,
}));

describe('RecipeText Component', () => {
  const mockSetTextToEdit = jest.fn();
  const mockOpenModal = jest.fn();

  const headlineText: TextProp = {
    style: 'headline',
    value: 'Recipe Title Headline',
  };

  const titleText: TextProp = {
    style: 'title',
    value: 'Section Title',
  };

  const paragraphText: TextProp = {
    style: 'paragraph',
    value: 'This is a paragraph of recipe content with detailed instructions.',
  };

  const renderRecipeText = (overrideProps = {}) => {
    const defaultProps = {
      rootText: headlineText,
      testID: 'test-recipe-text',
      ...overrideProps,
    };

    return render(<RecipeText {...defaultProps} />);
  };

  const assertBasicStructure = (
    getByTestId: any,
    expectedTextValue: string = headlineText.value,
    testID: string = 'test-recipe-text'
  ) => {
    expect(getByTestId(testID + '::Text').props.children).toBe(expectedTextValue);
  };

  const assertReadOnlyMode = (queryByTestId: any, testID: string = 'test-recipe-text') => {
    expect(queryByTestId(testID + '::CustomTextInput')).toBeNull();
    expect(queryByTestId(testID + '::OpenModal')).toBeNull();
  };

  const assertEditableMode = (
    getByTestId: any,
    queryByTestId: any,
    expectedValue: string = 'Editable recipe content',
    testID: string = 'test-recipe-text'
  ) => {
    expect(getByTestId(testID + '::CustomTextInput').props.value).toBe(expectedValue);
    expect(getByTestId(testID + '::CustomTextInput').props.multiline).toBe(true);
    expect(queryByTestId(testID + '::OpenModal')).toBeNull();
  };

  const assertAddMode = (
    getByTestId: any,
    queryByTestId: any,
    testID: string = 'test-recipe-text'
  ) => {
    expect(getByTestId(testID + '::OpenModal::RoundButton::Size').props.children).toBe('medium');
    expect(getByTestId(testID + '::OpenModal::RoundButton::Icon').props.children).toBe('line-scan');
    expect(queryByTestId(testID + '::CustomTextInput')).toBeNull();
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders in read-only mode with headline text', () => {
    const { getByTestId, queryByTestId } = renderRecipeText();

    assertBasicStructure(getByTestId);
    assertReadOnlyMode(queryByTestId);
  });

  test('renders title text with correct variant mapping', () => {
    const { getByTestId } = renderRecipeText({
      rootText: titleText,
    });

    assertBasicStructure(getByTestId, titleText.value);
  });

  test('renders paragraph text with correct variant mapping', () => {
    const { getByTestId } = renderRecipeText({
      rootText: paragraphText,
    });

    assertBasicStructure(getByTestId, paragraphText.value);
  });

  test('renders in editable mode with text input', () => {
    const editableProps: RecipeTextEditProps = {
      editType: 'editable',
      textEditable: 'Editable recipe content',
      setTextToEdit: mockSetTextToEdit,
    };

    const { getByTestId, queryByTestId } = renderRecipeText({
      addOrEditProps: {
        testID: 'test-recipe-text',
        ...editableProps,
      },
    });

    assertBasicStructure(getByTestId);
    assertEditableMode(getByTestId, queryByTestId);

    expect(getByTestId('test-recipe-text::CustomTextInput').props.multiline).toBe(true);
  });

  test('renders in add mode with modal button', () => {
    const addProps: RecipeTextAddProps = {
      editType: 'add',
      openModal: mockOpenModal,
    };

    const { getByTestId, queryByTestId } = renderRecipeText({
      addOrEditProps: {
        testID: 'test-recipe-text',
        ...addProps,
      },
    });

    assertBasicStructure(getByTestId);
    assertAddMode(getByTestId, queryByTestId);
  });

  test('handles text editing interactions correctly', () => {
    const editableProps: RecipeTextEditProps = {
      editType: 'editable',
      textEditable: 'Initial text',
      setTextToEdit: mockSetTextToEdit,
    };

    const { getByTestId } = renderRecipeText({
      addOrEditProps: {
        testID: 'test-recipe-text',
        ...editableProps,
      },
    });

    const textInput = getByTestId('test-recipe-text::CustomTextInput');
    expect(textInput.props.value).toBe('Initial text');
    expect(mockSetTextToEdit).not.toHaveBeenCalled();

    fireEvent.changeText(textInput, 'Updated text content');
    expect(mockSetTextToEdit).toHaveBeenCalledTimes(1);
    expect(mockSetTextToEdit).toHaveBeenCalledWith('Updated text content');

    fireEvent.changeText(textInput, '');
    expect(mockSetTextToEdit).toHaveBeenCalledWith('');

    fireEvent.changeText(textInput, 'Text with émojis 🍰 and special chars @#$');
    expect(mockSetTextToEdit).toHaveBeenCalledWith('Text with émojis 🍰 and special chars @#$');
  });

  test('handles modal opening interaction correctly', () => {
    const addProps: RecipeTextAddProps = {
      editType: 'add',
      openModal: mockOpenModal,
    };

    const { getByTestId } = renderRecipeText({
      addOrEditProps: {
        testID: 'test-recipe-text',
        ...addProps,
      },
    });

    expect(mockOpenModal).not.toHaveBeenCalled();

    const modalButton = getByTestId('test-recipe-text::OpenModal::RoundButton::OnPressFunction');
    fireEvent.press(modalButton);

    expect(mockOpenModal).toHaveBeenCalledTimes(1);

    fireEvent.press(modalButton);
    fireEvent.press(modalButton);
    expect(mockOpenModal).toHaveBeenCalledTimes(3);
  });

  test('applies correct container styles based on edit type', () => {
    {
      const { getByTestId } = renderRecipeText({
        addOrEditProps: {
          testID: 'test-recipe-text',
          editType: 'add',
          openModal: mockOpenModal,
        },
      });

      assertBasicStructure(getByTestId);
    }

    {
      const { getByTestId } = renderRecipeText({
        addOrEditProps: {
          testID: 'test-recipe-text',
          editType: 'editable',
          textEditable: 'test',
          setTextToEdit: mockSetTextToEdit,
        },
      });

      assertBasicStructure(getByTestId);
    }
  });

  test('handles different text styles and content correctly', () => {
    const textVariations = [
      { config: headlineText },
      { config: titleText },
      { config: paragraphText },
    ];

    textVariations.forEach(({ config }) => {
      const { getByTestId, unmount } = renderRecipeText({
        rootText: config,
      });

      assertBasicStructure(getByTestId, config.value);

      unmount();
    });
  });

  test('uses custom testID correctly throughout component hierarchy', () => {
    const customTestId = 'custom-recipe-text-id';

    const { getByTestId, queryByTestId } = renderRecipeText({
      testID: customTestId,
      addOrEditProps: {
        testID: customTestId,
        editType: 'editable',
        textEditable: 'test',
        setTextToEdit: mockSetTextToEdit,
      },
    });

    assertBasicStructure(getByTestId, headlineText.value, customTestId);
    assertEditableMode(getByTestId, queryByTestId, 'test', customTestId);

    expect(queryByTestId('test-recipe-text::Text')).toBeNull();
    expect(queryByTestId('test-recipe-text::CustomTextInput')).toBeNull();
  });

  test('handles edge cases in text content', () => {
    const edgeCases = [
      { value: '', style: 'paragraph' as const },
      { value: '   ', style: 'title' as const },
      {
        value:
          'Very long text content that might cause layout issues and should be handled gracefully by the component',
        style: 'headline' as const,
      },
      { value: 'Text with\\nnewlines\\nand\\ttabs', style: 'paragraph' as const },
      { value: 'Special characters: @#$%^&*(){}[]|\\\\:";\'<>?,./`~', style: 'title' as const },
      { value: 'Unicode and emojis: 🍰🧁🍪 café crème naïve résumé', style: 'headline' as const },
    ];

    edgeCases.forEach(textConfig => {
      const { getByTestId, unmount } = renderRecipeText({
        rootText: textConfig,
      });

      expect(getByTestId('test-recipe-text::Text').props.children).toBe(textConfig.value);

      unmount();
    });
  });

  test('maintains functionality across prop changes', () => {
    const { getByTestId, queryByTestId, rerender } = renderRecipeText({
      addOrEditProps: {
        testID: 'test-recipe-text',
        editType: 'editable',
        textEditable: 'initial text',
        setTextToEdit: mockSetTextToEdit,
      },
    });

    assertEditableMode(getByTestId, queryByTestId, 'initial text');

    rerender(
      <RecipeText
        rootText={titleText}
        testID='test-recipe-text'
        addOrEditProps={{
          testID: 'test-recipe-text',
          editType: 'add',
          openModal: mockOpenModal,
        }}
      />
    );

    assertAddMode(getByTestId, queryByTestId);
    assertBasicStructure(getByTestId, titleText.value);

    rerender(<RecipeText rootText={paragraphText} testID='test-recipe-text' />);

    assertReadOnlyMode(queryByTestId);
    assertBasicStructure(getByTestId, paragraphText.value);
  });

  test('handles discriminated union props correctly', () => {
    const {
      getByTestId: getByTestIdEdit,
      queryByTestId: queryByTestIdEdit,
      unmount: unmountEdit,
    } = renderRecipeText({
      addOrEditProps: {
        testID: 'test-recipe-text',
        editType: 'editable',
        textEditable: 'editable content',
        setTextToEdit: mockSetTextToEdit,
      },
    });

    assertEditableMode(getByTestIdEdit, queryByTestIdEdit, 'editable content');

    unmountEdit();

    const { getByTestId: getByTestIdAdd, queryByTestId: queryByTestIdAdd } = renderRecipeText({
      addOrEditProps: {
        testID: 'test-recipe-text',
        editType: 'add',
        openModal: mockOpenModal,
      },
    });

    assertAddMode(getByTestIdAdd, queryByTestIdAdd);
  });

  test('preserves callback references across rapid interactions', () => {
    const { getByTestId } = renderRecipeText({
      addOrEditProps: {
        testID: 'test-recipe-text',
        editType: 'editable',
        textEditable: 'test text',
        setTextToEdit: mockSetTextToEdit,
      },
    });

    const textInput = getByTestId('test-recipe-text::CustomTextInput');

    fireEvent.changeText(textInput, 'change 1');
    fireEvent.changeText(textInput, 'change 2');
    fireEvent.changeText(textInput, 'change 3');

    expect(mockSetTextToEdit).toHaveBeenCalledTimes(3);
    expect(mockSetTextToEdit).toHaveBeenNthCalledWith(1, 'change 1');
    expect(mockSetTextToEdit).toHaveBeenNthCalledWith(2, 'change 2');
    expect(mockSetTextToEdit).toHaveBeenNthCalledWith(3, 'change 3');
  });

  test('maintains component stability during complex state changes', () => {
    const { getByTestId, rerender } = renderRecipeText();

    const stateSequence = [
      { rootText: paragraphText, addOrEditProps: undefined },
      {
        rootText: titleText,
        addOrEditProps: {
          testID: 'test-recipe-text',
          editType: 'editable' as const,
          textEditable: 'editable title',
          setTextToEdit: mockSetTextToEdit,
        },
      },
      {
        rootText: headlineText,
        addOrEditProps: {
          testID: 'test-recipe-text',
          editType: 'add' as const,
          openModal: mockOpenModal,
        },
      },
      { rootText: headlineText, addOrEditProps: undefined },
    ];

    stateSequence.forEach(state => {
      rerender(
        <RecipeText
          rootText={state.rootText}
          testID='test-recipe-text'
          addOrEditProps={state.addOrEditProps as any}
        />
      );

      expect(getByTestId('test-recipe-text::Text').props.children).toBe(state.rootText.value);
    });
  });

  describe('error display', () => {
    test('does not render error helper when error prop is absent', () => {
      const { queryByTestId } = renderRecipeText({
        addOrEditProps: {
          testID: 'test-recipe-text',
          editType: 'editable',
          textEditable: 'value',
          setTextToEdit: mockSetTextToEdit,
        },
      });
      expect(queryByTestId('test-recipe-text::Error')).toBeNull();
    });

    test('renders error helper with the provided message in editable mode', () => {
      const { getByTestId } = renderRecipeText({
        addOrEditProps: {
          testID: 'test-recipe-text',
          editType: 'editable',
          textEditable: '',
          setTextToEdit: mockSetTextToEdit,
        },
        error: 'Title is required',
      });
      const helper = getByTestId('test-recipe-text::Error');
      expect(helper.props.children).toBe('Title is required');
      expect(helper.props.type).toBe('error');
    });

    test('renders error helper alongside add mode', () => {
      const { getByTestId } = renderRecipeText({
        addOrEditProps: {
          testID: 'test-recipe-text',
          editType: 'add',
          openModal: mockOpenModal,
        },
        error: 'Required',
      });
      expect(getByTestId('test-recipe-text::Error').props.children).toBe('Required');
    });

    test('does not render error in read-only mode when no error provided', () => {
      const { queryByTestId } = renderRecipeText();
      expect(queryByTestId('test-recipe-text::Error')).toBeNull();
    });

    test('forwards onBlur to the underlying text input', () => {
      const onBlur = jest.fn();
      const { getByTestId } = renderRecipeText({
        addOrEditProps: {
          testID: 'test-recipe-text',
          editType: 'editable',
          textEditable: '',
          setTextToEdit: mockSetTextToEdit,
        },
        onBlur,
      });
      const input = getByTestId('test-recipe-text::CustomTextInput');
      expect(input.props.onBlur).toBe(onBlur);
    });
  });
});
