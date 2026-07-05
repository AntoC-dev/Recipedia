/**
 * RecipeFormScreen - Shared form body used by every editable recipe route.
 *
 * Owns RHF's `<FormProvider>`, the `RecipeDialogsProvider`, the
 * `IngredientFocusProvider`, and the screen-wide `ModalImageSelect` mount.
 * The image-select modal is shared infrastructure (every editable route has
 * an image button) so it lives here rather than per-route. Routes layer
 * route-specific behaviour on top via a `FeatureHookSlot`:
 *
 * - `RecipeAddOcr` overrides `openModalForField` so the modal opens for OCR
 *   targets (ingredient names, quantities, etc.), and supplies an
 *   `onSelectOcrField` callback that crops the image and runs OCR extraction.
 * - `RecipeAddScrape` mounts `useRecipeScraperValidation` so it runs once on
 *   screen open. No image-modal customisation.
 *
 * Routes that don't customise the modal (`RecipeEdit`, `RecipeAddManual`)
 * get the default behaviour: tapping the image button opens the modal,
 * selecting an image writes it to `recipeImage` via the form, and (in edit
 * mode) `autoSelect` lets a gallery/camera pick bypass the gallery picker
 * step.
 *
 * Feature hooks that depend on `useFormContext` (`useRecipeOCR`,
 * `useRecipeScraperValidation`) cannot live in the wrapper — they would
 * crash because the form context is unavailable above the provider. The
 * shared body exposes a `FeatureHookSlot` that runs inside the providers.
 *
 * @module screens/recipe/RecipeFormScreen
 */

