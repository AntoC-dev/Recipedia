import { Button, Text, TextInput, View } from 'react-native';
import React from 'react';
import { RecipePreparationProps } from '@components/organisms/RecipePreparation';
import { preparationStepElement } from '@customTypes/DatabaseElementTypes';

const testID = 'RecipePreparation';

function EditableStepMock({
  step,
  index,
  mode,
  onTitleEditingEnded,
  onDescriptionEditingEnded,
}: {
  step: preparationStepElement;
  index: number;
  mode: 'readOnly' | 'editable' | 'add';
  onTitleEditingEnded?: (index: number, title: string) => void;
  onDescriptionEditingEnded?: (index: number, description: string) => void;
}) {
  return (
    <View key={index}>
      {mode === 'readOnly' ? (
        <>
          <Text testID={`${testID}::ReadOnlyStep::${index}::SectionTitle`}>
            {index + 1}) {step.title}
          </Text>
          <Text testID={`${testID}::ReadOnlyStep::${index}::SectionParagraph`}>
            {step.description}
          </Text>
        </>
      ) : (
        <>
          <Text testID={`${testID}::EditableStep::${index}::Step`}>Step {index + 1}</Text>
          <Text testID={`${testID}::EditableStep::${index}::Title`}>
            Title of step {index + 1} :{' '}
          </Text>
          <TextInput
            testID={`${testID}::EditableStep::${index}::TextInputTitle::CustomTextInput`}
            value={step.title}
            onEndEditing={e => onTitleEditingEnded?.(index, e?.nativeEvent?.text ?? step.title)}
          />
          <Text testID={`${testID}::EditableStep::${index}::Content`}>
            Content of step {index + 1} :{' '}
          </Text>
          <TextInput
            testID={`${testID}::EditableStep::${index}::TextInputContent::CustomTextInput`}
            value={step.description}
            onEndEditing={e =>
              onDescriptionEditingEnded?.(index, e?.nativeEvent?.text ?? step.description)
            }
          />
        </>
      )}
    </View>
  );
}

export function recipePreparationMock(props: RecipePreparationProps) {
  const { steps, mode } = props;

  return (
    <View testID={testID}>
      <Text testID={`${testID}::Mode`}>{mode}</Text>
      <Text testID={`${testID}::Steps`}>{JSON.stringify(steps)}</Text>
      {'prefixText' in props && <Text testID={`${testID}::PrefixText`}>{props.prefixText}</Text>}
      {steps.map((step, index) => (
        <EditableStepMock
          key={index}
          step={step}
          index={index}
          mode={mode}
          onTitleEditingEnded={
            'onTitleEditingEnded' in props ? props.onTitleEditingEnded : undefined
          }
          onDescriptionEditingEnded={
            'onDescriptionEditingEnded' in props ? props.onDescriptionEditingEnded : undefined
          }
        />
      ))}
      {'openModal' in props && steps.length === 0 && (
        <>
          <Button
            testID={`${testID}::OpenModal::RoundButton::OnPressFunction`}
            onPress={props.openModal}
            title='Open Modal'
          />
          <Text testID={`${testID}::OpenModal::RoundButton::Icon`}>line-scan</Text>
        </>
      )}
      {'onAddStep' in props && (
        <>
          <Button
            testID={`${testID}::AddButton::RoundButton::OnPressFunction`}
            onPress={props.onAddStep}
            title='Add Step'
          />
          <Text testID={`${testID}::AddButton::RoundButton::Icon`}>
            {mode === 'add' && steps.length === 0 ? 'pencil' : 'plus'}
          </Text>
        </>
      )}
    </View>
  );
}
