/**
 * RecipePreparation - Preparation steps display + editable building blocks
 *
 * This file exposes the pieces the Recipe screen composes for preparation
 * steps. The recipe form drives row-level state through per-row
 * `useController` subscriptions, so the organism no longer owns the array
 * orchestration. Instead it provides:
 *
 * - `RecipePreparation` (default): read-only render of a preparation steps
 *   array.
 * - `EditableStep`: a single editable row with blur-commit title +
 *   description inputs. Used by the per-row field wrapper.
 * - `PreparationEmptyAdd`: the empty-state OCR + manual-add button block
 *   rendered when the user opens the screen in `addOCR` mode without any
 *   preparation steps yet.
 * - `PreparationSection`: the prefix-text wrapper used to frame the editable
 *   list and the "add step" round button. Exposed so the field wrapper can
 *   wrap its mapped `useFieldArray` rows without reaching back into the
 *   organism's internals.
 *
 * @module components/organisms/RecipePreparation
 */

import React from 'react';
import { View } from 'react-native';
import { HelperText, Text } from 'react-native-paper';
import { preparationStepElement } from '@customTypes/DatabaseElementTypes';
import { recipeTableStyles, recipeTextRenderStyles } from '@styles/recipeComponents';
import { RoundButton } from '@components/atomic/RoundButton';
import { Icons } from '@assets/Icons';
import { CustomTextInput } from '@components/atomic/CustomTextInput';
import { useI18n } from '@utils/i18n';

const TEST_ID = 'RecipePreparation';

/**
 * Props for the read-only RecipePreparation component.
 */
export interface RecipePreparationProps {
  steps: preparationStepElement[];
}

/**
 * Props for the editable section frame (prefix text + add-step round button).
 */
export interface PreparationSectionProps {
  prefixText: string;
  children: React.ReactNode;
  onAddStep: () => void;
}

/**
 * Props for the empty-state add block (OCR scan + manual-add buttons).
 */
export interface PreparationEmptyAddProps {
  prefixText: string;
  openModal: () => void;
  onAddStep: () => void;
}

/**
 * Props for a single editable preparation step row.
 */
export interface EditableStepProps {
  index: number;
  title: string;
  description: string;
  /** Live per-keystroke title write (value only, does not mark the row touched). */
  onTitleChange: (title: string) => void;
  /** Live per-keystroke description write (value only, does not mark the row touched). */
  onDescriptionChange: (description: string) => void;
  onTitleCommit: (title: string) => void;
  onDescriptionCommit: (description: string) => void;
  /** Optional translated inline error for the step's description (required by schema). */
  descriptionError?: string;
}

/**
 * Read-only preparation steps. Renders each step's numbered title and
 * description in a vertical stack.
 */
export function RecipePreparation({ steps }: RecipePreparationProps) {
  const testId = TEST_ID + `::ReadOnlyStep`;
  return (
    <View style={recipeTextRenderStyles.containerSection}>
      {steps.map((item, index) => (
        <View key={index} style={recipeTextRenderStyles.containerSection}>
          <Text
            testID={testId + `::${index}::SectionTitle`}
            variant='titleLarge'
            style={recipeTextRenderStyles.headlineElement}
            accessible={true}
          >
            {index + 1}) {item.title}
          </Text>
          <Text
            testID={testId + `::${index}::SectionParagraph`}
            variant='titleMedium'
            style={recipeTextRenderStyles.containerElement}
            accessible={true}
          >
            {item.description}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Section frame for editable preparation: the prefix label, the caller's
 * mapped rows, then the round "add step" button.
 */
export function PreparationSection({ prefixText, children, onAddStep }: PreparationSectionProps) {
  return (
    <View style={recipeTextRenderStyles.containerSection}>
      <Text
        testID={`${TEST_ID}::PrefixText`}
        variant={'headlineSmall'}
        style={recipeTextRenderStyles.containerElement}
      >
        {prefixText}
      </Text>
      {children}
      <RoundButton
        testID={`${TEST_ID}::AddButton`}
        size='medium'
        icon={Icons.plusIcon}
        onPressFunction={onAddStep}
        style={recipeTextRenderStyles.roundButtonPadding}
      />
    </View>
  );
}

/**
 * Empty-state add block for `addOCR` mode: lets the user either OCR-scan a
 * recipe image for preparation steps or start adding steps manually.
 */
export function PreparationEmptyAdd({
  prefixText,
  openModal,
  onAddStep,
}: PreparationEmptyAddProps) {
  return (
    <View style={recipeTextRenderStyles.containerSection}>
      <Text
        testID={`${TEST_ID}::PrefixText`}
        variant={'headlineSmall'}
        style={recipeTextRenderStyles.containerElement}
      >
        {prefixText}
      </Text>
      <View style={recipeTableStyles.roundButtonsContainer}>
        <RoundButton
          testID={`${TEST_ID}::OpenModal`}
          style={recipeTableStyles.roundButton}
          size='medium'
          icon={Icons.scanImageIcon}
          onPressFunction={openModal}
        />
        <RoundButton
          testID={`${TEST_ID}::AddButton`}
          style={recipeTableStyles.roundButton}
          size='medium'
          icon={Icons.pencilIcon}
          onPressFunction={onAddStep}
        />
      </View>
    </View>
  );
}

/**
 * Single editable preparation step. Inputs live-commit their value on every
 * keystroke via `CustomTextInput.onChangeText` and re-commit + mark touched on
 * blur via `onEndEditing` — mirroring `RecipeText` so a Save tap with an
 * unfocused-but-typed input still persists the latest text (`Keyboard.dismiss`
 * / Android `hideKeyboard` cannot guarantee a synchronous blur over the RN
 * bridge). The caller wires these to a per-row form controller, so a keystroke
 * in one step never triggers a re-render of any sibling row.
 */
export function EditableStep({
  index,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onTitleCommit,
  onDescriptionCommit,
  descriptionError,
}: EditableStepProps) {
  const testId = `${TEST_ID}::EditableStep::${index}`;
  const { t } = useI18n();

  return (
    <View style={recipeTextRenderStyles.containerSection}>
      <Text
        testID={testId + `::Step`}
        variant='titleLarge'
        style={recipeTextRenderStyles.headlineElement}
      >
        {t('preparationOCRStep')} {index + 1}
      </Text>

      <View style={recipeTextRenderStyles.containerSection}>
        <Text
          testID={testId + `::Title`}
          variant='titleMedium'
          style={recipeTextRenderStyles.containerElement}
        >
          {t('preparationOCRStepTitle')} {index + 1} :{' '}
        </Text>
        <CustomTextInput
          testID={testId + `::TextInputTitle`}
          value={title}
          style={recipeTextRenderStyles.containerElement}
          onChangeText={onTitleChange}
          onEndEditing={onTitleCommit}
          multiline={true}
        />
        <Text
          testID={testId + `::Content`}
          variant='titleMedium'
          style={recipeTextRenderStyles.containerElement}
        >
          {t('preparationOCRStepContent')} {index + 1} :{' '}
        </Text>
        <CustomTextInput
          testID={testId + `::TextInputContent`}
          style={recipeTextRenderStyles.containerElement}
          value={description}
          onChangeText={onDescriptionChange}
          onEndEditing={onDescriptionCommit}
          multiline={true}
          error={!!descriptionError}
        />
        {descriptionError ? (
          <HelperText testID={testId + `::DescriptionError`} type='error' visible={true}>
            {descriptionError}
          </HelperText>
        ) : null}
      </View>
    </View>
  );
}

export default RecipePreparation;
