/**
 * ShoppingListItem - One ingredient row of the shopping list
 *
 * Renders a Paper `List.Item` with a purchase checkbox, the aggregated quantity
 * and the number of recipes the ingredient comes from. Purchased rows are struck
 * through.
 *
 * The Shopping screen renders it both from the `SectionList` and from the
 * "already purchased" block, so it is a component rather than a render helper:
 * the purchased block maps over its items and keys them directly.
 *
 * @example
 * ```typescript
 * <ShoppingListItem
 *   key={item.name}
 *   item={item}
 *   testID={`ShoppingScreen::SectionList::${item.name}`}
 *   onToggle={() => togglePurchased(item.name)}
 *   onShowRecipes={() => openDialog(item)}
 * />
 * ```
 */

import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { Checkbox, List, useTheme } from 'react-native-paper';
import { ComputedShoppingItem } from '@customTypes/DatabaseElementTypes';
import { useI18n } from '@utils/i18n';
import { formatQuantityForDisplay } from '@utils/Quantity';

/** Props for the {@link ShoppingListItem} component */
export type ShoppingListItemProps = {
  /** The aggregated shopping entry to display */
  item: ComputedShoppingItem;
  /** Unique identifier for testing; the checkbox derives its own from it */
  testID: string;
  /** Called when the row is tapped, to flip its purchase state */
  onToggle: () => void;
  /** Called on long press, to show which recipes need this ingredient */
  onShowRecipes: () => void;
};

/**
 * ShoppingListItem component
 *
 * @param props - The component props
 * @returns JSX element representing one shopping list row
 */
export function ShoppingListItem({ item, testID, onToggle, onShowRecipes }: ShoppingListItemProps) {
  const { t } = useI18n();
  const { fonts } = useTheme();

  const recipesCount = item.recipeTitles.length;
  const recipesText = `${recipesCount} ${t(
    recipesCount > 1 ? 'shoppingScreen.recipes' : 'shoppingScreen.recipe'
  )}`;

  const textStyle: StyleProp<TextStyle> = [
    fonts.bodyMedium,
    item.purchased && { textDecorationLine: 'line-through' },
  ];

  return (
    <List.Item
      testID={testID}
      title={`${item.name} (${formatQuantityForDisplay(item.quantity)}${item.unit})`}
      titleStyle={textStyle}
      descriptionStyle={textStyle}
      description={recipesText}
      left={() => (
        <Checkbox
          testID={testID + '::Checkbox'}
          status={item.purchased ? 'checked' : 'unchecked'}
        />
      )}
      onPress={onToggle}
      onLongPress={onShowRecipes}
    />
  );
}
