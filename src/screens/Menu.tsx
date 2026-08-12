/**
 * Menu - Weekly menu screen showing selected recipes
 *
 * Displays recipes added to the menu with their cooked status.
 * Recipes can be marked as cooked (removes ingredients from shopping)
 * and the action is reversible (unmarking brings ingredients back).
 *
 * Features:
 * - Sectioned list separating "to cook" and "cooked" recipes
 * - Recipe cards with toggle and remove actions
 * - Removal is immediate with an undo snackbar (no blocking confirmation)
 * - Empty state with helpful message
 * - Tutorial overlay support via react-native-copilot
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { List, Snackbar, Text, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { useMenu } from '@hooks/useMenu';
import { useSafeCopilot } from '@hooks/useSafeCopilot';
import { MenuRecipeCard } from '@components/molecules/MenuRecipeCard';
import { ListSectionHeader } from '@components/atomic/ListSectionHeader';
import { TUTORIAL_STEPS } from '@utils/Constants';
import { padding } from '@styles/spacing';
import { menuTableElement, recipeTableElement } from '@customTypes/DatabaseElementTypes';

const CopilotView = walkthroughable(View);

const screenId = 'MenuScreen';

const REMOVE_SNACKBAR_DURATION = Snackbar.DURATION_LONG;

export function Menu() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { menu, toggleMenuItemCooked, removeFromMenu, addRecipeToMenu, getRecipeById } = useMenu();
  const copilotData = useSafeCopilot();
  const stepOrder = TUTORIAL_STEPS.Menu.order;

  const [removedRecipe, setRemovedRecipe] = useState<recipeTableElement | null>(null);

  const toCookItems = menu.filter(item => !item.isCooked);
  const cookedItems = menu.filter(item => item.isCooked);

  const handleToggleCooked = async (menuId: number) => {
    await toggleMenuItemCooked(menuId);
  };

  // Looked up without subscribing to the recipe catalogue, so editing recipes
  // elsewhere does not re-render the menu. Deleting a recipe only decrements a
  // menu entry whose count is above one, so a card can outlive its recipe;
  // without a recipe there is nothing to put back and the snackbar stays hidden.
  const handleRemove = async (menuItem: menuTableElement) => {
    const recipe = getRecipeById(menuItem.recipeId);
    await removeFromMenu(menuItem.id);
    setRemovedRecipe(recipe);
  };

  const undoRemove = async () => {
    if (!removedRecipe) {
      return;
    }
    await addRecipeToMenu(removedRecipe);
    setRemovedRecipe(null);
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {menu.length === 0 ? (
        <View style={styles.emptyState}>
          <Text testID={`${screenId}::TextNoItem`} variant='titleMedium' style={styles.emptyText}>
            {t('menuScreen.noItemsInMenu')}
          </Text>
          <Text
            testID={`${screenId}::TextHint`}
            variant='bodyMedium'
            style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}
          >
            {t('menuScreen.addRecipesToMenu')}
          </Text>
        </View>
      ) : (
        <ScrollView testID={`${screenId}::ScrollView`} contentContainerStyle={styles.listContent}>
          {toCookItems.length > 0 && (
            <List.Section>
              <ListSectionHeader
                testID={`${screenId}::SectionHeader::ToCook`}
                title={t('menuScreen.toCook')}
              />
              {toCookItems.map((item, index) => (
                <MenuRecipeCard
                  key={item.id}
                  testId={`${screenId}::MenuItem::${index + 1}`}
                  menuItem={item}
                  onToggleCooked={() => void handleToggleCooked(item.id)}
                  onRemove={() => void handleRemove(item)}
                />
              ))}
            </List.Section>
          )}
          {cookedItems.length > 0 && (
            <List.Section>
              <ListSectionHeader
                testID={`${screenId}::SectionHeader::Cooked`}
                title={t('menuScreen.cooked')}
              />
              {cookedItems.map((item, index) => (
                <MenuRecipeCard
                  key={item.id}
                  testId={`${screenId}::MenuItem::${toCookItems.length + index + 1}`}
                  menuItem={item}
                  onToggleCooked={() => void handleToggleCooked(item.id)}
                  onRemove={() => void handleRemove(item)}
                />
              ))}
            </List.Section>
          )}
        </ScrollView>
      )}

      <Snackbar
        visible={removedRecipe !== null}
        onDismiss={() => setRemovedRecipe(null)}
        duration={REMOVE_SNACKBAR_DURATION}
        action={{ label: t('undo'), onPress: () => void undoRemove() }}
        testID={`${screenId}::RemoveSnackbar`}
      >
        {t('menuScreen.removedFromMenu')}
      </Snackbar>

      {copilotData && (
        <CopilotStep text={t('tutorial.menu.description')} order={stepOrder} name={'Menu'}>
          <CopilotView
            style={{
              position: 'absolute',
              top: '3%',
              left: padding.small,
              right: padding.small,
              height: '70%',
              pointerEvents: 'none',
            }}
          />
        </CopilotStep>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: padding.large,
  },
  emptyText: {
    textAlign: 'center',
  },
  emptyHint: {
    textAlign: 'center',
    marginTop: padding.small,
  },
  listContent: {
    paddingBottom: padding.large,
    paddingHorizontal: padding.large,
  },
});

export default Menu;
