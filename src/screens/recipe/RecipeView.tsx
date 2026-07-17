/**
 * RecipeView - Readonly recipe screen.
 *
 * Renders an existing `recipeTableElement` from navigation params using the
 * existing organism components in their readonly form. Does NOT mount RHF,
 * OCR, scraper validation, the validation queue, or `RecipeFormContext` —
 * the readonly path pays only for the render layer.
 *
 * Two actions live on this route:
 * - Delete (AppBar trash button) — confirms then calls `useRecipes().deleteRecipe`.
 * - Add to menu (Bottom action button) — pushes the recipe onto `useMenu`.
 *
 * Edit handoff: the AppBar pencil button calls `navigation.push('RecipeEdit',
 * { recipe })`. When the user finishes editing the form, the Edit route rewrites
 * the stack so this now-stale view is replaced by a fresh `RecipeView` for the
 * saved recipe, so the view always shows the latest persisted snapshot and Back
 * skips the pre-edit duplicate.
 *
 * @module screens/recipe/RecipeView
 */

import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Snackbar, useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StackScreenParamList, recipeStateType } from '@customTypes/ScreenTypes';
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
import { padding } from '@styles/spacing';
import { useRecipes } from '@hooks/useRecipes';
import { useMenu } from '@hooks/useMenu';
import { AppBar } from '@components/organisms/AppBar';
import { useI18n } from '@utils/i18n';
import { Alert } from '@components/dialogs/Alert';
import { recipeLogger } from '@utils/logger';
import { BottomActionButton } from '@components/atomic/BottomActionButton';
import { RecipeImage } from '@components/organisms/RecipeImage';
import { RecipeText } from '@components/organisms/RecipeText';
import { RecipeTags } from '@components/organisms/RecipeTags';
import { RecipeNumber } from '@components/organisms/RecipeNumber';
import { RecipeIngredients } from '@components/organisms/RecipeIngredients';
import { RecipePreparation } from '@components/organisms/RecipePreparation';
import { RecipeNutrition } from '@components/organisms/RecipeNutrition';
import { RecipeSourceUrl } from '@components/molecules/RecipeSourceUrl';
import {
  buildRecipeDescriptionProps,
  buildRecipeImageProps,
  buildRecipeNutritionProps,
  buildRecipePersonsProps,
  buildRecipeSourceUrlProps,
  buildRecipeTagsProps,
  buildRecipeTimeProps,
  buildRecipeTitleProps,
} from '@utils/RecipeFormHelpers';
import { noop, RECIPE_TEST_ID } from '@screens/recipe/constants';

const BUTTON_HEIGHT = 48;
const BUTTON_CONTAINER_HEIGHT = BUTTON_HEIGHT + padding.small * 2;

// The scaling notice stays until the user explicitly dismisses it — it reports
// that stored quantities differ from what was just entered, which the user
// must not miss. A long duration plus a dismiss action keeps it on screen
// rather than auto-hiding after a few seconds.
const SCALING_NOTICE_DURATION = 3_600_000;

/** This screen always renders in read-only mode. */
const stackMode = recipeStateType.readOnly;

export type RecipeViewProps = NativeStackScreenProps<StackScreenParamList, 'RecipeView'>;

/**
 * Readonly recipe view. Mounts no RHF, no OCR, no scraper validation —
 * pays only for the render layer.
 */
