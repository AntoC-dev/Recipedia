/**
 * SettingsItemList - Generic list component for settings data management
 *
 * A comprehensive list component that displays and manages collections of settings items
 * with integrated CRUD operations. Features generic type support, automatic item rendering,
 * and a prominent add button for creating new items.
 *
 * Key Features:
 * - Generic type system supporting multiple settings item types
 * - Automatic list rendering with proper spacing and styling
 * - Integrated add functionality with contextual button text
 * - Theme-aware styling and typography
 * - Internationalization support for titles and buttons
 * - Full-height scrollable layout
 * - Type-safe prop forwarding to individual cards
 *
 * @example
 * ```typescript
 * // Ingredient management list
 * <SettingsItemList<ingredientTableElement>
 *   type="ingredient"
 *   items={ingredients}
 *   testIdPrefix="ingredients-list"
 *   onEdit={(ingredient) => editIngredient(ingredient)}
 *   onDelete={(ingredient) => deleteIngredient(ingredient)}
 *   onAddPress={() => openAddIngredientModal()}
 * />
 *
 * // Tag management list
 * <SettingsItemList<tagTableElement>
 *   type="tag"
 *   items={tags}
 *   testIdPrefix="tags-list"
 *   onEdit={(tag) => editTag(tag)}
 *   onDelete={(tag) => deleteTag(tag)}
 *   onAddPress={() => openAddTagModal()}
 * />
 * ```
 */

import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Searchbar, useTheme } from 'react-native-paper';
import { padding } from '@styles/spacing';
import { useI18n } from '@utils/i18n';
import {
  SettingsItem,
  SettingsItemCard,
  SettingsItemCardProps,
} from '../molecules/SettingsItemCard';

/**
 * Props for the SettingsItemList component
 * Extends SettingsItemCardProps while omitting individual item props
 */
export type SettingsItemListProps<T extends SettingsItem> = Omit<
  SettingsItemCardProps<T>,
  'index' | 'item'
> & {
  /** Array of items to display in the list */
  items: T[];
};

/**
 * SettingsItemList component for generic settings data management
 *
 * @param props - The component props with generic type constraint
 * @returns JSX element representing a scrollable list of settings items with add functionality
 */
export function SettingsItemList<T extends SettingsItem>({
  testIdPrefix,
  onEdit,
  onDelete,
  type,
  items,
}: SettingsItemListProps<T>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ height: '100%', backgroundColor: colors.background }}>
      <Searchbar
        testID={`${testIdPrefix}::SearchBar`}
        mode='bar'
        placeholder={t('search_items')}
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{
          margin: padding.small,
          marginBottom: padding.verySmall,
          borderRadius: 999,
        }}
      />
      <FlatList
        data={filteredItems}
        contentContainerStyle={{ padding: padding.small }}
        renderItem={({ item, index }) => (
          <SettingsItemCard
            key={index}
            item={item}
            index={index}
            testIdPrefix={testIdPrefix}
            type={type}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      />
    </View>
  );
}

export default SettingsItemList;
