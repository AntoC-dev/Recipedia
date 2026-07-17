import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeCopilot } from '@hooks/useSafeCopilot';
import { useI18n } from '@utils/i18n';
import { TabScreenNavigation } from '@customTypes/ScreenTypes';
import {
  getNextTutorialScreen,
  getPreviousTutorialScreen,
  isFirstTutorialStep,
  isLastTutorialStep,
  SELF_ADVANCING_TUTORIAL_SCREEN,
} from '@utils/Tutorial';
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

  const { goToNext, goToPrev, stop, currentStep } = copilotData;

  // Don't render if no current step
  if (!currentStep) {
    return null;
  }

  const isFirstStep = isFirstTutorialStep(currentStep.order);
  const isLastStep = isLastTutorialStep(currentStep.order);

  /**
   * Navigates to a tutorial screen, then moves the copilot step. The Search
   * screen is the exception: its spotlight target is measured at runtime and is
   * only correct once focused, so it advances the step itself once ready (see
   * Search screen). Every other screen uses a stable proxy, safe to move now.
   *
   * @param screen - Destination screen, or undefined at a sequence boundary
   * @param moveStep - Copilot step mover (goToNext / goToPrev)
   */
  const navigateToStep = (
    screen: ReturnType<typeof getNextTutorialScreen>,
    moveStep: () => void
  ) => {
    if (!screen) {
      return;
    }
    navigation.navigate(screen);
    if (screen !== SELF_ADVANCING_TUTORIAL_SCREEN) {
      moveStep();
    }
  };

  const handleNext = () => navigateToStep(getNextTutorialScreen(currentStep.order), goToNext);
  const handlePrevious = () =>
    navigateToStep(getPreviousTutorialScreen(currentStep.order), goToPrev);

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
        <Text
          testID={testId + '::Text'}
          variant='bodyMedium'
          accessible
          accessibilityLiveRegion='polite'
        >
          {currentStep.text}
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
