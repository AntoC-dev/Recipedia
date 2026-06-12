/**
 * RecipeAddScrape - Web-scraper-driven add recipe route.
 *
 * Forwards `{ mode: 'addFromScrape', scrapedData, sourceUrl }` to
 * `RecipeFormScreen` so the form is pre-filled from the scraped payload.
 * Mounts `useRecipeScraperValidation` via the form screen's `FeatureHookSlot`
 * because the hook depends on `useFormContext` + `useRecipeDialogs`.
 *
 * @module screens/recipe/RecipeAddScrape
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StackScreenParamList } from '@customTypes/ScreenTypes';
import type { AddFromScrapeProp } from '@customTypes/RecipeNavigationTypes';
import { useRecipeScraperValidation } from '@hooks/useRecipeScraperValidation';
import { useRandomTagSuggestions } from '@hooks/useRandomTagSuggestions';
import { RecipeFormScreen } from '@screens/recipe/RecipeFormScreen';

export type RecipeAddScrapeProps = NativeStackScreenProps<StackScreenParamList, 'RecipeAddScrape'>;

/**
 * Renderless component invoked inside the form providers. Mounts the
 * scraper-validation effect so it runs once on screen open.
 */
function ScrapeFeatureSlot() {
  useRecipeScraperValidation();
  return null;
}

export function RecipeAddScrape({ route, navigation }: RecipeAddScrapeProps) {
  const { scrapedData, sourceUrl } = route.params;
  const routeProps: AddFromScrapeProp = {
    mode: 'addFromScrape',
    scrapedData,
    sourceUrl,
  };
  const randomTags = useRandomTagSuggestions();

  return (
    <RecipeFormScreen
      mode='addFromScrape'
      routeProps={routeProps}
      onSaveSuccess={() => navigation.goBack()}
      onGoBack={() => navigation.goBack()}
      onCancel={() => navigation.goBack()}
      FeatureHookSlot={ScrapeFeatureSlot}
      randomTags={randomTags}
    />
  );
}

export default RecipeAddScrape;
