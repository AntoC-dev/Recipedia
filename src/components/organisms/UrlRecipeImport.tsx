/**
 * UrlRecipeImport - URL and authentication dialogs that import a recipe from a web page
 *
 * Owns the whole URL import flow: the URL dialog, the scrape, the authentication
 * dialog for sites that require a login, and the navigation to `RecipeAddScrape`
 * on success. Used by the home FAB menu and by recipes shared from other apps.
 *
 * When `initialUrl` is provided, the dialog opens pre-filled and the scrape starts
 * right away; on failure the user can edit the URL and retry.
 *
 * Shown whenever mounted. Mounting warms up the scraper (Pyodide on iOS), so mount
 * it only when the flow starts.
 *
 * @example
 * ```typescript
 * {urlDialogVisible && (
 *   <UrlRecipeImport
 *     testId='VerticalBottomButtons'
 *     onClose={() => setUrlDialogVisible(false)}
 *   />
 * )}
 * ```
 */

import React, { useEffect, useEffectEvent } from 'react';
import { StackActions, useNavigation } from '@react-navigation/native';
import { ScrapeResult, useRecipeScraper } from '@hooks/useRecipeScraper';
import { StackScreenNavigation } from '@customTypes/ScreenTypes';
import { UrlInputDialog } from '@components/dialogs/UrlInputDialog';
import { AuthenticationDialog } from '@components/dialogs/AuthenticationDialog';

/**
 * Props for UrlRecipeImport component.
 */
export type UrlRecipeImportProps = {
  /** Prefix for the dialogs' testIDs */
  testId: string;
  /** URL to pre-fill and import immediately when the flow opens */
  initialUrl?: string;
  /** Called when the flow ends, whether imported or cancelled */
  onClose: () => void;
};

/**
 * UrlRecipeImport component for importing a recipe from a URL.
 *
 * @param props - Component props
 * @returns JSX element with the URL and authentication dialogs
 */
export function UrlRecipeImport({ testId, initialUrl, onClose }: UrlRecipeImportProps) {
  const navigation = useNavigation<StackScreenNavigation>();
  const {
    scrapeAndPrepare,
    scrapeWithAuth,
    isLoading,
    error,
    clearError,
    authRequired,
    clearAuthRequired,
  } = useRecipeScraper();
  const authDialogVisible = authRequired !== null;

  function openScrapedRecipe(result: ScrapeResult) {
    if (!result.success) {
      return;
    }
    onClose();
    navigation.dispatch(
      StackActions.push('RecipeAddScrape', {
        scrapedData: result.data,
        sourceUrl: result.sourceUrl,
      })
    );
  }

  async function importUrl(url: string) {
    openScrapedRecipe(await scrapeAndPrepare(url));
  }

  async function importWithCredentials(url: string, username: string, password: string) {
    openScrapedRecipe(await scrapeWithAuth(url, username, password));
  }

  const importInitialUrl = useEffectEvent((url: string) => {
    void importUrl(url);
  });

  useEffect(() => {
    if (initialUrl) {
      importInitialUrl(initialUrl);
    }
  }, [initialUrl]);

  function close() {
    clearAuthRequired();
    clearError();
    onClose();
  }

  return (
    <>
      <UrlInputDialog
        testId={testId}
        isVisible={!authDialogVisible}
        onClose={close}
        onSubmit={url => void importUrl(url)}
        isLoading={isLoading}
        error={error}
        initialUrl={initialUrl}
      />
      <AuthenticationDialog
        testId={testId}
        isVisible={authDialogVisible}
        host={authRequired?.host ?? ''}
        onClose={close}
        onSubmit={(username, password) =>
          authRequired && void importWithCredentials(authRequired.url, username, password)
        }
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}
