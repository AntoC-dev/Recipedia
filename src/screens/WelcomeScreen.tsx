/**
 * WelcomeScreen - Branded onboarding screen with tutorial introduction
 *
 * A comprehensive welcome screen that introduces users to the app with branded visuals,
 * feature highlights, and tutorial options. Features the app icon, dynamic app name,
 * key functionality overview, and call-to-action buttons for starting the tutorial.
 *
 * Key Features:
 * - **Branded Header**: App icon from Expo assets with dynamic app name from config
 * - **Feature Showcase**: Visual list of main app capabilities with icons
 * - **Tutorial Integration**: Start tutorial or skip to main app functionality
 * - **Responsive Design**: App icon scales with screen size for different devices
 * - **Theme Awareness**: Full Material Design 3 integration with theme colors
 * - **Internationalization**: Complete i18n support for all text content
 *
 * Visual Structure:
 * - **Header**: Circular app icon + app name + subtitle
 * - **Features Card**: Elevated card with key app functionality overview
 * - **Actions**: Primary "Start Tour" button + secondary "Skip" option
 *
 * Design Patterns:
 * - Primary background color creates immersive branded experience
 * - Elevated card provides content hierarchy and focus
 * - Consistent spacing and typography throughout
 * - Accessible design with proper contrast and touch targets
 *
 * @example
 * ```typescript
 * // Basic usage in app onboarding flow
 * <WelcomeScreen
 *   onStartTutorial={() => setShowTutorial(true)}
 *   onSkip={() => navigateToMain()}
 * />
 *
 * // Integration with tutorial system
 * const handleStartTutorial = () => {
 *   setTutorialStarted(true);
 *   navigation.navigate('Tabs', { screen: 'Home' });
 * };
 *
 * const handleSkip = () => {
 *   setOnboardingComplete(true);
 *   navigation.navigate('Tabs');
 * };
 * ```
 */

