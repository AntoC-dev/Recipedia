/**
 * IncomingShareImporter - Imports recipes shared to Recipedia from other apps
 *
 * Listens to content shared through the system share sheet and routes it into the
 * existing import flows:
 * - image → `RecipeAddOcr`
 * - web page URL → URL import dialog, scrape starts immediately → `RecipeAddScrape`
 * - anything else → snackbar explaining the content can't be imported
 *
 * Import screens are pushed on top of the current stack, so a recipe being edited
 * when the share arrives is kept underneath.
 *
 * Checks for a share when mounted (cold start) and each time the app returns to the
 * foreground (warm share). Rendered once, next to the root stack navigator.
 */

import React, { useEffect, useEffectEvent, useState } from 'react';
import { AppState } from 'react-native';
import { StackActions, useNavigation } from '@react-navigation/native';
import { Portal, Snackbar } from 'react-native-paper';
import { StackScreenNavigation } from '@customTypes/ScreenTypes';
import { SharedImport, takeSharedImport } from '@utils/SharedContent';
import { useI18n } from '@utils/i18n';
import { uiLogger } from '@utils/logger';
import { UrlRecipeImport } from '@components/organisms/UrlRecipeImport';

const testId = 'IncomingShare';

/**
 * IncomingShareImporter component for recipes shared from other apps.
 *
 * @returns JSX element with the URL import dialogs and the unsupported-content snackbar
 */
export function IncomingShareImporter() {
  const navigation = useNavigation<StackScreenNavigation>();
  const { t } = useI18n();
  const [sharedUrl, setSharedUrl] = useState<string | undefined>();
  const [unsupportedVisible, setUnsupportedVisible] = useState(false);

  const openSharedImport = useEffectEvent((sharedImport: SharedImport | undefined) => {
    if (!sharedImport) {
      return;
    }
    uiLogger.info('Received shared content', { kind: sharedImport.kind });
    switch (sharedImport.kind) {
      case 'image':
        setSharedUrl(undefined);
        navigation.dispatch(StackActions.push('RecipeAddOcr', { imgUri: sharedImport.uri }));
        break;
      case 'url':
        setSharedUrl(sharedImport.url);
        break;
      case 'unsupported':
        setUnsupportedVisible(true);
        break;
    }
  });

  useEffect(() => {
    function importSharedContent() {
      takeSharedImport()
        .then(openSharedImport)
        .catch(error => uiLogger.warn('Failed to read shared content', { error }));
    }

    importSharedContent();
    const subscription = AppState.addEventListener('change', appState => {
      if (appState === 'active') {
        importSharedContent();
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <>
      {sharedUrl && (
        <UrlRecipeImport
          key={sharedUrl}
          testId={testId}
          isVisible
          initialUrl={sharedUrl}
          onClose={() => setSharedUrl(undefined)}
        />
      )}
      <Portal>
        <Snackbar
          testID={testId + '::UnsupportedSnackbar'}
          visible={unsupportedVisible}
          onDismiss={() => setUnsupportedVisible(false)}
        >
          {t('shareImport.unsupported')}
        </Snackbar>
      </Portal>
    </>
  );
}
