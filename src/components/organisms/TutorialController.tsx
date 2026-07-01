import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'react-native';
import { CopilotProvider, useCopilot } from 'react-native-copilot';
import { useNavigation } from '@react-navigation/native';
import { tutorialLogger } from '@utils/logger';
import { TabScreenNavigation } from '@customTypes/ScreenTypes';
import { CopilotStepData } from '@customTypes/TutorialTypes';
import { TutorialTooltip } from '@components/molecules/TutorialTooltip';
import { TutorialStepNumber } from '@components/molecules/TutorialStepNumber';
import { TUTORIAL_AUTO_START_DELAY, TUTORIAL_SPOTLIGHT_MARGIN } from '@utils/Constants';

export type TutorialProviderProps = {
  children: React.ReactNode;
  onComplete: () => void;
};

/**
 * TutorialManager - Internal component managing tutorial lifecycle and events
 *
 * Handles tutorial start/stop events, step changes, and auto-start functionality.
 * Integrates with navigation to ensure proper screen transitions during tutorial.
 *
 * @param props - Component props
 * @param props.onComplete - Callback fired when tutorial completes
 */
function TutorialManager({ onComplete }: Pick<TutorialProviderProps, 'onComplete'>) {
  const navigation = useNavigation<TabScreenNavigation>();
  const { start, copilotEvents, visible } = useCopilot();
  const hasAutoStartedRef = useRef(false);
  const startRef = useRef(start);
  useEffect(() => {
    startRef.current = start;
  });

  /**
   * Handles tutorial start event
   *
   * Logs tutorial initiation for analytics and debugging purposes.
   */
  const handleStart = () => {
    tutorialLogger.info('Tutorial started');
  };

  /**
   * Handles tutorial step change events
   *
   * Logs step transitions for debugging and analytics. Only logs when
   * step data is available to avoid undefined reference errors.
   *
   * @param step - Tutorial step data or undefined if no step
   */
  const handleStepChange = (step: CopilotStepData | undefined) => {
    if (step) {
      tutorialLogger.debug('Copilot step change', {
        name: step.name,
        order: step.order,
        text: step.text,
      });
    }
  };

  // Auto-start tutorial once when copilot is ready. `start` is read through a
  // ref and kept out of the deps: the library returns a new `start` each render,
  // and depending on it would re-run this effect and cancel the pending timer.
  useEffect(() => {
    if (!copilotEvents || visible || hasAutoStartedRef.current) {
      return;
    }

    hasAutoStartedRef.current = true;
    tutorialLogger.info('Starting tutorial on next tick');
    const timer = setTimeout(() => {
      startRef.current();
    }, TUTORIAL_AUTO_START_DELAY);

    return () => {
      clearTimeout(timer);
    };
  }, [copilotEvents, visible]);

  // Setup event listeners
  useEffect(() => {
    if (!copilotEvents) {
      return;
    }

    const handleStop = () => {
      tutorialLogger.info('Tutorial stopped');
      onComplete();
      setTimeout(() => {
        navigation.navigate('Home');
      }, 0);
    };

    copilotEvents.on('stepChange', handleStepChange);
    copilotEvents.on('stop', handleStop);
    copilotEvents.on('start', handleStart);

    return () => {
      copilotEvents.off('stepChange', handleStepChange);
      copilotEvents.off('stop', handleStop);
      copilotEvents.off('start', handleStart);
    };
  }, [copilotEvents, navigation, onComplete]);

  return null;
}

/**
 * TutorialProvider - Context provider for guided tutorial experience
 *
 * Wraps the app with react-native-copilot functionality to enable guided tutorials.
 * Manages tutorial state, step progression, and provides custom tooltip component.
 *
 * Features:
 * - Copilot provider integration with custom styling
 * - Tutorial step management and event handling
 * - Auto-start capability when copilot is ready
 * - Custom tooltip component with navigation controls
 * - Completion callback handling
 *
 * @param props - Component props
 * @param props.children - Child components to wrap with tutorial functionality
 * @param props.onComplete - Callback fired when tutorial is completed or stopped
 * @returns JSX element with tutorial provider wrapper
 */
export function TutorialProvider({ children, onComplete }: TutorialProviderProps) {
  const tooltipStyle = {
    margin: 0,
    padding: 0,
  };

  // With androidStatusBarVisible set, copilot measures targets a status-bar
  // height higher than the overlay draws, so push the spotlight down by that
  // exact amount. StatusBar.currentHeight is Android-only (undefined on iOS).
  const verticalOffset = StatusBar.currentHeight ?? 0;

  return (
    <CopilotProvider
      overlay='svg'
      animated={true}
      androidStatusBarVisible={true}
      margin={TUTORIAL_SPOTLIGHT_MARGIN}
      tooltipComponent={TutorialTooltip}
      stepNumberComponent={TutorialStepNumber}
      tooltipStyle={tooltipStyle}
      verticalOffset={verticalOffset}
    >
      {children}
      <TutorialManager onComplete={onComplete} />
    </CopilotProvider>
  );
}
