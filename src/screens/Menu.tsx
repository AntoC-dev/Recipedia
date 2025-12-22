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
 * - Empty state with helpful message
 * - Tutorial overlay support via react-native-copilot
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { List, Text, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
import { useSafeCopilot } from '@hooks/useSafeCopilot';
import { MenuRecipeCard } from '@components/molecules/MenuRecipeCard';
import { TUTORIAL_STEPS } from '@utils/Constants';
import { padding } from '@styles/spacing';

const CopilotView = walkthroughable(View);

const screenId = 'MenuScreen';

export function Menu() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { menu, toggleMenuItemCooked, removeFromMenu } = useRecipeDatabase();
  const copilotData = useSafeCopilot();
  const stepOrder = TUTORIAL_STEPS.Menu.order;

  const toCookItems = menu.filter(item => !item.isCooked);
  const cookedItems = menu.filter(item => item.isCooked);

  const handleToggleCooked = async (menuId: number) => {
    await toggleMenuItemCooked(menuId);
  };

  const handleRemove = async (menuId: number) => {
    await removeFromMenu(menuId);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
              <List.Subheader
                testID={`${screenId}::SectionHeader::ToCook`}
                style={{ color: colors.primary }}
              >
                {t('menuScreen.toCook')}
              </List.Subheader>
              {toCookItems.map((item, index) => (
                <MenuRecipeCard
                  key={item.id}
                  testId={`${screenId}::MenuItem::${index + 1}`}
                  menuItem={item}
                  onToggleCooked={() => item.id && handleToggleCooked(item.id)}
                  onRemove={() => item.id && handleRemove(item.id)}
                />
              ))}
            </List.Section>
          )}
          {cookedItems.length > 0 && (
            <List.Section>
              <List.Subheader
                testID={`${screenId}::SectionHeader::Cooked`}
                style={{ color: colors.primary }}
              >
                {t('menuScreen.cooked')}
              </List.Subheader>
              {cookedItems.map((item, index) => (
                <MenuRecipeCard
                  key={item.id}
                  testId={`${screenId}::MenuItem::${toCookItems.length + index + 1}`}
                  menuItem={item}
                  onToggleCooked={() => item.id && handleToggleCooked(item.id)}
                  onRemove={() => item.id && handleRemove(item.id)}
                />
              ))}
            </List.Section>
          )}
        </ScrollView>
      )}

      {copilotData && menu.length > 0 && (
        <CopilotStep text={t('tutorial.menu.description')} order={stepOrder} name={'Menu'}>
          <CopilotView
            style={{
              position: 'absolute',
              top: '5%',
              left: padding.small,
              right: padding.small,
              height: '70%',
              pointerEvents: 'none',
            }}
          />
        </CopilotStep>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  },
});

export default Menu;
