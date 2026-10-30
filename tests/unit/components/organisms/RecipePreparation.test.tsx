import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { preparationStepElement } from '@customTypes/DatabaseElementTypes';
import {
  RecipePreparation,
  EditableStep,
  PreparationEmptyAdd,
  PreparationSection,
} from '@components/organisms/RecipePreparation';

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
    const { getByTestId } = await render(<RecipePreparation steps={sampleSteps} />);

    sampleSteps.forEach((step, index) => {
      const title = getByTestId(`RecipePreparation::ReadOnlyStep::${index}::SectionTitle`);
      expect(title.props.children).toEqual([index + 1, ') ', step.title]);
      const para = getByTestId(`RecipePreparation::ReadOnlyStep::${index}::SectionParagraph`);
      expect(para.props.children).toEqual(step.description);
    });
  });

  it('renders nothing when steps are empty', async () => {
    const { queryByTestId } = await render(<RecipePreparation steps={[]} />);
    expect(queryByTestId('RecipePreparation::ReadOnlyStep::0::SectionTitle')).toBeNull();
  });

  it('does not render a prefix text', async () => {
    const { queryByTestId } = await render(<RecipePreparation steps={sampleSteps} />);
    expect(queryByTestId('RecipePreparation::PrefixText')).toBeNull();
  });
});

describe('PreparationSection', () => {
  it('renders prefix, children, and add button', async () => {
    const onAddStep = jest.fn();
    const { getByTestId, getByText } = await render(
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
    const { getByTestId } = await render(
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

describe('PreparationEmptyAdd', () => {
  it('renders OCR + add buttons with the right icons and labels', async () => {
    const { getByTestId } = await render(
      <PreparationEmptyAdd prefixText='Preparation :' openModal={jest.fn()} onAddStep={jest.fn()} />
    );

    expect(getByTestId('RecipePreparation::OpenModal::RoundButton::Icon').props.children).toEqual(
      'line-scan'
    );
    expect(getByTestId('RecipePreparation::OpenModal::RoundButton::Label').props.children).toEqual(
      'recipe.roundButton.scan'
    );
    expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
      'pencil'
    );
    expect(getByTestId('RecipePreparation::AddButton::RoundButton::Label').props.children).toEqual(
      'recipe.roundButton.addManually'
    );
  });

  it('fires openModal and onAddStep callbacks independently', async () => {
    const openModal = jest.fn();
    const onAddStep = jest.fn();
    const { getByTestId } = await render(
      <PreparationEmptyAdd prefixText='Preparation :' openModal={openModal} onAddStep={onAddStep} />
    );

    await fireEvent.press(
      getByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
    );
    expect(openModal).toHaveBeenCalledTimes(1);
    expect(onAddStep).not.toHaveBeenCalled();

    await fireEvent.press(
      getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction')
    );
    expect(onAddStep).toHaveBeenCalledTimes(1);
  });
});

describe('EditableStep', () => {
  it('renders title + description from props', async () => {
    const { getByTestId } = await render(
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

  it('live-changes title on keystroke and commits on blur', async () => {
    const onTitleChange = jest.fn();
    const onTitleCommit = jest.fn();
    const { getByTestId } = await render(
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
    await fireEvent.changeText(titleInput, 'Mid typing');
    expect(onTitleChange).toHaveBeenCalledWith('Mid typing');
    expect(onTitleCommit).not.toHaveBeenCalled();

    await fireEvent(titleInput, 'endEditing', { nativeEvent: { text: 'Final' } });
    expect(onTitleCommit).toHaveBeenCalledWith('Final');
  });

  it('live-changes description on keystroke and commits on blur', async () => {
    const onDescriptionChange = jest.fn();
    const onDescriptionCommit = jest.fn();
    const { getByTestId } = await render(
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
    await fireEvent.changeText(descInput, 'Mid typing');
    expect(onDescriptionChange).toHaveBeenCalledWith('Mid typing');
    expect(onDescriptionCommit).not.toHaveBeenCalled();

    await fireEvent(descInput, 'endEditing', { nativeEvent: { text: 'Final desc' } });
    expect(onDescriptionCommit).toHaveBeenCalledWith('Final desc');
  });

  it('does not render a description error helper when descriptionError is undefined', async () => {
    const { queryByTestId, getByTestId } = await render(
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

  it('renders the description error helper and flags the input when descriptionError is set', async () => {
    const { getByTestId } = await render(
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
