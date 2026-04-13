import { fireEvent, render, waitFor } from '@testing-library/react-native';
import RecipePreparation, { RecipePreparationProps } from '@components/organisms/RecipePreparation';
import React from 'react';
import { preparationStepElement } from '@customTypes/DatabaseElementTypes';

jest.mock('@expo/vector-icons', () => require('@mocks/deps/expo-vector-icons-mock'));
jest.mock('@components/atomic/RoundButton', () => ({
  RoundButton: require('@mocks/components/atomic/RoundButton-mock').roundButtonMock,
}));
jest.mock('@components/atomic/CustomTextInput', () => ({
  CustomTextInput: require('@mocks/components/atomic/CustomTextInput-mock').CustomTextInputMock,
}));

describe('RecipePreparation Component', () => {
  const sampleSteps: preparationStepElement[] = [
    { title: 'Prepare ingredients', description: 'Chop vegetables and measure spices' },
    { title: 'Cook base', description: 'Heat oil and sauté onions until golden' },
    { title: 'Combine and simmer', description: 'Add all ingredients and cook for 20 minutes' },
  ];

  const renderRecipePreparation = async (props: RecipePreparationProps) => {
    const result = render(<RecipePreparation {...props} />);

    await waitFor(() => {
      expect(result.root).toBeTruthy();
    });
    return result;
  };

  describe('readOnly mode', () => {
    it('renders preparation steps in read-only mode with numbered titles and descriptions', async () => {
      const { getByTestId } = await renderRecipePreparation({
        mode: 'readOnly',
        steps: sampleSteps,
      });

      sampleSteps.forEach((step, index) => {
        const titleElement = getByTestId(`RecipePreparation::ReadOnlyStep::${index}::SectionTitle`);
        const titleText = titleElement.props.children;
        expect(titleText).toEqual([index + 1, ') ', step.title]);

        const paragraphElement = getByTestId(
          `RecipePreparation::ReadOnlyStep::${index}::SectionParagraph`
        );
        expect(paragraphElement.props.children).toEqual(step.description);
      });
    });

    it('renders empty list when no steps provided', async () => {
      const { queryByTestId } = await renderRecipePreparation({
        mode: 'readOnly',
        steps: [],
      });

      expect(queryByTestId('RecipePreparation::ReadOnlyStep::0::SectionTitle')).toBeNull();
    });

    it('does not render prefix text in read-only mode', async () => {
      const { queryByTestId } = await renderRecipePreparation({
        mode: 'readOnly',
        steps: sampleSteps,
      });

      expect(queryByTestId('RecipePreparation::PrefixText')).toBeNull();
    });
  });

  describe('editable mode', () => {
    const mockOnTitleEditingEnded = jest.fn();
    const mockOnDescriptionEditingEnded = jest.fn();
    const mockOnAddStep = jest.fn();

    const editableProps: RecipePreparationProps = {
      mode: 'editable',
      steps: sampleSteps,
      prefixText: 'Preparation :',
      onTitleEditingEnded: mockOnTitleEditingEnded,
      onDescriptionEditingEnded: mockOnDescriptionEditingEnded,
      onAddStep: mockOnAddStep,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renders prefix text', async () => {
      const { getByTestId } = await renderRecipePreparation(editableProps);

      expect(getByTestId('RecipePreparation::PrefixText').props.children).toEqual('Preparation :');
    });

    it('renders editable inputs for each step', async () => {
      const { getByTestId } = await renderRecipePreparation(editableProps);

      sampleSteps.forEach((step, index) => {
        expect(
          getByTestId(`RecipePreparation::EditableStep::${index}::Step`).props.children
        ).toContain('Step');
        expect(
          getByTestId(`RecipePreparation::EditableStep::${index}::Title`).props.children
        ).toContain('Title of step');
        expect(
          getByTestId(`RecipePreparation::EditableStep::${index}::TextInputTitle::CustomTextInput`)
            .props.value
        ).toEqual(step.title);
        expect(
          getByTestId(`RecipePreparation::EditableStep::${index}::Content`).props.children
        ).toContain('Content of step');
        expect(
          getByTestId(
            `RecipePreparation::EditableStep::${index}::TextInputContent::CustomTextInput`
          ).props.value
        ).toEqual(step.description);
      });
    });

    it('renders add button', async () => {
      const { getByTestId } = await renderRecipePreparation(editableProps);

      expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
        'plus'
      );
      expect(
        getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction')
      ).toBeTruthy();
    });

    it('calls onAddStep when add button is pressed', async () => {
      const { getByTestId } = await renderRecipePreparation(editableProps);

      fireEvent.press(getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction'));

      expect(mockOnAddStep).toHaveBeenCalledTimes(1);
    });

    it('calls onTitleEditingEnded when title editing ends', async () => {
      const { getByTestId } = await renderRecipePreparation(editableProps);

      const titleInput = getByTestId(
        'RecipePreparation::EditableStep::0::TextInputTitle::CustomTextInput'
      );
      fireEvent(titleInput, 'endEditing', { nativeEvent: { text: 'Updated title' } });

      expect(mockOnTitleEditingEnded).toHaveBeenCalledWith(0, 'Updated title');
    });

    it('calls onDescriptionEditingEnded when description editing ends', async () => {
      const { getByTestId } = await renderRecipePreparation(editableProps);

      const descriptionInput = getByTestId(
        'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
      );
      fireEvent(descriptionInput, 'endEditing', { nativeEvent: { text: 'Updated description' } });

      expect(mockOnDescriptionEditingEnded).toHaveBeenCalledWith(0, 'Updated description');
    });

    it('calls both callbacks independently when both fields finish editing', async () => {
      const { getByTestId } = await renderRecipePreparation(editableProps);

      const titleInput = getByTestId(
        'RecipePreparation::EditableStep::0::TextInputTitle::CustomTextInput'
      );
      const descriptionInput = getByTestId(
        'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
      );

      fireEvent(titleInput, 'endEditing', { nativeEvent: { text: 'Modified title' } });
      fireEvent(descriptionInput, 'endEditing', {
        nativeEvent: { text: 'Modified description' },
      });

      expect(mockOnTitleEditingEnded).toHaveBeenCalledWith(0, 'Modified title');
      expect(mockOnDescriptionEditingEnded).toHaveBeenCalledWith(0, 'Modified description');
    });
  });

  describe('add mode', () => {
    const mockOnTitleEditingEnded = jest.fn();
    const mockOnDescriptionEditingEnded = jest.fn();
    const mockOnAddStep = jest.fn();
    const mockOpenModal = jest.fn();

    const addPropsWithSteps: RecipePreparationProps = {
      mode: 'add',
      steps: sampleSteps,
      prefixText: 'Preparation :',
      onTitleEditingEnded: mockOnTitleEditingEnded,
      onDescriptionEditingEnded: mockOnDescriptionEditingEnded,
      onAddStep: mockOnAddStep,
      openModal: mockOpenModal,
    };

    const addPropsEmpty: RecipePreparationProps = {
      mode: 'add',
      steps: [],
      prefixText: 'Preparation :',
      onTitleEditingEnded: mockOnTitleEditingEnded,
      onDescriptionEditingEnded: mockOnDescriptionEditingEnded,
      onAddStep: mockOnAddStep,
      openModal: mockOpenModal,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renders as editable mode when steps exist', async () => {
      const { getByTestId } = await renderRecipePreparation(addPropsWithSteps);

      expect(getByTestId('RecipePreparation::PrefixText').props.children).toEqual('Preparation :');
      expect(getByTestId('RecipePreparation::EditableStep::0::Step')).toBeTruthy();
      expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
        'plus'
      );
    });

    it('renders OCR and add buttons when steps are empty', async () => {
      const { getByTestId } = await renderRecipePreparation(addPropsEmpty);

      expect(getByTestId('RecipePreparation::PrefixText').props.children).toEqual('Preparation :');
      expect(getByTestId('RecipePreparation::OpenModal::RoundButton::Icon').props.children).toEqual(
        'line-scan'
      );
      expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
        'pencil'
      );
    });

    it('calls openModal when OCR button is pressed in empty state', async () => {
      const { getByTestId } = await renderRecipePreparation(addPropsEmpty);

      fireEvent.press(getByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction'));

      expect(mockOpenModal).toHaveBeenCalledTimes(1);
    });

    it('calls onAddStep when add button is pressed in empty state', async () => {
      const { getByTestId } = await renderRecipePreparation(addPropsEmpty);

      fireEvent.press(getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction'));

      expect(mockOnAddStep).toHaveBeenCalledTimes(1);
    });

    it('does not render OCR button when steps exist', async () => {
      const { queryByTestId } = await renderRecipePreparation(addPropsWithSteps);

      expect(queryByTestId('RecipePreparation::OpenModal::RoundButton::Icon')).toBeNull();
    });
  });

  describe('prop updates', () => {
    const mockOnTitleEditingEnded = jest.fn();
    const mockOnDescriptionEditingEnded = jest.fn();
    const mockOnAddStep = jest.fn();

    const editableProps: RecipePreparationProps = {
      mode: 'editable',
      steps: sampleSteps,
      prefixText: 'Preparation :',
      onTitleEditingEnded: mockOnTitleEditingEnded,
      onDescriptionEditingEnded: mockOnDescriptionEditingEnded,
      onAddStep: mockOnAddStep,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('updates display when prop changes', async () => {
      const { getByTestId, rerender } = await renderRecipePreparation(editableProps);

      const updatedSteps = [{ title: 'New title', description: 'New description' }];
      rerender(<RecipePreparation {...editableProps} steps={updatedSteps} />);

      await waitFor(() => {
        expect(
          getByTestId('RecipePreparation::EditableStep::0::TextInputTitle::CustomTextInput').props
            .value
        ).toEqual('New title');
        expect(
          getByTestId('RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput').props
            .value
        ).toEqual('New description');
      });
    });
  });

  describe('type safety', () => {
    it('enforces required props for editable mode', async () => {
      const editableProps: RecipePreparationProps = {
        mode: 'editable',
        steps: [],
        prefixText: 'Test',
        onTitleEditingEnded: jest.fn(),
        onDescriptionEditingEnded: jest.fn(),
        onAddStep: jest.fn(),
      };

      expect(editableProps.mode).toEqual('editable');
      expect(editableProps.prefixText).toBeDefined();
      expect(editableProps.onTitleEditingEnded).toBeDefined();
      expect(editableProps.onDescriptionEditingEnded).toBeDefined();
      expect(editableProps.onAddStep).toBeDefined();
    });

    it('enforces required props for add mode', async () => {
      const addProps: RecipePreparationProps = {
        mode: 'add',
        steps: [],
        prefixText: 'Test',
        onTitleEditingEnded: jest.fn(),
        onDescriptionEditingEnded: jest.fn(),
        onAddStep: jest.fn(),
        openModal: jest.fn(),
      };

      expect(addProps.mode).toEqual('add');
      expect(addProps.openModal).toBeDefined();
    });

    it('does not require callbacks for readOnly mode', async () => {
      const readOnlyProps: RecipePreparationProps = {
        mode: 'readOnly',
        steps: [],
      };

      expect(readOnlyProps.mode).toEqual('readOnly');
      expect('prefixText' in readOnlyProps).toBeFalsy();
      expect('onTitleEditingEnded' in readOnlyProps).toBeFalsy();
      expect('onDescriptionEditingEnded' in readOnlyProps).toBeFalsy();
    });
  });
});
