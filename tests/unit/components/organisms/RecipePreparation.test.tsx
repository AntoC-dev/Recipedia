import { fireEvent } from '@testing-library/react-native';
import {
  IMAGE_MODAL_TARGET_TEST_ID,
  renderWithRecipeDialogs,
} from '@mocks/context/RecipeDialogsHarness';
import React from 'react';
import { preparationStepElement, recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import {
  RecipePreparation,
  EditableStep,
  PreparationSection,
} from '@components/organisms/RecipePreparation';
import { recipeButtonStyles } from '@styles/recipeComponents';

jest.mock('@expo/vector-icons', () => require('@mocks/deps/expo-vector-icons-mock'));
jest.mock('@components/atomic/RoundButton', () => ({
  RoundButton: require('@mocks/components/atomic/RoundButton-mock').roundButtonMock,
}));
jest.mock('@components/atomic/CustomTextInput', () => ({
  CustomTextInput: require('@mocks/components/atomic/CustomTextInput-mock').CustomTextInputMock,
}));
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const sampleSteps: preparationStepElement[] = [
  { title: 'Prepare ingredients', description: 'Chop vegetables and measure spices' },
  { title: 'Cook base', description: 'Heat oil and sauté onions until golden' },
  { title: 'Combine and simmer', description: 'Add all ingredients and cook for 20 minutes' },
];

describe('RecipePreparation (read-only)', () => {
  it('renders each step as numbered title + description', async () => {
    const { getByTestId } = await renderWithRecipeDialogs(
      <RecipePreparation steps={sampleSteps} />
    );

    sampleSteps.forEach((step, index) => {
      const title = getByTestId(`RecipePreparation::ReadOnlyStep::${index}::SectionTitle`);
      expect(title.props.children).toEqual([index + 1, ') ', step.title]);
      const para = getByTestId(`RecipePreparation::ReadOnlyStep::${index}::SectionParagraph`);
      expect(para.props.children).toEqual(step.description);
    });
  });

  it('renders nothing when steps are empty', async () => {
    const { queryByTestId } = await renderWithRecipeDialogs(<RecipePreparation steps={[]} />);
    expect(queryByTestId('RecipePreparation::ReadOnlyStep::0::SectionTitle')).toBeNull();
  });

  it('does not render a prefix text', async () => {
    const { queryByTestId } = await renderWithRecipeDialogs(
      <RecipePreparation steps={sampleSteps} />
    );
    expect(queryByTestId('RecipePreparation::PrefixText')).toBeNull();
  });
});

describe('PreparationSection', () => {
  it('renders prefix, children, and add button', async () => {
    const onAddStep = jest.fn();
    const { getByTestId, getByText } = await renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={onAddStep}>
        <React.Fragment>{getChildText()}</React.Fragment>
      </PreparationSection>
    );

    expect(getByTestId('RecipePreparation::PrefixText').props.children).toEqual('Preparation :');
    expect(getByText('child-marker')).toBeTruthy();
    expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
      'plus'
    );
    expect(getByTestId('RecipePreparation::AddButton::RoundButton::Label').props.children).toEqual(
      'recipe.roundButton.newStep'
    );
  });

  it('fires onAddStep when add button pressed', async () => {
    const onAddStep = jest.fn();
    const { getByTestId } = await renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={onAddStep}>
        {null}
      </PreparationSection>
    );

    await fireEvent.press(
      getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction')
    );
    expect(onAddStep).toHaveBeenCalledTimes(1);
  });
});

describe('PreparationSection layout', () => {
  it.each([false, true])(
    'gives the add button the round button style (withScan: %s)',
    async withScan => {
      const { getByTestId } = await renderWithRecipeDialogs(
        <PreparationSection prefixText='Preparation :' onAddStep={jest.fn()} withScan={withScan}>
          {null}
        </PreparationSection>
      );

      expect(
        JSON.parse(getByTestId('RecipePreparation::AddButton::RoundButton::Style').props.children)
      ).toEqual(recipeButtonStyles.roundButton);
    }
  );
});

