/**
 * DismissedRecipesSettings - Management screen for dismissed bulk-import recipes
 *
 * Lists every recipe the user permanently dismissed, grouped by source provider
 * in collapsible accordions, and lets them restore any of them back into future
 * discovery runs. Reached from the "Bulk Import Recipes" section of the
 * Parameters screen, alongside the ingredient and tag management screens.
 *
 * @example
 * ```typescript
 * navigation.navigate('DismissedRecipesSettings');
 * ```
 */

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
import { List, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackScreenNavigation } from '@customTypes/ScreenTypes';
import { AppBar } from '@components/organisms/AppBar';
import { DismissedRecipeCard } from '@components/molecules/DismissedRecipeCard';
import { ProviderLogo } from '@components/molecules/ProviderLogo';
import { useImportHistory } from '@hooks/useImportHistory';
import { dismissedRecipeTableElement } from '@customTypes/DatabaseElementTypes';
import { groupDismissedRecipesByProvider } from '@utils/BulkImportUtils';
import { getProvider } from '@providers/ProviderRegistry';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';

const screenId = 'DismissedRecipesSettings';

/**
 * DismissedRecipesSettings screen component
 *
 * @returns JSX element representing the dismissed recipes management screen
 */
export function DismissedRecipesSettings() {
  const { t } = useI18n();
  const navigation = useNavigation<StackScreenNavigation>();

  const { getDismissedRecipes, restoreDismissedRecipes } = useImportHistory();
  const [recipes, setRecipes] = useState<dismissedRecipeTableElement[]>(() =>
    getDismissedRecipes()
  );

  const groups = useMemo(
    () =>
      groupDismissedRecipesByProvider(
        recipes,
        providerId => getProvider(providerId)?.name ?? providerId
      ),
    [recipes]
  );

  const handleRestore = async (recipe: dismissedRecipeTableElement) => {
    await restoreDismissedRecipes(recipe.providerId, [recipe.recipeUrl]);
    setRecipes(prev => prev.filter(r => r.recipeUrl !== recipe.recipeUrl));
  };

  return (
    <ScreenWrapper>
      <AppBar
        title={t('bulkImport.dismissed.title')}
        onGoBack={() => navigation.goBack()}
        testID={screenId}
      />

      {groups.length > 0 ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          <List.AccordionGroup>
            {groups.map(group => {
              const groupId = `${screenId}::${group.providerId}`;
              return (
                <List.Accordion
                  key={group.providerId}
                  id={group.providerId}
                  title={group.providerName}
                  description={
                    group.recipes.length === 1
                      ? t('bulkImport.dismissed.count', { count: 1 })
                      : t('bulkImport.dismissed.countPlural', { count: group.recipes.length })
                  }
                  left={() => (
                    <ProviderLogo
                      logoUrl={getProvider(group.providerId)?.logoUrl ?? ''}
                      size={32}
                      testID={groupId + '::Logo'}
                    />
                  )}
                  testID={groupId}
                >
                  {group.recipes.map((recipe, index) => (
                    <DismissedRecipeCard
                      key={recipe.recipeUrl}
                      testIdPrefix={`${groupId}::${index}`}
                      recipe={recipe}
                      onRestore={() => handleRestore(recipe)}
                    />
                  ))}
                </List.Accordion>
              );
            })}
          </List.AccordionGroup>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text variant='titleMedium' style={styles.emptyTitle} testID={screenId + '::Empty'}>
            {t('bulkImport.dismissed.empty')}
          </Text>
          <Text variant='bodyMedium' style={styles.emptyText}>
            {t('bulkImport.dismissed.emptyDescription')}
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: padding.small,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: padding.large,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: padding.small,
  },
  emptyText: {
    textAlign: 'center',
  },
});

export default DismissedRecipesSettings;