export function RecipeView({ route, navigation }: RecipeViewProps) {
  const { recipe, scaledFromServings } = route.params;
  const { t } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [scalingNoticeVisible, setScalingNoticeVisible] = useState(scaledFromServings != null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<{
    title: string;
    content?: string;
    confirmText: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const { deleteRecipe } = useRecipes();
  const { addRecipeToMenu } = useMenu();

  /** Stores the given dialog config and opens the confirmation `Alert`. */
  const showDialog = (props: NonNullable<typeof dialogProps>) => {
    setDialogProps(props);
    setIsDialogOpen(true);
  };

  /** Closes the confirmation `Alert` without clearing its last config. */
  const hideDialog = () => setIsDialogOpen(false);

  /**
   * Prompts for delete confirmation, deletes the recipe on confirm, then shows
   * a success / failure dialog whose acknowledgement navigates back.
   */
  async function onDelete() {
    showDialog({
      title: t('deleteRecipe'),
      content: t('confirmDelete'),
      confirmText: t('save'),
      cancelText: t('cancel'),
      onConfirm: async () => {
        const success = await deleteRecipe(recipe);
        showDialog({
          title: t('deleteRecipe'),
          confirmText: t('ok'),
          onConfirm: () => navigation.goBack(),
          content: success
            ? t('deletedFromDatabase', { recipeName: recipe.title })
            : `${t('errorOccurred')} ${t('deleteRecipe')} ${recipe.title}`,
        });
      },
    });
  }

  /**
   * Adds the recipe to the weekly menu, then confirms with a dialog whose
   * acknowledgement navigates back.
   */
  async function onAddToMenu() {
    await addRecipeToMenu(recipe);
    showDialog({
      title: t('success'),
      content: t('addedToMenu', { recipeName: recipe.title }),
      confirmText: t('ok'),
      onConfirm: () => navigation.goBack(),
    });
  }

  /** Navigates to the editable form for this recipe (View → Edit push). */
  function onEdit() {
    recipeLogger.debug('RecipeView: navigating to RecipeEdit');
    navigation.push('RecipeEdit', { recipe });
  }

  const sourceUrlProps = buildRecipeSourceUrlProps({
    stackMode,
    sourceUrl: recipe.sourceUrl,
    onCopied: () => setSnackbarVisible(true),
  });

  return (
    <ScreenWrapper>
      <AppBar
        testID={RECIPE_TEST_ID}
        onGoBack={() => navigation.goBack()}
        onDelete={onDelete}
        onEdit={onEdit}
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
          {...buildRecipeImageProps({
            stackMode,
            recipeImage: recipe.image_Source,
            openModalForField: noop,
          })}
        />
        <RecipeText
          {...buildRecipeTitleProps({
            stackMode,
            recipeTitle: recipe.title,
            setRecipeTitle: noop,
            openModalForField: noop,
            t,
          })}
        />
        <RecipeText
          {...buildRecipeDescriptionProps({
            stackMode,
            recipeDescription: recipe.description,
            setRecipeDescription: noop,
            openModalForField: noop,
            t,
          })}
        />
        <RecipeTags
          {...buildRecipeTagsProps({
            stackMode,
            recipeTags: recipe.tags,
            randomTags: [],
            addTag: noop,
            removeTag: noop,
            openModalForField: noop,
          })}
        />
        <RecipeNumber
          {...buildRecipePersonsProps({
            stackMode,
            recipePersons: recipe.persons,
            setRecipePersons: noop,
            openModalForField: noop,
            t,
          })}
        />
        <RecipeIngredients testID='RecipeIngredients' ingredients={recipe.ingredients} />
        <RecipeNumber
          {...buildRecipeTimeProps({
            stackMode,
            recipeTime: recipe.time,
            setRecipeTime: noop,
            openModalForField: noop,
            t,
          })}
        />
        <RecipePreparation steps={recipe.preparation} />
        <RecipeNutrition
          {...buildRecipeNutritionProps({
            stackMode,
            recipeNutrition: recipe.nutrition,
            setRecipeNutrition: noop,
            openModalForField: noop,
            parentTestId: RECIPE_TEST_ID,
          })}
        />
        {sourceUrlProps && (
          <RecipeSourceUrl {...sourceUrlProps} testID={RECIPE_TEST_ID + '::RecipeSourceUrl'} />
        )}
      </ScrollView>

      <BottomActionButton
        testID={RECIPE_TEST_ID}
        onPress={onAddToMenu}
        label={t('validateReadOnly')}
      />

      <Alert
        title={dialogProps?.title ?? ''}
        content={dialogProps?.content ?? ''}
        confirmText={dialogProps?.confirmText ?? t('ok')}
        cancelText={dialogProps?.cancelText}
        onConfirm={dialogProps?.onConfirm}
        isVisible={isDialogOpen}
        testId={RECIPE_TEST_ID}
        onClose={hideDialog}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        testID='RecipeSourceUrlSnackbar'
      >
        {t('sourceUrl.copied')}
      </Snackbar>

      <Snackbar
        visible={scalingNoticeVisible}
        onDismiss={() => setScalingNoticeVisible(false)}
        duration={SCALING_NOTICE_DURATION}
        action={{ label: t('ok'), onPress: () => setScalingNoticeVisible(false) }}
        testID='RecipeScalingSnackbar'
      >
        {t('servingsScaledNotice', { from: scaledFromServings, to: recipe.persons })}
      </Snackbar>
    </ScreenWrapper>
  );
}
