/**
 * RecipeEdit - Edit-existing-recipe route.
 *
 * Thin wrapper around `RecipeFormScreen` that:
 * - Forwards the existing recipe so the screen can seed the form defaults
 *   and own the persisted baseline used for post-save snapshots.
 * - On save success, rewrites the stack to drop both this Edit route and the
 *   now-stale `RecipeView` it was pushed from, landing on a fresh `RecipeView`
 *   for the saved recipe. Back from there returns to whatever preceded the
 *   original view (e.g. Search), not to a stale duplicate view.
 * - On cancel, `goBack`s — the underlying `RecipeView` is still on the stack
 *   from the View → Edit `push`.
 *
 * @module screens/recipe/RecipeEdit
 */

import React from 'react';
import { CommonActions } from '@react-navigation/native';
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
      onSaveSuccess={(savedRecipe, scaledFromServings) => {
        navigation.dispatch(state => {
          const routes = [
            ...state.routes.slice(0, -2),
            { name: 'RecipeView', params: { recipe: savedRecipe, scaledFromServings } },
          ];
          return CommonActions.reset({ ...state, routes, index: routes.length - 1 });
        });
      }}
      onGoBack={() => navigation.goBack()}
      onCancel={() => navigation.goBack()}
      randomTags={randomTags}
    />
  );
}

export default RecipeEdit;
