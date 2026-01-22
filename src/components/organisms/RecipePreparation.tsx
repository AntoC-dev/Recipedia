/**
 * RecipePreparation - Dedicated preparation steps component
 *
 * A specialized component for displaying and editing recipe preparation steps.
 * Features two distinct modes: read-only display with numbered steps and editable mode
 * with inline inputs for step titles and descriptions.
 *
 * Key Features:
 * - Simple View/Text/Input layout for text-based content
 * - Editable mode with inline CustomTextInput for title and description
 * - Scrollable list for handling multiple steps
 * - Two-field layout per step: Title and Description
 * - Empty state with OCR scanning button and manual add button
 * - Step numbering in both read-only and editable modes
 *
 * @example
 * ```typescript
 * // Read-only mode
 * <RecipePreparation
 *   testID="recipe-preparation"
 *   steps={recipe.preparation}
 *   mode="readOnly"
 * />
 *
 * // Editable mode
 * <RecipePreparation
 *   testID="recipe-preparation"
 *   steps={editableSteps}
 *   mode="editable"
 *   prefixText="Preparation :"
 *   onStepChange={(index, title, description) => updateStep(index, title, description)}
 *   onAddStep={() => addNewStep()}
 * />
 *
 * // Add mode with OCR support
 * <RecipePreparation
 *   testID="recipe-preparation"
 *   steps={[]}
 *   mode="add"
 *   prefixText="Preparation :"
 *   onStepChange={(index, title, description) => updateStep(index, title, description)}
 *   onAddStep={() => addNewStep()}
 *   openModal={() => openOCRScanner()}
 * />
 * ```
 */

import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { preparationStepElement } from '@customTypes/DatabaseElementTypes';
import { recipeTableStyles, recipeTextRenderStyles } from '@styles/recipeComponents';
import { RoundButton } from '@components/atomic/RoundButton';
import { Icons } from '@assets/Icons';
import { CustomTextInput } from '@components/atomic/CustomTextInput';
import { useI18n } from '@utils/i18n';

/**
 * Common props shared across all modes
 */
export type BaseProps = {
  /** Array of preparation step elements to display/edit */
  steps: preparationStepElement[];
};

/**
 * Props for read-only mode
 */
export type ReadOnlyProps = BaseProps & {
  mode: 'readOnly';
};

/**
 * Common props for editable and add modes
 */
export type EditableBaseProps = BaseProps & {
  /** Prefix text displayed above the steps */
  prefixText: string;
  /** Callback fired when a step title changes */
  onTitleChange: (index: number, title: string) => void;
  /** Callback fired when a step description changes */
  onDescriptionChange: (index: number, description: string) => void;
  /** Callback fired to add a new step */
  onAddStep: () => void;
};

/**
 * Props for editable mode
 */
export type EditableProps = EditableBaseProps & {
  mode: 'editable';
};

/**
 * Props for add mode (OCR)
 * Same as editable mode but with additional OCR button support for empty state
 */
export type AddProps = EditableBaseProps & {
  mode: 'add';
  /** Callback fired to open OCR modal (for empty state) */
  openModal: () => void;
};

/**
 * Props for the RecipePreparation component (discriminated union)
 */
export type RecipePreparationProps = ReadOnlyProps | EditableProps | AddProps;

const testID: string = 'RecipePreparation';

/**
 * Wrapper component with prefix text and container
 */
function PrefixTextWrapper({
  testID,
  prefixText,
  children,
}: {
  testID: string;
  prefixText: string;
  children: React.ReactNode;
}) {
  return (
    <View style={recipeTextRenderStyles.containerSection}>
      <Text
        testID={`${testID}::PrefixText`}
        variant={'headlineSmall'}
        style={recipeTextRenderStyles.containerElement}
      >
        {prefixText}
      </Text>
      {children}
    </View>
  );
}

/**
 * Read-only preparation steps component
 */
function ReadOnlyPreparation({ steps }: ReadOnlyProps) {
  const testId = testID + `::ReadOnlyStep`;
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
 * Individual editable step component with local state management
 */
function EditableStep({
  testID,
  index,
  item,
  onTitleChange,
  onDescriptionChange,
}: {
  testID: string;
  index: number;
  item: preparationStepElement;
  onTitleChange: (index: number, title: string) => void;
  onDescriptionChange: (index: number, description: string) => void;
}) {
  const testId = testID + `::EditableStep::${index}`;

  const { t } = useI18n();

  const handleTitleChange = (newTitle: string) => {
    if (newTitle !== item.title) {
      onTitleChange(index, newTitle);
    }
  };

  const handleDescriptionChange = (newDescription: string) => {
    if (newDescription !== item.description) {
      onDescriptionChange(index, newDescription);
    }
  };

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
          value={item.title}
          style={recipeTextRenderStyles.containerElement}
          onChangeText={handleTitleChange}
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
          value={item.description}
          onChangeText={handleDescriptionChange}
          multiline={true}
        />
      </View>
    </View>
  );
}

/**
 * Editable preparation steps component
 */
function EditablePreparation({
  steps,
  prefixText,
  onTitleChange,
  onDescriptionChange,
  onAddStep,
}: EditableProps) {
  return (
    <PrefixTextWrapper testID={testID} prefixText={prefixText}>
      {steps.map((item, index) => (
        <EditableStep
          key={index}
          testID={testID}
          index={index}
          item={item}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
        />
      ))}

      <RoundButton
        testID={`${testID}::AddButton`}
        size='medium'
        icon={Icons.plusIcon}
        onPressFunction={onAddStep}
        style={recipeTextRenderStyles.roundButtonPadding}
      />
    </PrefixTextWrapper>
  );
}

/**
 * Add preparation steps component (with OCR support)
 */
function AddPreparation(props: AddProps) {
  const { steps, prefixText, openModal, onAddStep } = props;

  if (steps.length === 0) {
    return (
      <PrefixTextWrapper testID={testID} prefixText={prefixText}>
        <View style={recipeTableStyles.roundButtonsContainer}>
          <RoundButton
            testID={`${testID}::OpenModal`}
            style={recipeTableStyles.roundButton}
            size='medium'
            icon={Icons.scanImageIcon}
            onPressFunction={openModal}
          />
          <RoundButton
            testID={`${testID}::AddButton`}
            style={recipeTableStyles.roundButton}
            size='medium'
            icon={Icons.pencilIcon}
            onPressFunction={onAddStep}
          />
        </View>
      </PrefixTextWrapper>
    );
  }

  return <EditablePreparation {...props} mode='editable' />;
}

/**
 * RecipePreparation component for preparation steps display and editing
 *
 * @param props - The component props
 * @returns JSX element representing the preparation steps
 */
export function RecipePreparation(props: RecipePreparationProps) {
  switch (props.mode) {
    case 'add':
      return <AddPreparation {...props} />;
    case 'readOnly':
      return <ReadOnlyPreparation {...props} />;
    case 'editable':
      return <EditablePreparation {...props} />;
  }
}

export default RecipePreparation;