import React, { ReactNode, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { FieldErrors, FormProvider, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  isRecipeEqual,
  recipeColumnsNames,
  recipeTableElement,
} from '@customTypes/DatabaseElementTypes';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
import { padding } from '@styles/spacing';
import { clearCache } from '@utils/FileGestion';
import { useRecipes } from '@hooks/useRecipes';
import { AppBar } from '@components/organisms/AppBar';
import { useI18n } from '@utils/i18n';
import { Alert } from '@components/dialogs/Alert';
import { ValidationQueue } from '@components/dialogs/ValidationQueue';
import { SimilarityDialog } from '@components/dialogs/SimilarityDialog';
import { ModalImageSelect } from '@screens/ModalImageSelect';
import { cropImage } from '@utils/ImagePicker';
import { getDefaultPersons } from '@utils/settings';
import { recipeLogger, validationLogger } from '@utils/logger';
import { BottomActionButton } from '@components/atomic/BottomActionButton';

import { useRecipeTags } from '@hooks/useRecipeTags';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';
import { recipeFormSchema } from '@schemas/recipeFormSchema';
import { buildDefaultsFromRecipe } from '@screens/recipe/defaults/buildDefaultsFromRecipe';
import { buildDefaultsFromScrape } from '@screens/recipe/defaults/buildDefaultsFromScrape';
import { buildEmptyDefaults } from '@screens/recipe/defaults/buildEmptyDefaults';

import {
  convertModeFromProps,
  getServingsScaledFrom,
  getValidationButtonConfig,
  scaleRecipeForSave,
} from '@utils/RecipeFormHelpers';
import { createRecipeSnapshot } from '@screens/recipe/helpers/createRecipeSnapshot';
import { RECIPE_TEST_ID } from '@screens/recipe/constants';
import {
  IngredientFocusProvider,
  useIngredientFocusRef,
} from '@screens/recipe/IngredientFocusContext';
import { useScalingOnPersonsChange } from '@screens/recipe/hooks/useScalingOnPersonsChange';
import {
  collectMissingElementsFromErrors,
  markAllRecipeFieldsTouched,
} from '@utils/recipeFormErrors';
import type { RecipeFormInput } from '@schemas/recipeFormSchema';
import {
  RecipeDescriptionField,
  RecipeImageField,
  RecipeTitleField,
} from '@screens/recipe/fields/IdentityFields';
import { RecipeTagsField } from '@screens/recipe/fields/TagsField';
import { RecipePersonsField, RecipeTimeField } from '@screens/recipe/fields/QuantityFields';
import { RecipeNutritionField } from '@screens/recipe/fields/NutritionField';
import { RecipeIngredientsField } from '@screens/recipe/fields/IngredientsField';
import { IngredientArrayActionsProvider } from '@screens/recipe/fields/IngredientArrayActionsContext';
import { RecipePreparationField } from '@screens/recipe/fields/PreparationField';
import type { OcrModalTarget } from '@utils/OCR';

const BUTTON_HEIGHT = 48;
const BUTTON_CONTAINER_HEIGHT = BUTTON_HEIGHT + padding.small * 2;

/**
 * Identifies which editable route is being rendered. Drives the AppBar
 * configuration, the validate handler, and the post-save navigation choice.
 */
export type RecipeFormMode = 'edit' | 'addManually' | 'addFromPic' | 'addFromScrape';

/**
 * Hooks routes can mount inside the form providers. Routes use this to
 * connect feature hooks (`useRecipeOCR`, `useRecipeScraperValidation`) that
 * depend on `useFormContext`.
 *
 * The body owns `ModalImageSelect`, the modal-target state, and the
 * screen-local image gallery. The slot only forwards a callback that runs
 * when the user picks an image for a non-`image` OCR target:
 *
 * - `onSelectOcrField`: invoked when the user selects an image while a
 *   non-`image` (OCR) target is active. Receives the cropped URI plus the
 *   OCR target enum. Slots not wired to OCR may ignore this.
 *
 * Inline-rendered overlay (rather than the previous `setOverlay`-via-effect
 * pattern) avoids an infinite re-render loop: when the slot's hook returned
 * a fresh object identity each render, a `setOverlay(<JSX/>)` effect
 * triggered another parent render, which produced another slot render, and
 * so on. Returning JSX directly side-steps the state write entirely.
 */
export interface FeatureHookSlotProps {
  setOnSelectOcrField: (fn: (croppedUri: string, target: OcrModalTarget) => void) => void;
}

export interface RecipeFormScreenProps {
  /**
   * Route identity, used to drive validate/save/cancel handlers and to map
   * field props that still read `stackMode` (derived locally via
   * `convertModeFromProps`).
   */
  mode: RecipeFormMode;
  /**
   * Original navigation params. Used both to compute initial form values via
   * `buildInitialFormValues` and as the route-identity tag passed down to
   * field components that still read the stackMode enum.
   */
  routeProps: RecipePropType;
  /**
   * Called after a successful save. Edit routes navigate.replace to
   * `RecipeView` with the saved recipe; add routes just `goBack`. The wrapper
   * supplies whichever behaviour fits. `scaledFromServings` is the serving
   * count the user entered when the save normalized the recipe's quantities to
   * the stored default — edit routes forward it so `RecipeView` can surface a
   * scaling notice.
   */
  onSaveSuccess: (savedRecipe: recipeTableElement, scaledFromServings?: number) => void;
  /**
   * Called when the user taps Back. Add routes call `navigation.goBack()`;
   * edit routes typically also `goBack` so the underlying View stays on top.
   */
  onGoBack: () => void;
  /**
   * Called when the user taps Cancel in edit mode. Edit wrapper navigates
   * back to `RecipeView`; other routes never expose Cancel so this is a noop
   * elsewhere.
   */
  onCancel: () => void;
  /**
   * Optional renderless component invoked inside the form providers. Routes
   * use it to mount feature hooks (OCR, scraper validation) that depend on
   * `useFormContext`.
   */
  FeatureHookSlot?: (props: FeatureHookSlotProps) => ReactNode;
  /**
   * Random tag-name suggestions surfaced as examples in the tags field's
   * explanation text. Computed once at route mount via
   * `useTags().searchRandomlyTags`. All edit/add routes pass these; when
   * omitted it defaults to `[]` (no examples shown).
   */
  randomTags?: string[];
  /**
   * Initial gallery for the screen-owned `ModalImageSelect`. OCR routes seed
   * this with the navigation prop's `imgUri` so the user can re-pick it.
   * Other routes leave this empty; entries arrive via the modal's
   * camera/gallery buttons through `onImagesUpdated`.
   */
  initialImgList?: string[];
}

const recipeFormResolver = zodResolver(recipeFormSchema);

function buildInitialFormValues(routeProps: RecipePropType): RecipeFormInput {
  switch (routeProps.mode) {
    case 'readOnly':
    case 'edit':
      return buildDefaultsFromRecipe(routeProps.recipe);
    case 'addFromScrape':
      return buildDefaultsFromScrape(routeProps.scrapedData);
    case 'addManually':
    case 'addFromPic':
    default:
      return buildEmptyDefaults();
  }
}

/**
 * Shared editable recipe-form screen. Owns RHF's `FormProvider`, mounts the
 * dialogs context and the ingredient focus counter, then renders the field
 * tree inside `RecipeFormBody`.
 */
export function RecipeFormScreen(props: RecipeFormScreenProps) {
  const defaultValuesRef = useRef<RecipeFormInput | null>(null);
  if (defaultValuesRef.current === null) {
    defaultValuesRef.current = buildInitialFormValues(props.routeProps);
  }
  const form = useForm<RecipeFormInput>({
    resolver: recipeFormResolver,
    defaultValues: defaultValuesRef.current,
    mode: 'onTouched',
  });

  return (
    <FormProvider {...form}>
      <RecipeDialogsProvider>
        <IngredientFocusProvider>
          <IngredientArrayActionsProvider>
            <RecipeFormBody {...props} />
          </IngredientArrayActionsProvider>
        </IngredientFocusProvider>
      </RecipeDialogsProvider>
    </FormProvider>
  );
}

function RecipeFormBody({
  mode,
  routeProps,
  onSaveSuccess,
  onGoBack,
  onCancel,
  FeatureHookSlot,
  randomTags: randomTagsProp,
  initialImgList,
}: RecipeFormScreenProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isScrolling, setIsScrolling] = useState(false);
  const [modalTarget, setModalTarget] = useState<OcrModalTarget | null>(null);
  const [imgList, setImgList] = useState<string[]>(() => initialImgList ?? []);
  const slotOnSelectOcrFieldRef = useRef<
    ((croppedUri: string, target: OcrModalTarget) => void) | null
  >(null);

  const { addRecipe, editRecipe, findSimilarRecipes } = useRecipes();

  const form = useFormContext<RecipeFormInput>();
  const randomTags = randomTagsProp ?? [];
  const stackMode = convertModeFromProps(mode);
  const dialogs = useRecipeDialogs();
  const tags = useRecipeTags();
  const editingIngredientCountRef = useIngredientFocusRef();
  useScalingOnPersonsChange(form, form.getValues('recipePersons'), editingIngredientCountRef);

  /** Opens the shared image-select modal targeting the given OCR field. */
  const openModalForField = (field: OcrModalTarget) => {
    setModalTarget(field);
  };

  // Baseline tracks the most recent persisted recipe. Initialised from the
  // navigation prop in edit mode; subsequent saves replace it so a later
  // edit→cancel restores the just-saved values (locked by
  // `8_edit_save_edit_cancel_restores_saved.yaml`).
  const baselineRef = useRef<recipeTableElement | null>(
    routeProps.mode === 'edit' || routeProps.mode === 'readOnly' ? routeProps.recipe : null
  );
  const fallbackSourceUrl = routeProps.mode === 'addFromScrape' ? routeProps.sourceUrl : undefined;
  /** Snapshots the current form values into a `recipeTableElement`, carrying the baseline's non-form fields. */
  const buildSnapshot = () => createRecipeSnapshot(form, baselineRef.current, fallbackSourceUrl);

  const validationButtonConfig = getValidationButtonConfig(stackMode, t);
  const isEditMode = mode === 'edit';

  /**
   * Runs the zod resolver via `handleSubmit`. On failure, force-touches every
   * field, collects the missing-element messages, and opens the validation
   * error dialog. Returns whether the form is valid.
   */
  async function runFormValidation(): Promise<boolean> {
    recipeLogger.debug('Running form validation', { mode });
    let isValid = false;
    let collectedErrors: FieldErrors<RecipeFormInput> = {};
    await form.handleSubmit(
      () => {
        isValid = true;
      },
      submittedErrors => {
        collectedErrors = submittedErrors as FieldErrors<RecipeFormInput>;
      }
    )();
    if (!isValid) {
      markAllRecipeFieldsTouched(form);
      const missingElem = collectMissingElementsFromErrors(collectedErrors, t);
      recipeLogger.warn('Validation failed, missing elements', {
        missingElements: missingElem,
        errorFields: Object.keys(collectedErrors),
      });
      dialogs.showValidationErrorDialog(missingElem, t);
      return false;
    }
    return true;
  }

  /**
   * Edit-mode save: validates, then persists only when the scaled snapshot
   * differs from the original recipe. Re-syncs the form + baseline to the
   * saved row and clears the image cache before handing off to `onSaveSuccess`.
   */
  async function editValidation() {
    try {
      const isValid = await runFormValidation();
      if (!isValid) return;

      recipeLogger.info('Saving edited recipe to database', {
        recipeTitle: form.getValues('recipeTitle'),
      });
      const recipeToEdit = buildSnapshot();
      const originalRecipe = routeProps.mode === 'edit' ? routeProps.recipe : recipeToEdit;
      const defaultPersons = await getDefaultPersons();
      const scaledRecipe = scaleRecipeForSave(recipeToEdit, defaultPersons);

      let savedRecipe = recipeToEdit;
      let scaledFromServings: number | undefined;
      if (!isRecipeEqual(originalRecipe, scaledRecipe)) {
        savedRecipe = await editRecipe(scaledRecipe);
        scaledFromServings = getServingsScaledFrom(recipeToEdit.persons, defaultPersons);
        form.reset(
          { ...form.getValues(), recipeImage: savedRecipe.image_Source },
          { keepTouched: true, keepSubmitCount: true }
        );

        baselineRef.current = savedRecipe;
      }

      clearCache();
      onSaveSuccess(savedRecipe, scaledFromServings);
    } catch (error) {
      recipeLogger.error('editValidation failed with unexpected error', { error });
    }
  }

  /**
   * Add-mode save: validates, checks for similar existing recipes, and either
   * adds straight away or prompts an "add anyway" confirmation when matches are
   * found. The actual insert lives in `addRecipeToDatabase`.
   */
  async function addValidation() {
    const isValid = await runFormValidation();
    if (!isValid) return;

    const recipeToAdd = buildSnapshot();
    const similarRecipes = findSimilarRecipes(recipeToAdd);

    /** Scales + inserts the recipe, then surfaces a success or failure dialog. */
    const addRecipeToDatabase = async () => {
      try {
        const defaultPersons = await getDefaultPersons();
        const scaledRecipe = scaleRecipeForSave(recipeToAdd, defaultPersons);
        recipeLogger.info('Saving new recipe to database', {
          recipeTitle: form.getValues('recipeTitle'),
        });
        await addRecipe(scaledRecipe);
        clearCache();
        recipeLogger.info('Recipe add completed successfully', {
          recipeTitle: form.getValues('recipeTitle'),
        });

        dialogs.showValidationDialog({
          title: t('addAnyway'),
          content: t('addedToDatabase', { recipeName: recipeToAdd.title }),
          confirmText: t('understood'),
          onConfirm: () => onSaveSuccess(scaledRecipe),
        });
      } catch (error) {
        validationLogger.error('Failed to validate and add recipe to database', {
          recipeTitle: form.getValues('recipeTitle'),
          error,
        });
        dialogs.showValidationDialog({
          title: t('error'),
          content:
            t('failedToAddRecipe', { recipeName: recipeToAdd.title }) +
            '\n\n' +
            (error instanceof Error ? error.message : String(error)),
          confirmText: t('ok'),
          onConfirm: () => dialogs.hideValidationDialog(),
        });
      }
    };

    if (similarRecipes.length === 0) {
      await addRecipeToDatabase();
    } else {
      const separator = '\n\t- ';
      dialogs.showValidationDialog({
        title: t('similarRecipeFound'),
        content:
          t('similarRecipeFoundContent') +
          separator +
          similarRecipes.map(r => r.title).join(separator),
        confirmText: t('addAnyway'),
        cancelText: t('cancel'),
        onConfirm: addRecipeToDatabase,
      });
    }
  }

  /** Top-level validate handler wired to the AppBar / bottom button: dismisses the keyboard then routes to edit or add save. */
  const validationFunction = async () => {
    // UX: close the keyboard before opening any post-validation dialog so the
    // dialog doesn't have to fight the keyboard for screen space. All inputs
    // (text, numeric, dropdown) now live-commit per keystroke, so the form is
    // already in sync with what the user has typed — the dismiss is no longer
    // load-bearing for correctness (state-input consistency invariant, §3.8).
    Keyboard.dismiss();
    if (isEditMode) {
      return editValidation();
    }
    return addValidation();
  };

  // Edit mode: tapping a gallery thumbnail in the modal commits immediately
  // without the crop step (legacy behaviour locked by tests). Other modes
  // still pop the crop UI for OCR targets via the slot.
  const modalAutoSelect = isEditMode;

  /**
   * Handles an image picked in the modal. Image targets write `recipeImage`
   * (cropping first in non-edit modes); every other (OCR) target crops then
   * forwards to the slot's `onSelectOcrField` extraction callback.
   */
  async function handleModalSelect(imgSelected: string) {
    const target = modalTarget;
    setModalTarget(null);
    if (target === null) return;
    recipeLogger.debug('Image selected from modal', { target, imgSelected });

    if (target === recipeColumnsNames.image) {
      if (isEditMode) {
        // Edit mode: write the chosen gallery URI directly. autoSelect=true
        // makes a fresh camera/gallery pick skip the crop step too.
        form.setValue('recipeImage', imgSelected);
        return;
      }
      // Non-OCR add modes (addManually / addFromScrape) pick from gallery
      // through the modal too. Run cropImage before committing so the result
      // matches the legacy non-edit path.
      const croppedUri = await cropImage(imgSelected, colors);
      if (croppedUri.length === 0) return;
      form.setValue('recipeImage', croppedUri);
      return;
    }

    // OCR targets (ingredientNames, ingredientQuantities, title, description,
    // …): defer to the slot's OCR pipeline after cropping.
    const croppedUri = await cropImage(imgSelected, colors);
    if (croppedUri.length === 0) return;
    if (slotOnSelectOcrFieldRef.current) {
      slotOnSelectOcrFieldRef.current(croppedUri, target);
    }
  }

  /** Closes the image-select modal, clearing the active OCR target. */
  function handleModalDismiss() {
    setModalTarget(null);
  }

  /** Appends a newly captured/picked image URI to the screen-local gallery (deduped). */
  function handleModalImagesUpdated(uri: string) {
    setImgList(prev => (prev.includes(uri) ? prev : [...prev, uri]));
  }

  // Stabilise slotProps across re-renders so a slot can list these setters
  // in useEffect deps without looping. Each setter writes into a ref, so
  // the wrappers are referentially fixed for the screen's lifetime.
  const slotPropsRef = useRef<FeatureHookSlotProps | null>(null);
  if (slotPropsRef.current === null) {
    slotPropsRef.current = {
      setOnSelectOcrField: fn => {
        slotOnSelectOcrFieldRef.current = fn;
      },
    };
  }
  const slotProps = slotPropsRef.current;

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top}
      >
        <AppBar
          testID={RECIPE_TEST_ID}
          isEditing={isEditMode}
          onGoBack={onGoBack}
          onCancel={onCancel}
          onValidate={validationFunction}
        />

        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{ paddingBottom: BUTTON_CONTAINER_HEIGHT + insets.bottom }}
          keyboardShouldPersistTaps={'handled'}
          keyboardDismissMode='on-drag'
          nestedScrollEnabled={true}
          onScrollBeginDrag={() => setIsScrolling(true)}
          onScrollEndDrag={() => setIsScrolling(false)}
          onMomentumScrollEnd={() => setIsScrolling(false)}
        >
          <RecipeImageField
            form={form}
            stackMode={stackMode}
            openModalForField={openModalForField}
          />
          <RecipeTitleField
            form={form}
            stackMode={stackMode}
            openModalForField={openModalForField}
            t={t}
          />
          <RecipeDescriptionField
            form={form}
            stackMode={stackMode}
            openModalForField={openModalForField}
            t={t}
          />
          <RecipeTagsField
            form={form}
            stackMode={stackMode}
            randomTags={randomTags}
            addTag={tags.addTag}
            removeTag={tags.removeTag}
            openModalForField={openModalForField}
            hideDropdown={isScrolling}
          />
          <RecipePersonsField
            form={form}
            stackMode={stackMode}
            openModalForField={openModalForField}
            t={t}
          />
          <RecipeIngredientsField
            form={form}
            stackMode={stackMode}
            openModalForField={openModalForField}
            t={t}
            hideDropdown={isScrolling}
          />
          <RecipeTimeField
            form={form}
            stackMode={stackMode}
            openModalForField={openModalForField}
            t={t}
          />
          <RecipePreparationField
            form={form}
            stackMode={stackMode}
            openModalForField={openModalForField}
            t={t}
          />
          <RecipeNutritionField
            form={form}
            stackMode={stackMode}
            openModalForField={openModalForField}
            parentTestId={RECIPE_TEST_ID}
            t={t}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {!isEditMode && (
        <BottomActionButton
          testID={RECIPE_TEST_ID}
          onPress={async () => await validationFunction()}
          label={validationButtonConfig.text}
        />
      )}

      <Alert
        {...dialogs.validationDialogProp}
        isVisible={dialogs.isValidationDialogOpen}
        testId={RECIPE_TEST_ID}
        onClose={dialogs.hideValidationDialog}
      />

      {dialogs.similarityDialog.item && (
        <SimilarityDialog
          testId={`Recipe${dialogs.similarityDialog.item.type}Similarity`}
          isVisible={dialogs.similarityDialog.isVisible}
          onClose={dialogs.hideSimilarityDialog}
          item={dialogs.similarityDialog.item}
        />
      )}

      {dialogs.validationQueue && (
        <ValidationQueue
          {...dialogs.validationQueue}
          onComplete={dialogs.clearValidationQueue}
          testId='RecipeValidation'
        />
      )}

      {modalTarget !== null && (
        <ModalImageSelect
          arrImg={imgList}
          autoSelect={modalAutoSelect}
          onSelectFunction={handleModalSelect}
          onDismissFunction={handleModalDismiss}
          onImagesUpdated={handleModalImagesUpdated}
        />
      )}

      {FeatureHookSlot ? <FeatureHookSlot {...slotProps} /> : null}
    </ScreenWrapper>
  );
}

export default RecipeFormScreen;
