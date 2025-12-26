/**
 * VerticalBottomButtons - Expandable floating action button menu
 *
 * A sophisticated FAB menu component that provides quick access to recipe creation
 * actions. Features an expandable design that reveals multiple action buttons when
 * activated, including camera capture, gallery selection, and manual entry options.
 *
 * Key Features:
 * - Expandable/collapsible FAB menu design
 * - Four distinct recipe creation methods
 * - Integrated image capture and selection
 * - Automatic navigation to recipe creation screens
 * - Vertical stacking with calculated offsets
 * - Theme-aware styling and theming
 * - Smooth state transitions between collapsed/expanded
 *
 * @example
 * ```typescript
 * // Usage in main screens (typically Home screen)
 * <VerticalBottomButtons />
 *
 * // The component automatically handles:
 * // - Camera photo capture → Recipe creation from image
 * // - Gallery image selection → Recipe creation from image
 * // - Manual recipe creation → Empty recipe form
 * // - Menu expansion/collapse state management
 * ```
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useSafeCopilot } from '@hooks/useSafeCopilot';
import { useRecipeScraper } from '@hooks/useRecipeScraper';
import { CopilotStepData } from '@customTypes/TutorialTypes';
import { useI18n } from '@utils/i18n';
import { TUTORIAL_DEMO_INTERVAL, TUTORIAL_STEPS } from '@utils/Constants';
import { pickImage, takePhoto } from '@utils/ImagePicker';
import { Icons } from '@assets/Icons';
import { StackScreenNavigation } from '@customTypes/ScreenTypes';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { FAB, Portal, useTheme } from 'react-native-paper';
import { padding, screenHeight, screenWidth } from '@styles/spacing';
import { UrlInputDialog } from '@components/dialogs/UrlInputDialog';
import { AuthenticationDialog } from '@components/dialogs/AuthenticationDialog';

const MAIN_FAB_SIZE = 56;
const ACTION_BUTTON_SIZE = 40;
const ACTION_BUTTON_SPACING = 16;
const ACTION_BUTTON_COUNT = 4;

/** TestIDs for FAB elements - used for E2E testing */
const FAB_TEST_IDS = {
  expand: 'ExpandButton',
  reduce: 'ReduceButton',
  edit: 'RecipeEdit',
  url: 'UrlButton',
  gallery: 'GalleryButton',
  camera: 'CameraButton',
} as const;

/** Helper to create both testID and accessibilityLabel for iOS compatibility */
const fabTestProps = (id: string) => ({ testID: id, accessibilityLabel: id });

/**
 * VerticalBottomButtons component for expandable recipe creation menu
 *
 * @returns JSX element representing an expandable FAB menu for recipe creation actions
 */
const CopilotView = walkthroughable(View);

const testID = 'VerticalBottomButtons';

