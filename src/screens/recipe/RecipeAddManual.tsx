/**
 * RecipeAddManual - Manual-add recipe route.
 *
 * Empty-form add wrapper. Forwards `{ mode: 'addManually' }` to
 * `RecipeFormScreen` so the form starts blank (with `getDefaultPersonsSync`
 * seeded into `recipePersons`). On save success, `goBack`s.
 *
 * @module screens/recipe/RecipeAddManual
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StackScreenParamList } from '@customTypes/ScreenTypes';
import type { AddManuallyProp } from '@customTypes/RecipeNavigationTypes';
import { RecipeFormScreen } from '@screens/recipe/RecipeFormScreen';
import { useRandomTagSuggestions } from '@hooks/useRandomTagSuggestions';

export type RecipeAddManualProps = NativeStackScreenProps<StackScreenParamList, 'RecipeAddManual'>;

export function RecipeAddManual({ navigation }: RecipeAddManualProps) {
  const routeProps: AddManuallyProp = { mode: 'addManually' };
  const randomTags = useRandomTagSuggestions();

  return (
    <RecipeFormScreen
      mode='addManually'
      routeProps={routeProps}
      onSaveSuccess={() => navigation.goBack()}
      onGoBack={() => navigation.goBack()}
      onCancel={() => navigation.goBack()}
      randomTags={randomTags}
    />
  );
}
