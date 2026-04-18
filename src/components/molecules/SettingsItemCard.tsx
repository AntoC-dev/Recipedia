/**
 * SettingsItemCard - Generic card component for managing app settings data
 *
 * A highly reusable card component designed for displaying and managing different types
 * of settings data including ingredients and tags. Features type-safe generic implementation
 * with specialized rendering logic for each item type and integrated CRUD operations.
 *
 * Key Features:
 * - Generic type system supporting multiple item types (ingredients, tags)
 * - Type-specific rendering with appropriate information display
 * - Integrated seasonality calendar for ingredients
 * - Built-in edit and delete actions with callbacks
 * - Internationalization support for all text content
 * - Consistent Material Design card styling
 * - Comprehensive test ID structure for automation
 *
 * @example
 * ```typescript
 * // Ingredient management card
 * <SettingsItemCard<ingredientTableElement>
 *   type="ingredient"
 *   item={tomatoIngredient}
 *   index={0}
 *   testIdPrefix="ingredients-list"
 *   onEdit={(ingredient) => openEditModal(ingredient)}
 *   onDelete={(ingredient) => confirmDelete(ingredient)}
 * />
 *
 * // Tag management card
 * <SettingsItemCard<tagTableElement>
 *   type="tag"
 *   item={vegetarianTag}
 *   index={1}
 *   testIdPrefix="tags-list"
 *   onEdit={(tag) => editTag(tag)}
 *   onDelete={(tag) => removeTag(tag)}
 * />
 * ```
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { padding } from '@styles/spacing';
import { useI18n } from '@utils/i18n';
import { ingredientTableElement, tagTableElement } from '@customTypes/DatabaseElementTypes';
import { SeasonalityCalendar } from '@components/molecules/SeasonalityCalendar';

/** Type constraint for items that can be used in SettingsItemCard */
export type SettingsItem = ingredientTableElement | tagTableElement;

/**
 * Generic props for SettingsItemCard component
 */
export type SettingsItemCardProps<T extends SettingsItem> = {
  /** Type of item being displayed (affects rendering logic) */
  type: 'ingredient' | 'tag';
  /** Prefix for test ID construction */
  testIdPrefix: string;
  /** The data item to display */
  item: T;
  /** Callback fired when edit button is pressed */
  onEdit: (item: T) => void;
  /** Callback fired when delete button is pressed */
  onDelete: (item: T) => void;
};

/**
 * SettingsItemCard component for generic settings data management
 *
 * @param props - The component props with generic type constraint
 * @returns JSX element representing a settings management card with type-specific rendering
 */
export function SettingsItemCard<T extends SettingsItem>({
  item,
  testIdPrefix,
  onEdit,
  onDelete,
  type,
}: SettingsItemCardProps<T>) {
  const { t } = useI18n();

  return (
    <Card style={{ marginBottom: padding.medium }}>
      <Card.Content>
        {type === 'tag' && 'name' in item ? (
          <Text
            testID={testIdPrefix + `::TagName`}
            variant='titleLarge'
            style={{ fontWeight: 'bold' }}
          >
            {item.name}
          </Text>
        ) : type === 'ingredient' && 'unit' in item ? (
          <View>
            <Text
              testID={testIdPrefix + `::IngredientName`}
              variant={'titleLarge'}
              style={{ fontWeight: 'bold', marginBottom: padding.small }}
            >
              {item.name}
            </Text>
            <View style={styles.infoRow}>
              <Text testID={testIdPrefix + '::IntroType'} style={styles.infoLabel}>
                {t('type')}:
              </Text>
              <Text testID={testIdPrefix + '::Type'}>{t(item.type)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text testID={testIdPrefix + '::IntroUnit'} style={styles.infoLabel}>
                {t('unit')}:
              </Text>
              <Text testID={testIdPrefix + '::Unit'}>{item.unit}</Text>
            </View>
            <SeasonalityCalendar
              testID={testIdPrefix}
              selectedMonths={item.season}
              readOnly={true}
            />
          </View>
        ) : (
          <Text testID={testIdPrefix + '::Unsupported'}>Unsupported item type:{type}</Text>
        )}
      </Card.Content>
      <Card.Actions>
        <Button testID={testIdPrefix + `::EditButton`} onPress={() => onEdit(item)}>
          {t('edit')}
        </Button>
        <Button testID={testIdPrefix + `::DeleteButton`} onPress={() => onDelete(item)}>
          {t('delete')}
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: padding.verySmall,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: padding.small,
  },
});
export default SettingsItemCard;
