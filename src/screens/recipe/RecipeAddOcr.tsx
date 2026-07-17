/**
 * RecipeAddOcr - OCR-driven add recipe route.
 *
 * Forwards `{ mode: 'addFromPic', imgUri }` to `RecipeFormScreen` so the
 * form mounts with empty defaults. The shared screen owns the
 * `ModalImageSelect` mount and the screen-local image gallery; the OCR slot
 * only forwards the post-crop extraction trigger:
 *
 * - `onSelectOcrField`: invoked by the shared screen once the user selects
 *   and crops an image while a non-`image` target is active. Calls
 *   `useRecipeOCR().fillOneField` to run the extraction.
 *
 * The slot returns inline JSX for the OCR `LoadingOverlay` so the body
 * renders it without piping through a `setOverlay`-via-effect, avoiding an
 * infinite re-render loop when the OCR hook's returned object changes
 * identity each render.
 *
 * @module screens/recipe/RecipeAddOcr
 */

import React, { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StackScreenParamList } from '@customTypes/ScreenTypes';
import type { AddFromPicProp } from '@customTypes/RecipeNavigationTypes';
import { useRecipeOCR } from '@hooks/useRecipeOCR';
import { useRandomTagSuggestions } from '@hooks/useRandomTagSuggestions';
import { useI18n } from '@utils/i18n';
import { LoadingOverlay } from '@components/dialogs/LoadingOverlay';
import { FeatureHookSlotProps, RecipeFormScreen } from '@screens/recipe/RecipeFormScreen';

export type RecipeAddOcrProps = NativeStackScreenProps<StackScreenParamList, 'RecipeAddOcr'>;

/**
 * Renderless-except-for-overlay component invoked inside the form providers.
 * Wires the OCR hook's `fillOneField` into the shared `ModalImageSelect`
 * post-crop callback and renders a `LoadingOverlay` while extraction is in
 * flight.
 */
function OcrFeatureSlot({ setOnSelectOcrField }: FeatureHookSlotProps) {
  const { t } = useI18n();
  const ocr = useRecipeOCR();

  // setOnSelectOcrField is a stable ref-backed setter. Listing it in deps
  // does not cause re-runs; the effect re-runs only when the OCR hook
  // returns a new identity (each render of the parent), which is desired so
  // the latest `fillOneField` closure is registered.
  useEffect(() => {
    setOnSelectOcrField((croppedUri, target) => {
      void ocr.fillOneField(croppedUri, target);
    });
  }, [setOnSelectOcrField, ocr]);

  return (
    <LoadingOverlay
      visible={ocr.isProcessingOcrExtraction}
      message={t('extractingRecipeData')}
      testID='RecipeOcrLoading'
    />
  );
}

export function RecipeAddOcr({ route, navigation }: RecipeAddOcrProps) {
  const { imgUri } = route.params;
  const routeProps: AddFromPicProp = { mode: 'addFromPic', imgUri };
  const randomTags = useRandomTagSuggestions();

  return (
    <RecipeFormScreen
      mode='addFromPic'
      routeProps={routeProps}
      onSaveSuccess={() => navigation.goBack()}
      onGoBack={() => navigation.goBack()}
      onCancel={() => navigation.goBack()}
      FeatureHookSlot={OcrFeatureSlot}
      randomTags={randomTags}
      initialImgList={imgUri ? [imgUri] : []}
    />
  );
}
