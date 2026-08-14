import React, { useEffect, useState } from 'react';
import { RootNavigator } from '@navigation/RootNavigator';
import { WelcomeScreen } from '@screens/WelcomeScreen';
import { TutorialProvider } from './TutorialController';
import { isFirstLaunch, markAsLaunched } from '@utils/firstLaunch';
import { appLogger, tutorialLogger } from '@utils/logger';
import { deleteOldLogFiles } from '@utils/BugReport';
import { useRecipes } from '@hooks/useRecipes';
import { useMenu } from '@hooks/useMenu';
import { useIngredients } from '@hooks/useIngredients';
import { useTags } from '@hooks/useTags';

enum AppMode {
  Loading = 'loading',
  Welcome = 'welcome',
  Tutorial = 'tutorial',
  Ready = 'ready',
}

/**
 * AppWrapper - Root application component managing app initialization and modes
 *
 * Controls the main application flow including first-time user experience,
 * tutorial mode, and normal app operation. Handles state transitions between
 * different app modes based on user actions and first launch detection.
 *
 * App Modes:
 * - Loading: Initial state while checking first launch
 * - Welcome: First-time user onboarding screen
 * - Tutorial: Guided tutorial with sample data
 * - Ready: Normal app operation
 *
 * Features:
 * - First launch detection and onboarding
 * - Tutorial mode with pre-populated shopping list
 * - Shopping list reset on app launch
 * - State management for app flow
 * - Decode integrity: a corrupt row found while decoding any cached table is
 *   rethrown here during render, so the root error boundary shows the recovery
 *   screen instead of the app running on silently truncated data. Every table's
 *   hook is read, so the throw does not depend on which slice happens to notify.
 *   Development and E2E builds only — `decodeError` is always null in production.
 *
 * @returns JSX element representing the current app mode
 */
export default function AppWrapper() {
  const { recipes, decodeError: recipesDecodeError } = useRecipes();
  const {
    clearMenu,
    addRecipeToMenu,
    toggleMenuItemCooked,
    decodeError: menuDecodeError,
  } = useMenu();
  const { decodeError: ingredientsDecodeError } = useIngredients();
  const { decodeError: tagsDecodeError } = useTags();
  const [mode, setMode] = useState<AppMode>(AppMode.Loading);

  const decodeError =
    recipesDecodeError ?? menuDecodeError ?? ingredientsDecodeError ?? tagsDecodeError;
  if (decodeError) {
    throw decodeError;
  }

  useEffect(() => {
    deleteOldLogFiles();
    void isFirstLaunch().then(isFirst => {
      if (isFirst) {
        appLogger.info('First launch detected - showing welcome screen');
        setMode(AppMode.Welcome);
      } else {
        appLogger.debug('Not first launch - proceeding to main app');
        setMode(AppMode.Ready);
      }
    });
  }, []);

  /**
   * Handles normal app launch initialization
   *
   * Resets shopping list, marks app as launched, and transitions to ready mode.
   * This function is called both for normal app launch and after tutorial completion.
   */
  const handleAppLaunch = async () => {
    await clearMenu();
    tutorialLogger.info('App launch - resetting menu');
    setMode(AppMode.Ready);
    await markAsLaunched();
  };

  /**
   * Handles tutorial mode initialization
   *
   * Prepares the app for tutorial by adding sample recipes to the menu.
   * This ensures the tutorial has meaningful data to demonstrate the
   * Menu and Shopping screen features.
   */
  const handleStartTutorial = async () => {
    const recipesToAdd = recipes.slice(0, 3);
    for (const recipe of recipesToAdd) {
      await addRecipeToMenu(recipe);
    }
    // Mark first menu item as cooked to show both "To Cook" and "Cooked" sections
    await toggleMenuItemCooked(1);
    tutorialLogger.info(
      'Added recipes to menu for tutorial (1 cooked, 3 to cook)',
      recipesToAdd.map(r => r.title)
    );
    setMode(AppMode.Tutorial);
  };

  /**
   * Handles welcome screen skip action
   *
   * Bypasses the tutorial and proceeds directly to normal app operation.
   * Calls handleAppLaunch to perform standard initialization.
   */
  const handleSkipWelcome = () => {
    void handleAppLaunch();
    appLogger.info('Welcome skipped - proceeding to main app');
  };

  /**
   * Handles tutorial completion
   *
   * Transitions from tutorial mode to normal app operation after tutorial
   * is completed. Performs same initialization as normal app launch.
   */
  const handleTutorialComplete = () => {
    void handleAppLaunch();
    appLogger.info('Tutorial completed successfully');
  };

  switch (mode) {
    case AppMode.Welcome:
      return (
        <WelcomeScreen
          onStartTutorial={() => void handleStartTutorial()}
          onSkip={handleSkipWelcome}
        />
      );

    case AppMode.Tutorial:
      return (
        <TutorialProvider onComplete={handleTutorialComplete}>
          <RootNavigator />
        </TutorialProvider>
      );

    case AppMode.Ready:
      return <RootNavigator />;

    case AppMode.Loading:
    default:
      return null;
  }
}