describe('PreparationSection when withScan is set', () => {
  it('renders scan and add buttons with the right icons and labels', async () => {
    const { getByTestId } = await renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={jest.fn()} withScan>
        {null}
      </PreparationSection>
    );

    expect(getByTestId('RecipePreparation::OpenModal::RoundButton::Icon').props.children).toEqual(
      'line-scan'
    );
    expect(getByTestId('RecipePreparation::OpenModal::RoundButton::Label').props.children).toEqual(
      'recipe.roundButton.scan'
    );
    expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
      'plus'
    );
    expect(getByTestId('RecipePreparation::AddButton::RoundButton::Label').props.children).toEqual(
      'recipe.roundButton.newStep'
    );
  });

  it('fires the OCR modal opener and onAddStep independently', async () => {
    const onAddStep = jest.fn();
    const { getByTestId } = await renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={onAddStep} withScan>
        {null}
      </PreparationSection>
    );

    await fireEvent.press(
      getByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
    );
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(
      recipeColumnsNames.preparation
    );
    expect(onAddStep).not.toHaveBeenCalled();
    await fireEvent.press(
      getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction')
    );
    expect(onAddStep).toHaveBeenCalledTimes(1);
  });

  it('does not render the scan button without withScan', async () => {
    const { queryByTestId } = await renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={jest.fn()}>
        {null}
      </PreparationSection>
    );
    expect(queryByTestId('RecipePreparation::OpenModal::RoundButton::Icon')).toBeNull();
  });
});

describe('PreparationSection empty state', () => {
  it('keeps the plus new-step button when empty without withScan', async () => {
    const { getByTestId, queryByTestId } = await renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={jest.fn()} isEmpty>
        {null}
      </PreparationSection>
    );

    expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
      'plus'
    );
    expect(getByTestId('RecipePreparation::AddButton::RoundButton::Label').props.children).toEqual(
      'recipe.roundButton.newStep'
    );
    expect(queryByTestId('RecipePreparation::OpenModal::RoundButton::Icon')).toBeNull();
  });

  it('renders scan and pencil add-manually buttons when withScan is set', async () => {
    const { getByTestId } = await renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={jest.fn()} isEmpty withScan>
        {null}
      </PreparationSection>
    );

    expect(getByTestId('RecipePreparation::OpenModal::RoundButton::Icon').props.children).toEqual(
      'line-scan'
    );
    expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
      'pencil'
    );
    expect(getByTestId('RecipePreparation::AddButton::RoundButton::Label').props.children).toEqual(
      'recipe.roundButton.addManually'
    );
  });

  it('fires the OCR modal opener and onAddStep callbacks independently', async () => {
    const onAddStep = jest.fn();
    const { getByTestId } = await renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={onAddStep} isEmpty withScan>
        {null}
      </PreparationSection>
    );

    await fireEvent.press(
      getByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
    );
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(
      recipeColumnsNames.preparation
    );
    expect(onAddStep).not.toHaveBeenCalled();

    await fireEvent.press(
      getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction')
    );
    expect(onAddStep).toHaveBeenCalledTimes(1);
  });

  it('keeps the plus new-step button when isEmpty is false', async () => {
    const { getByTestId } = await renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={jest.fn()} isEmpty={false} withScan>
        {null}
      </PreparationSection>
    );

    expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
      'plus'
    );
    expect(getByTestId('RecipePreparation::AddButton::RoundButton::Label').props.children).toEqual(
      'recipe.roundButton.newStep'
    );
  });
});

