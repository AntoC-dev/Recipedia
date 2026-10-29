import React from 'react';
import { Text } from 'react-native';
import { render, RenderOptions } from '@testing-library/react-native';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';

export const IMAGE_MODAL_TARGET_TEST_ID = 'ImageModalTarget';

function ImageModalTargetProbe() {
  const { imageModalTarget } = useRecipeDialogs();
  return <Text testID={IMAGE_MODAL_TARGET_TEST_ID}>{imageModalTarget ?? 'none'}</Text>;
}

export function RecipeDialogsHarness({ children }: { children: React.ReactNode }) {
  return (
    <RecipeDialogsProvider>
      {children}
      <ImageModalTargetProbe />
    </RecipeDialogsProvider>
  );
}

export function renderWithRecipeDialogs(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options, wrapper: RecipeDialogsHarness });
}
