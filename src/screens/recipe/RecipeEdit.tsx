/**
 * RecipeEdit - Edit-existing-recipe route.
 *
 * Thin wrapper around `RecipeFormScreen` that:
 * - Forwards the existing recipe so the screen can seed the form defaults
 *   and own the persisted baseline used for post-save snapshots.
 * - On save success, `navigation.replace`s to `RecipeView` with the saved
 *   recipe so the readonly snapshot underneath is up-to-date.
 * - On cancel, `goBack`s — the underlying `RecipeView` is still on the stack
 *   from the View → Edit `push`.
 *
 * @module screens/recipe/RecipeEdit
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StackScreenParamList } from '@customTypes/ScreenTypes';
import type { EditRecipeProp } from '@customTypes/RecipeNavigationTypes';
import { RecipeFormScreen } from '@screens/recipe/RecipeFormScreen';
import { useRandomTagSuggestions } from '@hooks/useRandomTagSuggestions';

export type RecipeEditProps = NativeStackScreenProps<StackScreenParamList, 'RecipeEdit'>;

export function RecipeEdit({ route, navigation }: RecipeEditProps) {
  const { recipe } = route.params;
  const routeProps: EditRecipeProp = { mode: 'edit', recipe };
  const randomTags = useRandomTagSuggestions();

  return (
    <RecipeFormScreen
      mode='edit'
      routeProps={routeProps}
      onSaveSuccess={savedRecipe => {
        navigation.replace('RecipeView', { recipe: savedRecipe });
      }}
      onGoBack={() => navigation.goBack()}
      onCancel={() => navigation.goBack()}
      randomTags={randomTags}
    />
  );
}

export default RecipeEdit;
