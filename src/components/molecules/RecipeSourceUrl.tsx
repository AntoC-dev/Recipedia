/**
 * RecipeSourceUrl - Displays the source URL of an imported recipe
 *
 * Shows the origin URL with a copy-to-clipboard button.
 * Only rendered in read-only mode when a source URL is available.
 *
 * @example
 * ```typescript
 * <RecipeSourceUrl
 *   sourceUrl="https://www.hellofresh.fr/recipes/example"
 *   onCopied={() => showSnackbar()}
 *   testID="Recipe"
 * />
 * ```
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Surface, Text, useTheme } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';

export interface RecipeSourceUrlProps {
  /** The URL to display and copy */
  sourceUrl: string;
  /** Callback fired after the URL is copied to clipboard */
  onCopied?: () => void;
  /** Test ID prefix for component testing */
  testID?: string;
}

export function RecipeSourceUrl({
  sourceUrl,
  onCopied,
  testID = 'RecipeSourceUrl',
}: RecipeSourceUrlProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  const handleCopy = async () => {
    await Clipboard.setStringAsync(sourceUrl);
    onCopied?.();
  };

  return (
    <Surface
      style={[styles.container, { backgroundColor: colors.elevation.level1 }]}
      testID={testID}
    >
      <Text variant='titleMedium' style={styles.label} testID={`${testID}::Label`}>
        {t('sourceUrl.label')}
      </Text>
      <View style={styles.urlRow}>
        <Text
          variant='bodySmall'
          numberOfLines={1}
          style={styles.urlText}
          testID={`${testID}::Text`}
        >
          {sourceUrl}
        </Text>
        <IconButton
          icon='content-copy'
          size={20}
          onPress={handleCopy}
          testID={`${testID}::CopyButton`}
        />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: padding.large,
    marginTop: padding.medium,
    padding: padding.medium,
    borderRadius: 12,
  },
  label: {
    marginBottom: padding.verySmall,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urlText: {
    flex: 1,
    opacity: 0.7,
  },
});

export default RecipeSourceUrl;