describe('EditableStep', () => {
  const editableStepTestId = (index: number) => `RecipePreparation::EditableStep::${index}`;

  function renderEditableStep(overrides: Partial<React.ComponentProps<typeof EditableStep>> = {}) {
    return renderWithRecipeDialogs(
      <EditableStep
        index={0}
        title=''
        description=''
        onTitleChange={jest.fn()}
        onDescriptionChange={jest.fn()}
        onTitleCommit={jest.fn()}
        onDescriptionCommit={jest.fn()}
        onRemove={jest.fn()}
        {...overrides}
      />
    );
  }

  it('renders title + description from props', async () => {
    const { getByTestId } = await renderEditableStep({
      title: 'My title',
      description: 'My description',
    });

    expect(
      getByTestId(`${editableStepTestId(0)}::TextInputTitle::CustomTextInput`).props.value
    ).toEqual('My title');
    expect(
      getByTestId(`${editableStepTestId(0)}::TextInputContent::CustomTextInput`).props.value
    ).toEqual('My description');
  });

  it.each([
    [0, 'Step 1', 'Delete step 1'],
    [1, 'Step 2', 'Delete step 2'],
    [9, 'Step 10', 'Delete step 10'],
  ])(
    'renders the one-based header and delete label for index %s',
    async (index, expectedHeader, expectedDeleteLabel) => {
      const { getByTestId, getByText } = await renderEditableStep({ index });

      expect(getByTestId(editableStepTestId(index))).toBeTruthy();
      expect(getByText(expectedHeader)).toBeTruthy();
      expect(getByText('titleMedium')).toBeTruthy();
      expect(
        getByTestId(`${editableStepTestId(index)}::DeleteButton`).props.accessibilityLabel
      ).toBe(expectedDeleteLabel);
    }
  );

  it('renders field captions without step number', async () => {
    const { getByTestId } = await renderEditableStep({ index: 1 });

    expect(getByTestId(`${editableStepTestId(1)}::Title`)).toHaveTextContent('Title', {
      exact: true,
    });
    expect(getByTestId(`${editableStepTestId(1)}::Content`)).toHaveTextContent('Instructions', {
      exact: true,
    });
  });

  it('renders a trash delete button that calls onRemove when pressed', async () => {
    const onRemove = jest.fn();
    const { getByTestId } = await renderEditableStep({
      index: 1,
      title: 'A title',
      description: 'A description',
      onRemove,
    });

    expect(getByTestId(`${editableStepTestId(1)}::DeleteButton::Icon`).props.children).toBe(
      'delete'
    );
    await fireEvent.press(getByTestId(`${editableStepTestId(1)}::DeleteButton`));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not call any input callback when the delete button is pressed', async () => {
    const onTitleChange = jest.fn();
    const onDescriptionChange = jest.fn();
    const onTitleCommit = jest.fn();
    const onDescriptionCommit = jest.fn();
    const { getByTestId } = await renderEditableStep({
      onTitleChange,
      onDescriptionChange,
      onTitleCommit,
      onDescriptionCommit,
    });

    await fireEvent.press(getByTestId(`${editableStepTestId(0)}::DeleteButton`));

    expect(onTitleChange).not.toHaveBeenCalled();
    expect(onDescriptionChange).not.toHaveBeenCalled();
    expect(onTitleCommit).not.toHaveBeenCalled();
    expect(onDescriptionCommit).not.toHaveBeenCalled();
  });

  it('live-changes title on keystroke and commits on blur', async () => {
    const onTitleChange = jest.fn();
    const onTitleCommit = jest.fn();
    const onDescriptionChange = jest.fn();
    const { getByTestId } = await renderEditableStep({
      title: 'Original',
      onTitleChange,
      onTitleCommit,
      onDescriptionChange,
    });

    const titleInput = getByTestId(`${editableStepTestId(0)}::TextInputTitle::CustomTextInput`);
    await fireEvent.changeText(titleInput, 'Mid typing');
    expect(onTitleChange).toHaveBeenCalledWith('Mid typing');
    expect(onTitleCommit).not.toHaveBeenCalled();
    expect(onDescriptionChange).not.toHaveBeenCalled();

    await fireEvent(titleInput, 'endEditing', { nativeEvent: { text: 'Final' } });
    expect(onTitleCommit).toHaveBeenCalledWith('Final');
  });

  it('live-changes description on keystroke and commits on blur', async () => {
    const onDescriptionChange = jest.fn();
    const onDescriptionCommit = jest.fn();
    const onTitleChange = jest.fn();
    const { getByTestId } = await renderEditableStep({
      description: 'Original',
      onDescriptionChange,
      onDescriptionCommit,
      onTitleChange,
    });

    const descInput = getByTestId(`${editableStepTestId(0)}::TextInputContent::CustomTextInput`);
    await fireEvent.changeText(descInput, 'Mid typing');
    expect(onDescriptionChange).toHaveBeenCalledWith('Mid typing');
    expect(onDescriptionCommit).not.toHaveBeenCalled();
    expect(onTitleChange).not.toHaveBeenCalled();

    await fireEvent(descInput, 'endEditing', { nativeEvent: { text: 'Final desc' } });
    expect(onDescriptionCommit).toHaveBeenCalledWith('Final desc');
  });

  it.each([
    ['undefined', undefined],
    ['an empty string', ''],
  ])(
    'does not render a description error helper when descriptionError is %s',
    async (_label, descriptionError) => {
      const { queryByTestId, getByTestId } = await renderEditableStep({ descriptionError });

      expect(queryByTestId(`${editableStepTestId(0)}::DescriptionError`)).toBeNull();
      expect(getByTestId(`${editableStepTestId(0)}::TextInputContent::error`).props.children).toBe(
        'false'
      );
    }
  );

  it('renders the description error helper and flags the input when descriptionError is set', async () => {
    const { getByTestId } = await renderEditableStep({
      index: 2,
      title: 'A title',
      descriptionError: 'Description is required',
    });

    expect(getByTestId(`${editableStepTestId(2)}::DescriptionError`).props.children).toEqual(
      'Description is required'
    );
    expect(getByTestId(`${editableStepTestId(2)}::TextInputContent::error`).props.children).toBe(
      'true'
    );
  });

  it('never flags the title input with an error, even when descriptionError is set', async () => {
    const { queryByTestId } = await renderEditableStep({
      descriptionError: 'Description is required',
    });

    expect(queryByTestId(`${editableStepTestId(0)}::TextInputTitle::error`)).toBeNull();
  });
});

function getChildText() {
  const { Text } = require('react-native');
  return <Text>child-marker</Text>;
}
