/**
 * Shopping - Smart shopping list with categorized ingredients and recipe tracking
 *
 * A comprehensive shopping list screen that automatically organizes ingredients by category,
 * tracks purchase status, and provides detailed recipe information for each ingredient.
 * Features intuitive checkbox interactions and complete list management capabilities.
 *
 * Key Features:
 * - Automatic ingredient categorization (vegetables, proteins, dairy, etc.)
 * - Purchase status tracking with visual feedback (strikethrough)
 * - Recipe origin tracking - see which recipes use each ingredient
 * - Long-press for detailed recipe information dialog
 * - One-tap shopping list clearing functionality
 * - Focus-based data synchronization with recipe changes
 * - Empty state handling with user-friendly messaging
 * - Comprehensive logging for shopping analytics
 *
 * UI/UX Features:
 * - Sectioned list organization by ingredient type
 * - Visual purchase indicators (checkboxes + strikethrough)
 * - Recipe count badges for multi-recipe ingredients
 * - Smooth interactions with immediate visual feedback
 * - Accessible design with proper contrast and sizing
 *
 * Data Management:
 * - Real-time synchronization with recipe database
 * - Persistent purchase state across app sessions
 * - Automatic cleanup when recipes are removed
 * - Efficient category-based organization
 *
 * @example
 * ```typescript
 * // Navigation integration (typically in tab navigator)
 * <Tab.Screen
 *   name="Shopping"
 *   component={Shopping}
 *   options={{
 *     tabBarIcon: ({ color }) => <Icon name="shopping-cart" color={color} />
 *   }}
 * />
 *
 * // The Shopping screen automatically handles:
 * // - Loading shopping list from added recipes
 * // - Organizing ingredients by category
 * // - Managing purchase status
 * // - Providing recipe context for ingredients
 * ```
 */

