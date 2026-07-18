/**
 * SkippedRecipesList - Displays recipes that were skipped during bulk import
 *
 * Shows a scrollable list of skipped recipes, each with their title and a
 * copy-to-clipboard button for the source URL. Used in both the pre-validation
 * warning screen and the final import success screen.
 *
 * @module components/molecules/SkippedRecipesList
 */

import React, { useState } from 'react';
import { FlatList, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { IconButton, List, Snackbar, Surface, useTheme } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { SkippedRecipeInfo } from '@customTypes/BulkImportTypes';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';
import { Icons } from '@assets/Icons';

export interface SkippedRecipesListProps {
  /** Recipes that were skipped during import */
  skippedRecipes: SkippedRecipeInfo[];
  /** Test ID prefix for component testing */
  testID: string;
  /** Header content rendered above the list (used for title/body in warning screen) */
  ListHeaderComponent?: React.ReactElement;
  /** Whether the FlatList scrolls independently (default: false) */
  scrollEnabled?: boolean;
  /** Style applied to the FlatList content container */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Renders a list of skipped recipes with copyable source URLs
 *
 * @param props - See {@link SkippedRecipesListProps}
 */
export function SkippedRecipesList({
  skippedRecipes,
  testID,
  ListHeaderComponent,
  scrollEnabled = false,
  contentContainerStyle,
}: SkippedRecipesListProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const handleCopy = async (url: string) => {
    await Clipboard.setStringAsync(url);
    setSnackbarVisible(true);
  };

  return (
    <>
      <FlatList
        data={skippedRecipes}
        keyExtractor={item => item.sourceUrl}
        ListHeaderComponent={ListHeaderComponent}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={contentContainerStyle}
        testID={testID}
        renderItem={({ item, index }) => (
          <Surface
            style={[styles.card, { backgroundColor: colors.secondaryContainer }]}
            elevation={0}
          >
            <List.Item
              testID={`${testID}::Item::${index}`}
              title={item.title}
              titleNumberOfLines={2}
              description={item.sourceUrl}
              descriptionNumberOfLines={1}
              right={() => (
                <IconButton
                  icon={Icons.copy}
                  onPress={() => void handleCopy(item.sourceUrl)}
                  testID={`${testID}::Item::${index}::CopyButton`}
                />
              )}
            />
          </Surface>
        )}
      />
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        testID={`${testID}::Snackbar`}
      >
        {t('sourceUrl.copied')}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: padding.small,
    marginBottom: padding.small,
    overflow: 'hidden',
  },
});
