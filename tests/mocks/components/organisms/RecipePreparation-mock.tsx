import { Button, Text, TextInput, View } from 'react-native';
import React from 'react';
import {
  EditableStepProps,
  PreparationEmptyAddProps,
  PreparationSectionProps,
  RecipePreparationProps,
} from '@components/organisms/RecipePreparation';

const testID = 'RecipePreparation';

export function recipePreparationMock({ steps }: RecipePreparationProps) {
  return (
    <View testID={testID}>
      <Text testID={`${testID}::Steps`}>{JSON.stringify(steps)}</Text>
      {steps.map((step, index) => (
        <View key={index}>
          <Text testID={`${testID}::ReadOnlyStep::${index}::SectionTitle`}>
            {index + 1}) {step.title}
          </Text>
          <Text testID={`${testID}::ReadOnlyStep::${index}::SectionParagraph`}>
            {step.description}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function preparationSectionMock({
  prefixText,
  children,
  onAddStep,
}: PreparationSectionProps) {
  return (
    <View testID={testID}>
      <Text testID={`${testID}::PrefixText`}>{prefixText}</Text>
      {children}
      <Button
        testID={`${testID}::AddButton::RoundButton::OnPressFunction`}
        onPress={onAddStep}
        title='Add Step'
      />
      <Text testID={`${testID}::AddButton::RoundButton::Icon`}>plus</Text>
    </View>
  );
}

export function preparationEmptyAddMock({
  prefixText,
  openModal,
  onAddStep,
}: PreparationEmptyAddProps) {
  return (
    <View testID={testID}>
      <Text testID={`${testID}::PrefixText`}>{prefixText}</Text>
      <Button
        testID={`${testID}::OpenModal::RoundButton::OnPressFunction`}
        onPress={openModal}
        title='Open Modal'
      />
      <Text testID={`${testID}::OpenModal::RoundButton::Icon`}>line-scan</Text>
      <Button
        testID={`${testID}::AddButton::RoundButton::OnPressFunction`}
        onPress={onAddStep}
        title='Add Step'
      />
      <Text testID={`${testID}::AddButton::RoundButton::Icon`}>pencil</Text>
    </View>
  );
}

export function editableStepMock({
  index,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onTitleCommit,
  onDescriptionCommit,
  descriptionError,
}: EditableStepProps) {
  return (
    <View testID={`${testID}::EditableStep::${index}`}>
      <Text testID={`${testID}::EditableStep::${index}::Step`}>Step {index + 1}</Text>
      <Text testID={`${testID}::EditableStep::${index}::Title`}>Title of step {index + 1} : </Text>
      <TextInput
        testID={`${testID}::EditableStep::${index}::TextInputTitle::CustomTextInput`}
        value={title}
        onChangeText={onTitleChange}
        onEndEditing={e => onTitleCommit(e?.nativeEvent?.text ?? title)}
      />
      <Text testID={`${testID}::EditableStep::${index}::Content`}>
        Content of step {index + 1} :{' '}
      </Text>
      <TextInput
        testID={`${testID}::EditableStep::${index}::TextInputContent::CustomTextInput`}
        value={description}
        onChangeText={onDescriptionChange}
        onEndEditing={e => onDescriptionCommit(e?.nativeEvent?.text ?? description)}
      />
      {descriptionError ? (
        <Text testID={`${testID}::EditableStep::${index}::DescriptionError`}>
          {descriptionError}
        </Text>
      ) : null}
    </View>
  );
}
