/**
 * DismissedRecipeCard - Settings card for a permanently dismissed bulk-import recipe
 *
 * Displays a dismissed recipe's title with a Restore action that brings it back
 * into future discovery runs. Rendered inside the per-provider accordions of the
 * DismissedRecipesSettings screen, so the source provider is shown by the
 * accordion header rather than the card itself.
 *
 * @example
 * ```typescript
 * <DismissedRecipeCard
 *   testIdPrefix="DismissedRecipesSettings::hellofresh::0"
 *   recipe={{ providerId: 'hellofresh', recipeUrl: 'https://...', title: 'Tikka', dismissedAt: 0 }}
 *   onRestore={() => restore(recipe)}
 * />
 * ```
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { ImageThumbnail } from '@components/molecules/ImageThumbnail';
import { padding, radius } from '@styles/spacing';
import { dismissedRecipeTableElement } from '@customTypes/DatabaseElementTypes';
import { Icons } from '@assets/Icons';
import { useI18n } from '@utils/i18n';

const THUMBNAIL_SIZE = 64;

/**
 * Props for the DismissedRecipeCard component
 */
export type DismissedRecipeCardProps = {
  /** Prefix for test ID construction */
  testIdPrefix: string;
  /** Dismissed recipe record to display */
  recipe: dismissedRecipeTableElement;
  /** Callback invoked when the recipe is restored */
  onRestore: () => void;
};

/**
 * DismissedRecipeCard component for the dismissed recipes management list
 *
 * @param props - The component props
 * @returns JSX element representing a dismissed recipe card with a restore action
 */
export function DismissedRecipeCard({ testIdPrefix, recipe, onRestore }: DismissedRecipeCardProps) {
  const { t } = useI18n();

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <ImageThumbnail
          uri={recipe.imageUrl || undefined}
          size={THUMBNAIL_SIZE}
          borderRadius={radius.small}
          testID={testIdPrefix + '::Thumbnail'}
        />
        <Text
          variant='titleMedium'
          numberOfLines={2}
          style={styles.title}
          testID={testIdPrefix + '::Title'}
        >
          {recipe.title}
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button
          mode='contained-tonal'
          icon={Icons.restore}
          onPress={onRestore}
          testID={testIdPrefix + '::RestoreButton'}
        >
          {t('bulkImport.dismissed.restore')}
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: padding.small,
    marginHorizontal: padding.medium,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    marginLeft: padding.medium,
    fontWeight: 'bold',
  },
});

export default DismissedRecipeCard;
