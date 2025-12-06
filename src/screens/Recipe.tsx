/**
 * Recipe Screen Module
 *
 * The main recipe screen component that handles viewing, editing, and creating recipes.
 * Supports four distinct operational modes:
 * - Read-only mode: View recipe details and add to shopping list
 * - Edit mode: Modify existing recipe data
 * - Manual add mode: Create new recipe from scratch
 * - OCR add mode: Create new recipe from photo using text recognition
 *
 * This screen manages complex state through custom hooks, handles recipe validation,
 * similarity detection, and integrates with SQLite database operations. It provides
 * a comprehensive UI for all recipe-related operations including image management,
 * ingredient handling, tag assignment, and preparation step organization.
 *
 * @module screens/Recipe
 */

import React from 'react';
import { RecipeScreenProp, recipeStateType } from '@customTypes/ScreenTypes';
import {
  isRecipeEqual,
  recipeColumnsNames,
  recipeTableElement,
} from '@customTypes/DatabaseElementTypes';
import { ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { padding } from '@styles/spacing';
import { RecipeImage } from '@components/organisms/RecipeImage';
import { RecipeText } from '@components/organisms/RecipeText';
import { RecipeIngredients } from '@components/organisms/RecipeIngredients';
import { RecipePreparation } from '@components/organisms/RecipePreparation';
import { RecipeTags } from '@components/organisms/RecipeTags';
import { clearCache } from '@utils/FileGestion';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
import { RecipeNumber } from '@components/organisms/RecipeNumber';
import { useTheme } from 'react-native-paper';
import { AppBar } from '@components/organisms/AppBar';
import { ModalImageSelect } from '@screens/ModalImageSelect';
import { cropImage } from '@utils/ImagePicker';
import { useI18n } from '@utils/i18n';
import { Alert } from '@components/dialogs/Alert';
import { getDefaultPersons } from '@utils/settings';
import { SimilarityDialog } from '@components/dialogs/SimilarityDialog';
import { RecipeNutrition } from '@components/organisms/RecipeNutrition';
import { recipeLogger, validationLogger } from '@utils/logger';
import { LoadingOverlay } from '@components/dialogs/LoadingOverlay';
import { ValidationQueue } from '@components/dialogs/ValidationQueue';
import BottomActionButton from '@components/atomic/BottomActionButton';

import { useRecipeIngredients } from '@hooks/useRecipeIngredients';
import { useRecipeTags } from '@hooks/useRecipeTags';
import { useRecipePreparation } from '@hooks/useRecipePreparation';
import { useRecipeOCR } from '@hooks/useRecipeOCR';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';
import { RecipeFormProvider, useRecipeForm } from '@context/RecipeFormContext';

import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import {
  buildRecipeDescriptionProps,
  buildRecipeImageProps,
  buildRecipeIngredientsProps,
  buildRecipeNutritionProps,
  buildRecipePersonsProps,
  buildRecipePreparationProps,
  buildRecipeTagsProps,
  buildRecipeTimeProps,
  buildRecipeTitleProps,
  getValidationButtonConfig,
  scaleRecipeForSave,
  validateRecipeData,
} from '@utils/RecipeFormHelpers';

const BUTTON_HEIGHT = 48;
const BUTTON_CONTAINER_HEIGHT = BUTTON_HEIGHT + padding.small * 2;

/**
 * Recipe Screen Component
 *
 * The primary screen component for viewing, editing, and creating recipes in the application.
 * Handles four operational modes with distinct behaviors and validation flows:
 *
 * - **Read-only mode**: Displays recipe details with option to add ingredients to shopping list
 * - **Edit mode**: Enables modification of existing recipe data with change detection
 * - **Manual add mode**: Supports creation of new recipes with manual data entry
 * - **OCR add mode**: Facilitates recipe creation from photos using text recognition
 *
 * Key features:
 * - Recipe validation with missing field detection
 * - Similarity detection to prevent duplicate recipes
 * - Automatic recipe scaling based on default persons setting
 * - OCR-based field extraction from images
 * - Tag and ingredient duplicate checking with fuzzy matching
 * - Shopping list integration
 * - Image cropping and management
 * - Nutritional information tracking
 *
 * @returns The rendered Recipe screen with appropriate mode-specific UI
 */
export function Recipe(screenProps: RecipeScreenProp) {
  const props: RecipePropType = screenProps.route.params;

  return (
    <RecipeFormProvider props={props}>
      <RecipeDialogsProvider>
        <RecipeContent {...screenProps} />
      </RecipeDialogsProvider>
    </RecipeFormProvider>
  );
}

function RecipeContent({ route, navigation }: RecipeScreenProp) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { addRecipe, editRecipe, deleteRecipe, addRecipeToShopping, findSimilarRecipes } =
    useRecipeDatabase();

  const recipeTestId = 'Recipe';
  const props: RecipePropType = route.params;

  const { state, setters, actions } = useRecipeForm();
  const dialogs = useRecipeDialogs();
  const tags = useRecipeTags();
  const ingredients = useRecipeIngredients();
  const preparation = useRecipePreparation();
  const ocr = useRecipeOCR();
  const validationButtonConfig = getValidationButtonConfig(state.stackMode, t);

  /**
   * Handles recipe deletion with user confirmation.
   *
   * Only available in read-only and edit modes. Displays a confirmation dialog
   * before permanently deleting the recipe from the database. Upon successful
   * deletion, shows a success message and navigates back to the previous screen.
   *
   * @async
   * @returns {Promise<void>} Resolves when deletion is complete or cancelled
   * @throws Will log warning if called from invalid mode (add modes)
   */
  async function onDelete() {
    if (state.stackMode !== recipeStateType.readOnly && state.stackMode !== recipeStateType.edit) {
      recipeLogger.warn('Delete operation not allowed in current mode', {
        stackMode: state.stackMode,
      });
      return;
    }

    dialogs.showValidationDialog({
      title: t('deleteRecipe'),
      content: t('confirmDelete'),
      confirmText: t('save'),
      cancelText: t('cancel'),
      onConfirm: async () => {
        // @ts-ignore params.recipe exist because we already checked with switch
        const success = await deleteRecipe(props.recipe);
        dialogs.showValidationDialog({
          title: t('deleteRecipe'),
          confirmText: t('ok'),
          onConfirm: () => navigation.goBack(),
          content: success
            ? t('deletedFromDatabase', { recipeName: state.recipeTitle })
            : `${t('errorOccurred')} ${t('deleteRecipe')} ${state.recipeTitle}`,
        });
      },
    });
  }

  /**
   * Handles validation action in read-only mode by adding recipe to shopping list.
   *
   * Creates a snapshot of the current recipe state (with any quantity scaling applied)
   * and adds all ingredients to the shopping list. Displays a success dialog and
   * navigates back upon completion.
   *
   * @async
   * @returns {Promise<void>} Resolves when recipe is added to shopping list
   */
  async function readOnlyValidation() {
    await addRecipeToShopping(actions.createRecipeSnapshot());
    dialogs.showValidationDialog({
      title: t('success'),
      content: t('addedToShoppingList', { recipeName: state.recipeTitle }),
      confirmText: t('ok'),
      onConfirm: () => navigation.goBack(),
    });
  }

  /**
   * Handles validation and saving of edited recipe data.
   *
   * Validates all required fields are present, then saves the modified recipe to the database.
   * Only updates the database if actual changes were detected by comparing with original recipe.
   * Automatically scales recipe quantities to match the default persons setting before saving.
   * Clears the image cache after successful save and switches screen to read-only mode.
   *
   * @async
   * @returns {Promise<void>} Resolves when recipe is saved or validation fails
   * @throws Will display validation error dialog if required fields are missing
   */
  async function editValidation() {
    const missingElem = validateRecipeData(state, t);

    if (missingElem.length > 0) {
      recipeLogger.warn('Validation failed, missing elements', { missingElements: missingElem });
      dialogs.showValidationErrorDialog(missingElem, t);
      return;
    }

    recipeLogger.info('Saving edited recipe to database', { recipeTitle: state.recipeTitle });
    const recipeToEdit = actions.createRecipeSnapshot();
    const originalRecipe = props.mode === 'edit' ? props.recipe : recipeToEdit;
    const defaultPersons = await getDefaultPersons();
    const scaledRecipe = scaleRecipeForSave(recipeToEdit, defaultPersons);

    if (!isRecipeEqual(originalRecipe, scaledRecipe)) {
      clearCache();
      await editRecipe(scaledRecipe);
    }

    setters.setStackMode(recipeStateType.readOnly);
    recipeLogger.info('Recipe edit completed successfully', { recipeTitle: state.recipeTitle });
    clearCache();
  }

  /**
   * Handles validation and creation of new recipe with duplicate detection.
   *
   * Validates all required fields are present, then checks for similar existing recipes
   * using fuzzy matching on title, ingredients, and tags. If similar recipes are found,
   * displays a warning dialog allowing the user to proceed or cancel. If no duplicates
   * exist, automatically adds the recipe to the database after scaling to default persons.
   *
   * The similarity check helps prevent accidental duplicate recipe entries while still
   * allowing intentional variations of similar recipes.
   *
   * @async
   * @returns {Promise<void>} Resolves when recipe is added or validation fails
   * @throws Will display validation error dialog if required fields are missing
   * @throws Will log error and show dialog if database operation fails
   */
  async function addValidation() {
    const missingElem = validateRecipeData(state, t);

    if (missingElem.length > 0) {
      dialogs.showValidationErrorDialog(missingElem, t);
      return;
    }

    const recipeToAdd = actions.createRecipeSnapshot();
    const similarRecipes = findSimilarRecipes(recipeToAdd);

    const addRecipeToDatabase = async () => {
      try {
        clearCache();
        const defaultPersons = await getDefaultPersons();
        const scaledRecipe = scaleRecipeForSave(recipeToAdd, defaultPersons);
        recipeLogger.info('Saving new recipe to database', { recipeTitle: state.recipeTitle });
        await addRecipe(scaledRecipe);
        recipeLogger.info('Recipe add completed successfully', { recipeTitle: state.recipeTitle });

        dialogs.showValidationDialog({
          title: t('addAnyway'),
          content: t('addedToDatabase', { recipeName: recipeToAdd.title }),
          confirmText: t('understood'),
          onConfirm: () => navigation.goBack(),
        });
      } catch (error) {
        validationLogger.error('Failed to validate and add recipe to database', {
          recipeTitle: state.recipeTitle,
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
          similarRecipes.map((r: recipeTableElement) => r.title).join(separator),
        confirmText: t('addAnyway'),
        cancelText: t('cancel'),
        onConfirm: addRecipeToDatabase,
      });
    }
  }

  /**
   * Routes validation action to the appropriate handler based on current screen mode.
   *
   * Determines which validation function to execute by examining the validation button
   * configuration type, which reflects the current operational mode of the screen:
   * - 'readOnly': Adds recipe ingredients to shopping list
   * - 'edit': Saves changes to existing recipe
   * - 'add': Creates new recipe with duplicate checking
   *
   * @async
   * @returns {Promise<void>} Resolves when the mode-specific validation completes
   */
  const validationFunction = async () => {
    switch (validationButtonConfig.type) {
      case 'readOnly':
        return readOnlyValidation();
      case 'edit':
        return editValidation();
      case 'add':
        return addValidation();
    }
  };

  /**
   * Handles cancellation of edit mode by resetting form to original values.
   *
   * Reverts all recipe form fields (title, ingredients, tags, preparation steps, etc.)
   * back to their original state when the screen was first loaded or when edit mode
   * was entered. This provides a safe way to discard unwanted changes without affecting
   * the stored recipe data.
   *
   * @returns {void}
   */
  function handleCancel() {
    actions.resetToOriginal();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar
        testID={recipeTestId}
        isEditing={state.stackMode === recipeStateType.edit}
        onGoBack={() => navigation.goBack()}
        onCancel={handleCancel}
        onValidate={validationFunction}
        onDelete={state.stackMode === recipeStateType.readOnly ? onDelete : undefined}
        onEdit={
          state.stackMode === recipeStateType.readOnly
            ? () => setters.setStackMode(recipeStateType.edit)
            : undefined
        }
      />

      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: BUTTON_CONTAINER_HEIGHT + insets.bottom }}
        keyboardShouldPersistTaps={'handled'}
        nestedScrollEnabled={true}
      >
        <RecipeImage
          {...buildRecipeImageProps(state.stackMode, state.recipeImage, ocr.openModalForField)}
        />
        <RecipeText
          {...buildRecipeTitleProps(
            state.stackMode,
            state.recipeTitle,
            setters.setRecipeTitle,
            ocr.openModalForField,
            t
          )}
        />
        <RecipeText
          {...buildRecipeDescriptionProps(
            state.stackMode,
            state.recipeDescription,
            setters.setRecipeDescription,
            ocr.openModalForField,
            t
          )}
        />
        <RecipeTags
          {...buildRecipeTagsProps(
            state.stackMode,
            state.recipeTags,
            state.randomTags,
            tags.addTag,
            tags.removeTag,
            ocr.openModalForField
          )}
        />
        <RecipeNumber
          {...buildRecipePersonsProps(
            state.stackMode,
            state.recipePersons,
            setters.setRecipePersons,
            ocr.openModalForField,
            t
          )}
        />
        <RecipeIngredients
          {...buildRecipeIngredientsProps(
            state.stackMode,
            state.recipeIngredients,
            ingredients.editIngredients,
            ingredients.addNewIngredient,
            ocr.openModalForField,
            t
          )}
        />
        <RecipeNumber
          {...buildRecipeTimeProps(
            state.stackMode,
            state.recipeTime,
            setters.setRecipeTime,
            ocr.openModalForField,
            t
          )}
        />
        <RecipePreparation
          {...buildRecipePreparationProps(
            state.stackMode,
            state.recipePreparation,
            preparation.editPreparationTitle,
            preparation.editPreparationDescription,
            preparation.addNewPreparationStep,
            ocr.openModalForField,
            t
          )}
        />
        <RecipeNutrition
          {...buildRecipeNutritionProps(
            state.stackMode,
            state.recipeNutrition,
            setters.setRecipeNutrition,
            ocr.openModalForField,
            recipeTestId
          )}
        />
      </ScrollView>

      {state.stackMode !== recipeStateType.edit && (
        <BottomActionButton
          testID={recipeTestId}
          onPress={async () => await validationFunction()}
          label={validationButtonConfig.text}
        />
      )}

      <Alert
        {...dialogs.validationDialogProp}
        isVisible={dialogs.isValidationDialogOpen}
        testId={'Recipe'}
        onClose={dialogs.hideValidationDialog}
      />

      {ocr.modalField && (
        <ModalImageSelect
          arrImg={state.imgForOCR}
          onSelectFunction={async (imgSelected: string) => {
            const croppedUri = await cropImage(imgSelected, colors);
            if (croppedUri.length > 0) {
              await ocr.fillOneField(croppedUri, ocr.modalField as recipeColumnsNames);
              ocr.closeModal();
            }
          }}
          onDismissFunction={ocr.closeModal}
          onImagesUpdated={ocr.addImageUri}
        />
      )}

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

      <LoadingOverlay
        visible={ocr.isProcessingOcrExtraction}
        message={t('extractingRecipeData')}
        testID='RecipeOcrLoading'
      />
    </SafeAreaView>
  );
}

export default Recipe;