function VerticalBottomButtons() {
  const { navigate } = useNavigation<StackScreenNavigation>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const tabBarHeight = screenHeight / 9 + insets.bottom;
  const copilotWidth = screenWidth * 0.62;
  const copilotHeight =
    MAIN_FAB_SIZE + (ACTION_BUTTON_SIZE + ACTION_BUTTON_SPACING) * ACTION_BUTTON_COUNT;
  const copilotBottom = tabBarHeight - (ACTION_BUTTON_SIZE + 2 * ACTION_BUTTON_SPACING);

  const copilotData = useSafeCopilot();
  const copilotEvents = copilotData?.copilotEvents;
  const currentStep = copilotData?.currentStep;

  const [open, setOpen] = useState(false);
  const [urlDialogVisible, setUrlDialogVisible] = useState(false);
  const [authDialogVisible, setAuthDialogVisible] = useState(false);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFocused = useIsFocused();

  const {
    scrapeAndPrepare,
    scrapeWithAuth,
    isLoading: isScrapingLoading,
    error: scrapingError,
    clearError,
    authRequired,
    clearAuthRequired,
  } = useRecipeScraper();

  const stepOrder = TUTORIAL_STEPS.Home.order;

  useEffect(() => {
    if (!isFocused || !copilotData || !copilotEvents) {
      return;
    }

    function startDemo() {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
      demoIntervalRef.current = setInterval(() => {
        setOpen(prev => !prev);
      }, TUTORIAL_DEMO_INTERVAL);
    }

    function stopDemo() {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
        setOpen(false);
      }
    }

    function handleStepChange(step: CopilotStepData | undefined) {
      if (step?.order === stepOrder) {
        startDemo();
      } else {
        stopDemo();
      }
    }

    if (currentStep?.order === stepOrder) {
      startDemo();
    }

    copilotEvents.on('stepChange', handleStepChange);
    copilotEvents.on('stop', stopDemo);

    return () => {
      copilotEvents.off('stepChange', handleStepChange);
      copilotEvents.off('stop', stopDemo);
      stopDemo();
    };
  }, [isFocused, copilotData, copilotEvents, currentStep, stepOrder]);

  useEffect(() => {
    if (authRequired) {
      setUrlDialogVisible(false);
      setAuthDialogVisible(true);
    }
  }, [authRequired]);

  if (!isFocused) {
    return null;
  }

  async function takePhotoAndOpenNewRecipe() {
    openRecipeWithUri(await takePhoto(colors));
  }

  async function pickImageAndOpenNewRecipe() {
    openRecipeWithUri(await pickImage(colors));
  }

  function openRecipeWithUri(uri: string) {
    if (uri.length > 0) {
      navigate('Recipe', { mode: 'addFromPic', imgUri: uri });
    }
  }

  function handleOpenUrlDialog() {
    setOpen(false);
    setUrlDialogVisible(true);
  }

  function handleCloseUrlDialog() {
    setUrlDialogVisible(false);
    clearError();
  }

  async function handleUrlSubmit(url: string) {
    const result = await scrapeAndPrepare(url);
    if (result.success) {
      setUrlDialogVisible(false);
      navigate('Recipe', {
        mode: 'addFromScrape',
        scrapedData: result.data,
        sourceUrl: result.sourceUrl,
      });
    }
  }

  function handleCloseAuthDialog() {
    setAuthDialogVisible(false);
    clearAuthRequired();
    clearError();
  }

  async function handleAuthSubmit(username: string, password: string) {
    if (!authRequired) {
      return;
    }

    const result = await scrapeWithAuth(authRequired.url, username, password);
    if (result.success) {
      setAuthDialogVisible(false);
      navigate('Recipe', {
        mode: 'addFromScrape',
        scrapedData: result.data,
        sourceUrl: result.sourceUrl,
      });
    }
  }

  return (
    <View>
      {copilotData && (
        <View>
          <CopilotStep text={t('tutorial.home.description')} order={stepOrder} name={'Home'}>
            <CopilotView
              key='home-copilot-view'
              testID={'HomeTutorial'}
              style={{
                position: 'absolute',
                bottom: copilotBottom,
                right: padding.small,
                width: copilotWidth,
                height: copilotHeight,
                pointerEvents: 'none',
              }}
            />
          </CopilotStep>
        </View>
      )}
      <Portal>
        <FAB.Group
          open={open}
          visible
          icon={open ? Icons.minusIcon : Icons.plusIcon}
          {...fabTestProps(open ? FAB_TEST_IDS.reduce : FAB_TEST_IDS.expand)}
          actions={[
            {
              icon: Icons.pencilIcon,
              label: t('fab.addManually'),
              onPress: () => navigate('Recipe', { mode: 'addManually' }),
              ...fabTestProps(FAB_TEST_IDS.edit),
              style: { borderRadius: 999 },
              size: 'medium',
            },
            {
              icon: Icons.webIcon,
              label: t('fab.addFromUrl'),
              onPress: handleOpenUrlDialog,
              ...fabTestProps(FAB_TEST_IDS.url),
              style: { borderRadius: 999 },
              size: 'medium',
            },
            {
              icon: Icons.galleryIcon,
              label: t('fab.pickFromGallery'),
              onPress: () => pickImageAndOpenNewRecipe(),
              ...fabTestProps(FAB_TEST_IDS.gallery),
              style: { borderRadius: 999 },
              size: 'medium',
            },
            {
              icon: Icons.cameraIcon,
              label: t('fab.takePhoto'),
              onPress: () => takePhotoAndOpenNewRecipe(),
              ...fabTestProps(FAB_TEST_IDS.camera),
              style: { borderRadius: 999 },
              size: 'medium',
            },
          ]}
          onStateChange={({ open: isOpen }) => setOpen(isOpen)}
          fabStyle={{
            marginBottom: tabBarHeight,
            marginRight: padding.small,
            backgroundColor: colors.primaryContainer,
            borderRadius: 999,
          }}
          color={colors.onPrimaryContainer}
        />
      </Portal>
      <UrlInputDialog
        testId={testID}
        isVisible={urlDialogVisible}
        onClose={handleCloseUrlDialog}
        onSubmit={handleUrlSubmit}
        isLoading={isScrapingLoading}
        error={scrapingError}
      />
      <AuthenticationDialog
        testId={testID}
        isVisible={authDialogVisible}
        host={authRequired?.host ?? ''}
        onClose={handleCloseAuthDialog}
        onSubmit={handleAuthSubmit}
        isLoading={isScrapingLoading}
        error={scrapingError}
      />
    </View>
  );
}

export default VerticalBottomButtons;