import React, { useEffect, useState } from 'react';
import { useResetOnChange } from '@hooks/useResetOnChange';
import { FlatList, View } from 'react-native';
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
import { Button, Card, Dialog, IconButton, Portal, Text, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { appLogger, tutorialLogger } from '@utils/logger';
import { CustomImage } from '@components/atomic/CustomImage';
import { Asset } from 'expo-asset';
import { padding, screenWidth } from '@styles/spacing';
import { IconName, Icons } from '@assets/Icons';
import Constants from 'expo-constants';
import { LoadingOverlay } from '@components/dialogs/LoadingOverlay';
import { useRecipes } from '@hooks/useRecipes';
import { loadFirstLaunchDataset } from '@utils/datasetInitializer';
import { useScraper } from '@app/modules/recipe-scraper';

/**
 * Props for the WelcomeScreen component
 */
export type WelcomeScreenProps = {
  /** Callback fired when user chooses to start the tutorial */
  onStartTutorial: () => void;
  /** Callback fired when user chooses to skip the tutorial */
  onSkip: () => void;
};

/**
 * WelcomeScreen component - Branded onboarding with tutorial introduction
 *
 * @param props - The component props with tutorial navigation callbacks
 * @returns JSX element representing the welcome and onboarding interface
 */
export function WelcomeScreen({ onStartTutorial, onSkip }: WelcomeScreenProps) {
  const { colors, fonts } = useTheme();
  const { t } = useI18n();
  const { recipes } = useRecipes();
  const { initError: scraperInitError } = useScraper();
  const isDataLoaded = recipes.length > 0;
  const [initErrors, setInitErrors] = useState<string[]>([]);
  const [datasetFailed, setDatasetFailed] = useState(false);
  const dismissInitErrors = () => setInitErrors([]);
  const canProceed = isDataLoaded || datasetFailed;

  const [pendingAction, setPendingAction] = useState<'tutorial' | 'skip' | null>(null);

  useEffect(() => {
    if (isDataLoaded) {
      return;
    }

    const id = setTimeout(() => {
      void (async () => {
        try {
          await loadFirstLaunchDataset();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const fullDetails =
            error instanceof Error
              ? `${error.message}${error.stack ? `\n${error.stack}` : ''}`
              : typeof error === 'object'
                ? JSON.stringify(error, null, 2)
                : String(error);
          appLogger.error('Dataset loading failed - app will work without initial data', {
            error: fullDetails,
          });
          setInitErrors(prev => [...prev, errorMessage]);
          setDatasetFailed(true);
        }
      })();
    }, 0);
    return () => clearTimeout(id);
  }, [isDataLoaded]);

  useResetOnChange([scraperInitError], () => {
    if (scraperInitError) {
      setInitErrors(prev => {
        const msg = t('welcome.pyodideError');
        if (prev.includes(msg)) return prev;
        return [...prev, msg];
      });
    }
  });

  useEffect(() => {
    if (canProceed && pendingAction) {
      if (pendingAction === 'tutorial') {
        tutorialLogger.info(
          datasetFailed
            ? 'Dataset failed - starting tutorial without initial data'
            : 'Data loaded - proceeding with tutorial'
        );
        onStartTutorial();
      } else {
        tutorialLogger.info(
          datasetFailed
            ? 'Dataset failed - skipping to main app'
            : 'Data loaded - proceeding to main app'
        );
        onSkip();
      }
      // Clears the one-shot trigger after performing the deferred navigation.
      // This must run in an effect: the action waits on `canProceed` becoming
      // true and fires imperative navigation, which cannot happen during render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingAction(null);
    }
  }, [canProceed, datasetFailed, pendingAction, onStartTutorial, onSkip]);

  const handleStartTutorial = () => {
    if (canProceed) {
      tutorialLogger.info('User started tutorial from welcome screen');
      onStartTutorial();
    } else {
      tutorialLogger.info('User requested tutorial - waiting for data to load');
      setPendingAction('tutorial');
    }
  };

  const handleSkip = () => {
    if (canProceed) {
      tutorialLogger.info('User skipped tutorial from welcome screen');
      onSkip();
    } else {
      tutorialLogger.info('User requested skip - waiting for data to load');
      setPendingAction('skip');
    }
  };

  type Feature = { icon: IconName; text: string };
  const featuresList: Feature[] = [
    { icon: Icons.searchIcon, text: t('welcome.features.find') },
    { icon: Icons.plusIcon, text: t('welcome.features.add') },
    { icon: Icons.webIcon, text: t('welcome.features.import') },
    { icon: Icons.shoppingUnselectedIcon, text: t('welcome.features.shopping') },
  ];
  const startTourFont = fonts.titleMedium;
  const iconSize = screenWidth / 4;

  const testId = 'WelcomeScreen';
  const cardTestId = testId + '::Card';

  return (
    <ScreenWrapper backgroundColor={colors.primary}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            padding: padding.large,
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              alignItems: 'center',
            }}
          >
            <View style={{ marginBottom: padding.small }}>
              <CustomImage
                uri={Asset.fromModule(require('../assets/app/icon.png')).uri}
                backgroundColor={colors.surface}
                size={iconSize}
                circular
                testID={testId + '::AppIcon'}
              />
            </View>

            <Text
              testID={testId + '::Title'}
              variant='headlineLarge'
              style={{
                textAlign: 'center',
                color: colors.onPrimary,
              }}
            >
              {Constants.expoConfig?.name}
            </Text>

            <Text
              testID={testId + '::Subtitle'}
              variant='titleMedium'
              style={{
                color: colors.onPrimary,
                opacity: 0.8,
              }}
            >
              {t('welcome.subtitle')}
            </Text>
          </View>

          <Card mode='elevated' accessible={false} testID={cardTestId}>
            <Card.Content>
              <Text
                variant='titleMedium'
                testID={cardTestId + '::Title'}
                style={{ color: colors.onSurface }}
              >
                {t('welcome.valueTitle')}
              </Text>

              <FlatList
                data={featuresList}
                scrollEnabled={false}
                renderItem={({ item, index }) => {
                  const featureTestId = cardTestId + '::FeaturesList::' + index;
                  return (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <IconButton
                        icon={item.icon}
                        iconColor={colors.primary}
                        testID={featureTestId + '::Icon'}
                      />
                      <Text
                        variant='bodyMedium'
                        style={{ color: colors.onSurface }}
                        testID={featureTestId + '::Text'}
                      >
                        {item.text}
                      </Text>
                    </View>
                  );
                }}
              />
            </Card.Content>
          </Card>

          <View style={{ gap: padding.small }}>
            <Button
              testID={testId + '::StartTourButton'}
              mode='contained'
              onPress={handleStartTutorial}
              style={{ backgroundColor: colors.secondary, paddingVertical: padding.medium }}
              labelStyle={{
                fontSize: startTourFont.fontSize,
                fontWeight: startTourFont.fontWeight,
              }}
            >
              {t('welcome.startTour')}
            </Button>

            <Button
              testID={testId + '::SkipButton'}
              mode='text'
              onPress={handleSkip}
              style={{ alignSelf: 'center' }}
              textColor={colors.onPrimary}
            >
              {t('welcome.skip')}
            </Button>
          </View>
        </View>
      </View>
      <LoadingOverlay
        visible={pendingAction !== null && !canProceed}
        message={t('welcome.loadingData')}
        testID={testId + '::LoadingOverlay'}
      />
      <Portal>
        <Dialog
          visible={initErrors.length > 0}
          onDismiss={dismissInitErrors}
          testID={testId + '::InitErrorDialog'}
        >
          <Dialog.Icon icon={Icons.alertWithCircle} />
          <Dialog.Title>{t('welcome.datasetError.title')}</Dialog.Title>
          <Dialog.Content>
            <Text variant='bodyMedium'>{t('welcome.datasetError.message')}</Text>
            <Text variant='bodySmall' style={{ marginTop: padding.small, opacity: 0.7 }}>
              {t('welcome.datasetError.reportHint')}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={dismissInitErrors} testID={testId + '::InitErrorDialog::OK'}>
              {t('welcome.datasetError.understood')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScreenWrapper>
  );
}
