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
 * - Purchased items leave their category for a collapsible block at the end
 * - Undo snackbar, so a mistaken tap costs one press rather than a hunt
 * - A completion state once nothing is left to buy, distinct from an empty list
 * - Recipe origin tracking - see which recipes use each ingredient
 * - Long-press for detailed recipe information dialog
 * - Focus-based data synchronization with recipe changes
 * - Empty state handling with user-friendly messaging
 * - Comprehensive logging for shopping analytics
 *
 * The list is a pure derived view of the menu: it has no clear action of its
 * own — items disappear as their recipes are removed or marked cooked on the
 * Menu screen.
 *
 * UI/UX Features:
 * - Sectioned list organized by ingredient type, holding only what is left to buy
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
import { SectionList, StyleSheet, View } from 'react-native';
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useSafeCopilot } from '@hooks/useSafeCopilot';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { useResetOnChange } from '@hooks/useResetOnChange';
import { CopilotStepData } from '@customTypes/TutorialTypes';
import { Divider, Icon, List, Text, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { useShopping } from '@hooks/useShopping';
import { useMenu } from '@hooks/useMenu';
import { buildShoppingSections } from '@utils/shoppingSections';
import {
  ListSectionHeader,
  listSectionHeaderTextStyle,
} from '@components/atomic/ListSectionHeader';
import { ShoppingListItem } from '@components/molecules/ShoppingListItem';
import { useShoppingCategories } from '@hooks/useCategories';
import { Icons } from '@assets/Icons';
import { Alert } from '@components/dialogs/Alert';
import { TUTORIAL_DEMO_INTERVAL, TUTORIAL_STEPS } from '@utils/Constants';
import { padding } from '@styles/spacing';
import { shoppingLogger } from '@utils/logger';

/** Type for dialog data containing ingredient and recipe information */
type ingredientDataForDialog = Pick<ComputedShoppingItem, 'name' | 'recipeTitles'>;

/** Size of the icon heading the completion state. */
const DONE_ICON_SIZE = 28;

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
  const { shopping: shoppingList } = useShopping();
  const { togglePurchased } = useMenu();
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

  const { sections, purchased } = buildShoppingSections(shoppingCategories, shoppingList);
  const nothingLeftToBuy = sections.length === 0;
  const hasPurchased = purchased.length > 0;
  const isListCleared = nothingLeftToBuy && hasPurchased;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPurchasedExpanded, setIsPurchasedExpanded] = useState(isListCleared);
  const [ingredientDataForDialog, setIngredientDataForDialog] = useState<ingredientDataForDialog>({
    recipeTitles: [],
    name: '',
  });

  // Opening the purchased block once the list is cleared keeps the screen from
  // looking empty; collapsing it again as soon as new items arrive — or as soon
  // as the block empties — keeps the working list free of what is already bought.
  useResetOnChange([nothingLeftToBuy, hasPurchased], () => setIsPurchasedExpanded(isListCleared));

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
        setIngredientDataForDialog(list[2]!);
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

  const screenId = 'ShoppingScreen';
  const sectionId = screenId + '::SectionList';
  const purchasedId = sectionId + '::Purchased';
  const doneId = screenId + '::AllDone';

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

  function toggleItemPurchased(item: ComputedShoppingItem) {
    shoppingLogger.debug('Toggling ingredient purchase status', { ingredient: item.name });
    void togglePurchased(item.name);
  }

  function showRecipesFor(item: ComputedShoppingItem) {
    setIngredientDataForDialog(item);
    setIsDialogOpen(true);
  }

  function renderShoppingItem(item: ComputedShoppingItem) {
    return (
      <ShoppingListItem
        key={item.name}
        item={item}
        testID={sectionId + '::' + item.name}
        onToggle={() => toggleItemPurchased(item)}
        onShowRecipes={() => showRecipesFor(item)}
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
          contentContainerStyle={styles.listContent}
          sections={sections}
          keyExtractor={item => item.name}
          renderItem={({ item }) => renderShoppingItem(item)}
          ListHeaderComponent={
            isListCleared ? (
              <View testID={doneId} style={styles.doneState}>
                <Icon source={Icons.checkWithCircle} size={DONE_ICON_SIZE} color={colors.primary} />
                <Text testID={doneId + '::Title'} variant='titleLarge'>
                  {t('shoppingScreen.allDoneTitle')}
                </Text>
              </View>
            ) : null
          }
          renderSectionHeader={({ section }) => {
            const headerId = sectionId + '::' + section.title;
            return (
              <View testID={headerId + '::Header'}>
                <ListSectionHeader testID={headerId + '::SubHeader'} title={t(section.title)} />
                <Divider testID={headerId + '::Divider'} />
              </View>
            );
          }}
          ListFooterComponent={
            hasPurchased ? (
              <List.Accordion
                testID={purchasedId}
                title={t('shoppingScreen.purchased')}
                titleStyle={listSectionHeaderTextStyle(colors, fonts)}
                style={styles.purchasedAccordion}
                contentStyle={styles.purchasedContent}
                expanded={isPurchasedExpanded}
                onPress={() => setIsPurchasedExpanded(!isPurchasedExpanded)}
              >
                {purchased.map(renderShoppingItem)}
              </List.Accordion>
            ) : null
          }
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // flexGrow floors the content at viewport height: a list that shrinks below it
  // mid-scroll strands the scroll view past its own end, on a blank screen.
  listContent: {
    paddingHorizontal: padding.medium,
    flexGrow: 1,
    paddingBottom: padding.veryLarge,
  },
  doneState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: padding.small,
    paddingVertical: padding.veryLarge,
  },
  purchasedAccordion: {
    marginTop: padding.large,
  },
  // Paper insets the accordion content by 16; drop it so the title lines up
  // with the category headers above it.
  purchasedContent: {
    paddingLeft: 0,
  },
});

export default Shopping;