import { ComputedShoppingItem } from '@customTypes/DatabaseElementTypes';
import React, { useEffect, useRef, useState } from 'react';
import { SectionList, StyleProp, TextStyle, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useSafeCopilot } from '@hooks/useSafeCopilot';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { CopilotStepData } from '@customTypes/TutorialTypes';
import { Checkbox, Divider, List, Text, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { useShopping } from '@hooks/useShopping';
import { useMenu } from '@hooks/useMenu';
import { TListFilter } from '@customTypes/RecipeFiltersTypes';
import { useShoppingCategories } from '@hooks/useCategories';
import { Icons } from '@assets/Icons';
import { Alert } from '@components/dialogs/Alert';
import { RoundButton } from '@components/atomic/RoundButton';
import { TUTORIAL_DEMO_INTERVAL, TUTORIAL_STEPS } from '@utils/Constants';
import { padding } from '@styles/spacing';
import { formatQuantityForDisplay } from '@utils/Quantity';
import { shoppingLogger } from '@utils/logger';

/** Type for dialog data containing ingredient and recipe information */
type ingredientDataForDialog = Pick<ComputedShoppingItem, 'name' | 'recipeTitles'>;

/**
 * Shopping screen component - Categorized shopping list with recipe tracking
 *
 * @param props - Navigation props for the Shopping screen
 * @returns JSX element representing the shopping list interface
 */
const CopilotView = walkthroughable(View);

export function Shopping() {
  const { t } = useI18n();
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const { shopping: shoppingList } = useShopping();
  const { togglePurchased, clearMenu } = useMenu();
  const shoppingCategories = useShoppingCategories();
  const copilotData = useSafeCopilot();
  const copilotEvents = copilotData?.copilotEvents;
  const currentStep = copilotData?.currentStep;

  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDialogOpenRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const shoppingListRef = useRef(shoppingList);
  useEffect(() => {
    shoppingListRef.current = shoppingList;
  });

  const stepOrder = TUTORIAL_STEPS.Shopping.order;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ingredientDataForDialog, setIngredientDataForDialog] = useState<ingredientDataForDialog>({
    recipeTitles: [],
    name: '',
  });

  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);

  useEffect(() => {
    if (!copilotData || !copilotEvents) {
      return;
    }

    function closeDialog() {
      if (!isDialogOpenRef.current) {
        return;
      }
      setIsDialogOpen(false);
      setIngredientDataForDialog({ name: '', recipeTitles: [] });
      isDialogOpenRef.current = false;
    }

    function toggleDemoDialog() {
      const list = shoppingListRef.current;
      if (isDialogOpenRef.current) {
        closeDialog();
      } else if (list.length > 2) {
        setIngredientDataForDialog(list[2]);
        setIsDialogOpen(true);
        isDialogOpenRef.current = true;
      }
    }

    function startDemo() {
      if (reducedMotion) {
        return;
      }
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      demoIntervalRef.current = setInterval(toggleDemoDialog, TUTORIAL_DEMO_INTERVAL);
    }

    function stopDemo() {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      closeDialog();
    }

    function handleStepChange(step: CopilotStepData | undefined) {
      if (step?.order === stepOrder) {
        startDemo();
      } else {
        stopDemo();
      }
    }

    if (currentStep?.order === stepOrder) {
      startDemo();
    }

    copilotEvents.on('stepChange', handleStepChange);
    copilotEvents.on('stop', stopDemo);

    return () => {
      copilotEvents.off('stepChange', handleStepChange);
      copilotEvents.off('stop', stopDemo);
      stopDemo();
    };
  }, [currentStep, copilotData, copilotEvents, reducedMotion, stepOrder]);

  const sections = shoppingCategories
    .map(category => ({
      title: category,
      data: shoppingList.filter(item => item.type === category),
    }))
    .filter(section => section.data.length > 0);

  const screenId = 'ShoppingScreen';
  const sectionId = screenId + '::SectionList';

  /**
   * Creates formatted dialog title for ingredient recipe usage
   *
   * Generates a localized title showing which ingredient is being queried
   * and indicates that recipe usage information will be displayed.
   *
   * @returns string - Formatted dialog title with ingredient name and context
   */
  function createDialogTitle() {
    return t('shoppingScreen.recipeUsingTitle') + ' ' + ingredientDataForDialog.name.toLowerCase();
  }

  /**
   * Creates formatted dialog content listing recipes using the ingredient
   *
   * Builds a multi-line message showing all recipes that use the selected
   * ingredient. Formats the list with proper indentation and bullets for readability.
   *
   * @returns string - Formatted message with bullet-pointed recipe list
   *
   * Content Format:
   * - Starts with localized explanation message
   * - Lists each recipe title on new line with tab indentation
   * - Uses bullet points (- ) for visual clarity
   * - Joins all recipe titles into single formatted string
   */
  function createDialogContent() {
    return (
      t('shoppingScreen.recipeUsingMessage') +
      ' :' +
      ingredientDataForDialog.recipeTitles.map(title => `\n\t- ${title}`).join('')
    );
  }

  /**
   * Toggles purchase status of an ingredient by name
   */
  function updateShoppingList(ingredientName: string) {
    shoppingLogger.debug('Toggling ingredient purchase status', { ingredient: ingredientName });
    togglePurchased(ingredientName);
  }

  function showClearConfirmation() {
    setIsConfirmationDialogOpen(true);
  }

  function closeClearConfirmation() {
    setIsConfirmationDialogOpen(false);
  }

  async function clearShoppingList() {
    shoppingLogger.info('Clearing shopping list', { itemCount: shoppingList.length });
    await clearMenu();
    setIsConfirmationDialogOpen(false);
  }

  function renderSectionHeader({ section: { title } }: { section: { title: TListFilter } }) {
    const headerId = sectionId + '::' + title;
    return (
      <View>
        <List.Subheader
          testID={headerId + '::SubHeader'}
          style={{ ...fonts.titleMedium, color: colors.primary }}
        >
          {t(title)}
        </List.Subheader>
        <Divider testID={headerId + '::Divider'} />
      </View>
    );
  }

  function renderItem({ item }: { item: ComputedShoppingItem }) {
    const recipesCount = item.recipeTitles.length;
    const recipesText =
      recipesCount > 1
        ? `${recipesCount} ${t('shoppingScreen.recipes')}`
        : recipesCount === 1
          ? `1 ${t('shoppingScreen.recipe')}`
          : '';

    const textStyle: StyleProp<TextStyle> = [
      { ...fonts.bodyMedium },
      item.purchased && { textDecorationLine: 'line-through' },
    ];
    const itemTestId = sectionId + '::' + item.name;
    return (
      <List.Item
        testID={itemTestId}
        title={`${item.name} (${formatQuantityForDisplay(item.quantity)}${item.unit})`}
        titleStyle={textStyle}
        descriptionStyle={textStyle}
        description={recipesText}
        left={() => <Checkbox status={item.purchased ? 'checked' : 'unchecked'} />}
        onPress={() => updateShoppingList(item.name)}
        onLongPress={() => {
          setIngredientDataForDialog(item);
          setIsDialogOpen(true);
        }}
      />
    );
  }

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {shoppingList.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text testID={screenId + '::TextNoItem'} variant='titleMedium'>
            {t('shoppingScreen.noItemsInShoppingList')}
          </Text>
        </View>
      ) : (
        <SectionList
          testID={sectionId}
          sections={sections}
          keyExtractor={item => item.name}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
        />
      )}

      {copilotData && (
        <CopilotStep text={t('tutorial.shopping.description')} order={stepOrder} name={'Shopping'}>
          <CopilotView
            style={{
              position: 'absolute',
              top: '33%',
              left: padding.small,
              right: padding.small,
              height: '55%',
              pointerEvents: 'none',
            }}
          />
        </CopilotStep>
      )}

      <Alert
        isVisible={isDialogOpen}
        confirmText={t('shoppingScreen.recipeUsingValidation')}
        content={createDialogContent()}
        testId={screenId}
        title={createDialogTitle()}
        // During the tutorial the demo dialog is pushed down so its top clears
        // the tutorial tooltip anchored above the highlighted list.
        style={copilotData ? { marginTop: '25%' } : undefined}
        onClose={() => {
          setIsDialogOpen(false);
          setIngredientDataForDialog({ name: '', recipeTitles: [] });
        }}
      />
      <Alert
        isVisible={isConfirmationDialogOpen}
        title={t('shoppingScreen.clearShoppingList')}
        content={t('shoppingScreen.confirmClearShoppingList')}
        confirmText={t('confirm')}
        cancelText={t('cancel')}
        testId={screenId + '::ClearConfirmation'}
        onConfirm={clearShoppingList}
        onClose={closeClearConfirmation}
      />
      {shoppingList.length > 0 && (
        <RoundButton
          icon={Icons.trashIcon}
          size='medium'
          onPressFunction={showClearConfirmation}
          testID={screenId + '::ClearShoppingListButton'}
          style={{
            position: 'absolute',
            top: insets.top + padding.medium,
            right: padding.medium,
            zIndex: 1,
          }}
        />
      )}
    </ScreenWrapper>
  );
}

export default Shopping;
