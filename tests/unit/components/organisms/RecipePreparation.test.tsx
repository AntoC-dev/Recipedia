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
  it('renders each step as numbered title + description', () => {
    const { getByTestId } = renderWithRecipeDialogs(<RecipePreparation steps={sampleSteps} />);

    sampleSteps.forEach((step, index) => {
      const title = getByTestId(`RecipePreparation::ReadOnlyStep::${index}::SectionTitle`);
      expect(title.props.children).toEqual([index + 1, ') ', step.title]);
      const para = getByTestId(`RecipePreparation::ReadOnlyStep::${index}::SectionParagraph`);
      expect(para.props.children).toEqual(step.description);
    });
  });

  it('renders nothing when steps are empty', () => {
    const { queryByTestId } = renderWithRecipeDialogs(<RecipePreparation steps={[]} />);
    expect(queryByTestId('RecipePreparation::ReadOnlyStep::0::SectionTitle')).toBeNull();
  });

  it('does not render a prefix text', () => {
    const { queryByTestId } = renderWithRecipeDialogs(<RecipePreparation steps={sampleSteps} />);
    expect(queryByTestId('RecipePreparation::PrefixText')).toBeNull();
  });
});

describe('PreparationSection', () => {
  it('renders prefix, children, and add button', () => {
    const onAddStep = jest.fn();
    const { getByTestId, getByText } = renderWithRecipeDialogs(
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

  it('fires onAddStep when add button pressed', () => {
    const onAddStep = jest.fn();
    const { getByTestId } = renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={onAddStep}>
        {null}
      </PreparationSection>
    );

    fireEvent.press(getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction'));
    expect(onAddStep).toHaveBeenCalledTimes(1);
  });
});

describe('PreparationSection layout', () => {
  it.each([false, true])('gives the add button the round button style (withScan: %s)', withScan => {
    const { getByTestId } = renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={jest.fn()} withScan={withScan}>
        {null}
      </PreparationSection>
    );

    expect(
      JSON.parse(getByTestId('RecipePreparation::AddButton::RoundButton::Style').props.children)
    ).toEqual(recipeButtonStyles.roundButton);
  });
});

describe('PreparationSection when withScan is set', () => {
  it('renders scan and add buttons with the right icons and labels', () => {
    const { getByTestId } = renderWithRecipeDialogs(
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

  it('fires the OCR modal opener and onAddStep independently', () => {
    const onAddStep = jest.fn();
    const { getByTestId } = renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={onAddStep} withScan>
        {null}
      </PreparationSection>
    );

    fireEvent.press(getByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction'));
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(
      recipeColumnsNames.preparation
    );
    expect(onAddStep).not.toHaveBeenCalled();
    fireEvent.press(getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction'));
    expect(onAddStep).toHaveBeenCalledTimes(1);
  });

  it('does not render the scan button without withScan', () => {
    const { queryByTestId } = renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={jest.fn()}>
        {null}
      </PreparationSection>
    );
    expect(queryByTestId('RecipePreparation::OpenModal::RoundButton::Icon')).toBeNull();
  });
});

describe('PreparationSection empty state', () => {
  it('keeps the plus new-step button when empty without withScan', () => {
    const { getByTestId, queryByTestId } = renderWithRecipeDialogs(
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

  it('renders scan and pencil add-manually buttons when withScan is set', () => {
    const { getByTestId } = renderWithRecipeDialogs(
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

  it('fires the OCR modal opener and onAddStep callbacks independently', () => {
    const onAddStep = jest.fn();
    const { getByTestId } = renderWithRecipeDialogs(
      <PreparationSection prefixText='Preparation :' onAddStep={onAddStep} isEmpty withScan>
        {null}
      </PreparationSection>
    );

    fireEvent.press(getByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction'));
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(
      recipeColumnsNames.preparation
    );
    expect(onAddStep).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction'));
    expect(onAddStep).toHaveBeenCalledTimes(1);
  });

  it('keeps the plus new-step button when isEmpty is false', () => {
    const { getByTestId } = renderWithRecipeDialogs(
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
  it('renders title + description from props', () => {
    const { getByTestId } = renderWithRecipeDialogs(
      <EditableStep
        index={0}
        title='My title'
        description='My description'
        onTitleChange={jest.fn()}
        onDescriptionChange={jest.fn()}
        onTitleCommit={jest.fn()}
        onDescriptionCommit={jest.fn()}
      />
    );

    expect(
      getByTestId('RecipePreparation::EditableStep::0::TextInputTitle::CustomTextInput').props.value
    ).toEqual('My title');
    expect(
      getByTestId('RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput').props
        .value
    ).toEqual('My description');
  });

  it('live-changes title on keystroke and commits on blur', () => {
    const onTitleChange = jest.fn();
    const onTitleCommit = jest.fn();
    const { getByTestId } = renderWithRecipeDialogs(
      <EditableStep
        index={0}
        title='Original'
        description=''
        onTitleChange={onTitleChange}
        onDescriptionChange={jest.fn()}
        onTitleCommit={onTitleCommit}
        onDescriptionCommit={jest.fn()}
      />
    );

    const titleInput = getByTestId(
      'RecipePreparation::EditableStep::0::TextInputTitle::CustomTextInput'
    );
    fireEvent.changeText(titleInput, 'Mid typing');
    expect(onTitleChange).toHaveBeenCalledWith('Mid typing');
    expect(onTitleCommit).not.toHaveBeenCalled();

    fireEvent(titleInput, 'endEditing', { nativeEvent: { text: 'Final' } });
    expect(onTitleCommit).toHaveBeenCalledWith('Final');
  });

  it('live-changes description on keystroke and commits on blur', () => {
    const onDescriptionChange = jest.fn();
    const onDescriptionCommit = jest.fn();
    const { getByTestId } = renderWithRecipeDialogs(
      <EditableStep
        index={0}
        title=''
        description='Original'
        onTitleChange={jest.fn()}
        onDescriptionChange={onDescriptionChange}
        onTitleCommit={jest.fn()}
        onDescriptionCommit={onDescriptionCommit}
      />
    );

    const descInput = getByTestId(
      'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
    );
    fireEvent.changeText(descInput, 'Mid typing');
    expect(onDescriptionChange).toHaveBeenCalledWith('Mid typing');
    expect(onDescriptionCommit).not.toHaveBeenCalled();

    fireEvent(descInput, 'endEditing', { nativeEvent: { text: 'Final desc' } });
    expect(onDescriptionCommit).toHaveBeenCalledWith('Final desc');
  });

  it('does not render a description error helper when descriptionError is undefined', () => {
    const { queryByTestId, getByTestId } = renderWithRecipeDialogs(
      <EditableStep
        index={0}
        title=''
        description=''
        onTitleChange={jest.fn()}
        onDescriptionChange={jest.fn()}
        onTitleCommit={jest.fn()}
        onDescriptionCommit={jest.fn()}
      />
    );

    expect(queryByTestId('RecipePreparation::EditableStep::0::DescriptionError')).toBeNull();
    expect(
      getByTestId('RecipePreparation::EditableStep::0::TextInputContent::error').props.children
    ).toBe('false');
  });

  it('renders the description error helper and flags the input when descriptionError is set', () => {
    const { getByTestId } = renderWithRecipeDialogs(
      <EditableStep
        index={2}
        title='A title'
        description=''
        onTitleChange={jest.fn()}
        onDescriptionChange={jest.fn()}
        onTitleCommit={jest.fn()}
        onDescriptionCommit={jest.fn()}
        descriptionError='Description is required'
      />
    );

    expect(
      getByTestId('RecipePreparation::EditableStep::2::DescriptionError').props.children
    ).toEqual('Description is required');
    expect(
      getByTestId('RecipePreparation::EditableStep::2::TextInputContent::error').props.children
    ).toBe('true');
  });
});

function getChildText() {
  const { Text } = require('react-native');
  return <Text>child-marker</Text>;
}
