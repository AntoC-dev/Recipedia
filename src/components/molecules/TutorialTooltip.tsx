import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeCopilot } from '@hooks/useSafeCopilot';
import { useI18n } from '@utils/i18n';
import { TabScreenNavigation } from '@customTypes/ScreenTypes';
import { TUTORIAL_STEPS } from '@utils/Constants';
import { padding } from '@styles/spacing';

/**
 * TutorialTooltip - Interactive tutorial overlay component
 *
 * Displays tutorial step content with navigation controls. Integrates with react-native-copilot
 * to provide guided tutorial experience with Previous/Next/Skip/Finish buttons.
 *
 * Features:
 * - Step-by-step navigation with screen transitions
 * - Automatic navigation state handling
 * - Customizable tooltip styling with Material Design
 * - Integration with copilot tutorial system
 *
 * @returns JSX element for tutorial tooltip overlay
 */
export function TutorialTooltip() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const navigation = useNavigation<TabScreenNavigation>();
  const copilotData = useSafeCopilot();

  if (!copilotData) {
    return null;
  }

  const { isLastStep, goToNext, goToPrev, stop, currentStep } = copilotData;

  /**
   * Helper function to find tutorial step configuration by order number
   *
   * @param order - The order number of the tutorial step to find
   * @returns Tutorial step configuration object
   * @throws Error if step with given order is not found
   */
  const findStepByOrder = (order: number) => {
    const screens = Object.values(TUTORIAL_STEPS);
    const step = screens.find(step => step.order === order);
    if (!step) {
      throw new Error(
        `Tutorial step with order ${order} not found. Check TUTORIAL_STEPS configuration.`
      );
    }
    return step;
  };

  /**
   * Gets the screen name for the next tutorial step
   *
   * @param currentOrder - Current step order number
   * @returns Screen name for the next step
   */
  const getNextScreen = (currentOrder: number) => {
    return findStepByOrder(currentOrder + 1).name;
  };

  /**
   * Gets the screen name for the previous tutorial step
   *
   * @param currentOrder - Current step order number
   * @returns Screen name for the previous step
   */
  const getPreviousScreen = (currentOrder: number) => {
    return findStepByOrder(currentOrder - 1).name;
  };

  // Don't render if no current step
  if (!currentStep) {
    return null;
  }

  // Calculate isFirstStep from order, not library's broken calculation
  const isFirstStep = currentStep.order === 1;

  /**
   * Handles advancing to the next tutorial step
   *
   * Navigates to the next screen in the tutorial sequence and sets up
   * step advancement to occur after navigation completes. Uses deferred
   * execution to ensure proper timing with navigation state changes.
   */
  const handleNext = async () => {
    if (!currentStep) {
      return;
    }

    const nextScreen = getNextScreen(currentStep.order);
    if (!nextScreen) {
      return;
    }

    goToNext().then(() => {
      navigation.navigate(nextScreen);
    });
  };

  /**
   * Handles going back to the previous tutorial step
   *
   * Navigates to the previous screen in the tutorial sequence and sets up
   * step regression to occur after navigation completes. Uses deferred
   * execution to ensure proper timing with navigation state changes.
   */
  const handlePrevious = async () => {
    if (!currentStep) {
      return;
    }

    const previousScreen = getPreviousScreen(currentStep.order);
    if (!previousScreen) {
      return;
    }

    goToPrev().then(() => {
      navigation.navigate(previousScreen);
    });
  };

  // From copilot source files, see that they add 15 padding to tooltip
  const paddingOfCopilot = 15;

  const testId = 'TutorialTooltip';

  return (
    <Card
      accessible={false}
      testID={testId}
      mode='elevated'
      style={{
        //   Remove the padding to let the card filling the tooltip
        marginHorizontal: -paddingOfCopilot,
        marginTop: -paddingOfCopilot,
      }}
    >
      <Card.Content>
        <Text testID={testId + '::Text'} variant='bodyMedium'>
          {currentStep?.text}
        </Text>
      </Card.Content>

      <Card.Actions
        style={{
          justifyContent: 'space-between',
          paddingVertical: padding.small,
          paddingHorizontal: padding.medium,
        }}
      >
        {!isFirstStep && (
          <Button
            testID={testId + '::Previous'}
            mode='text'
            onPress={handlePrevious}
            textColor={colors.primary}
            compact
          >
            {t('tutorial.previous')}
          </Button>
        )}

        <View style={{ flexDirection: 'row', gap: padding.medium }}>
          <Button
            testID={testId + '::Skip'}
            mode='text'
            onPress={stop}
            textColor={colors.outline}
            compact
          >
            {t('tutorial.skip')}
          </Button>

          <Button
            testID={testId + '::Next'}
            mode='contained'
            onPress={isLastStep ? stop : handleNext}
            buttonColor={colors.primary}
            textColor={colors.onPrimary}
            compact
          >
            {isLastStep ? t('tutorial.finish') : t('tutorial.next')}
          </Button>
        </View>
      </Card.Actions>
    </Card>
  );
}

export default TutorialTooltip;
