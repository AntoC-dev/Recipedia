/**
 * SelectableAccordion - Inline accordion with selectable items
 *
 * A reusable molecule that renders a collapsible accordion (no Portal) with
 * either single-select (RadioButton) or multi-select (Chip) items.
 * Designed to replace Menu/Portal-based dropdowns inside Dialogs where
 * nested Portal usage causes auto-dismiss side effects.
 *
 * @example
 * ```typescript
 * // Single-select (RadioButton mode)
 * <SelectableAccordion
 *   testID="TypeAccordion"
 *   title="Type"
 *   items={categories.map(c => ({ value: c, label: t(c) }))}
 *   selectedValues={ingType ? [ingType] : []}
 *   onPress={value => setIngType(value as ingredientType)}
 * />
 *
 * // Multi-select (Chip mode)
 * <SelectableAccordion
 *   testID="SeasonAccordion"
 *   title="Seasonality"
 *   items={monthItems}
 *   selectedValues={ingSeason}
 *   onPress={handleToggle}
 *   multiSelect
 * />
 * ```
 */

import React, { useState } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, View } from 'react-native';
import { Button, Chip, List, RadioButton, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';

/** A value/label pair for use in selectable lists */
export type SelectableItem = {
  /** Machine-readable identifier */
  value: string;
  /** Human-readable display label */
  label: string;
};

const selectableItemKeyExtractor = (item: SelectableItem): string => item.value;

type SelectableChipProps = {
  testID: string;
  item: SelectableItem;
  isSelected: boolean;
  selectedColor: string;
  onPress: (value: string) => void;
};

type SelectableRadioItemProps = {
  testID: string;
  item: SelectableItem;
  onPress: (value: string) => void;
};

function SelectableRadioItem({ testID, item, onPress }: SelectableRadioItemProps) {
  return (
    <View style={styles.radioItemWrapper}>
      <RadioButton.Item
        testID={testID + '::' + item.value}
        label={item.label}
        labelVariant='labelLarge'
        value={item.value}
        position='leading'
        onPress={() => onPress(item.value)}
        style={styles.radioItem}
      />
    </View>
  );
}

function SelectableChip({ testID, item, isSelected, selectedColor, onPress }: SelectableChipProps) {
  return (
    <Chip
      testID={testID + '::' + item.value}
      selected={isSelected}
      showSelectedCheck={true}
      mode='outlined'
      selectedColor={isSelected ? selectedColor : undefined}
      onPress={() => onPress(item.value)}
      style={styles.chip}
    >
      {item.label}
    </Chip>
  );
}

/**
 * Props for the SelectableAccordion component
 */
export type SelectableAccordionProps = {
  /** Unique identifier for testing and accessibility */
  testID: string;
  /** Title displayed in the accordion header */
  title: string;
  /** List of selectable items */
  items: SelectableItem[];
  /** Currently selected values */
  selectedValues: string[];
  /** Callback fired when an item is pressed */
  onPress: (value: string) => void;
  /** Whether multiple items can be selected simultaneously. Default: false (RadioButton mode) */
  multiSelect?: boolean;
  /** Number of columns for the item grid. Default: 2 */
  numColumns?: number;
  /** Label to display in description when all items are selected */
  allSelectedLabel?: string;
  /** Callback fired when the toggle-all button is pressed (multi-select only). Renders a Button when provided. */
  onToggleAll?: () => void;
};

/**
 * SelectableAccordion component for inline item selection within dialogs.
 *
 * In single-select mode (`multiSelect=false`), renders `RadioButton.Item`
 * entries with the indicator on the left. Selection is enforced at the
 * RNP `RadioButton.Group` level.
 *
 * In multi-select mode (`multiSelect=true`), renders `Chip` items in a
 * flex-wrap row; the parent manages toggle state.
 *
 * @param props - The component props
 * @returns JSX element representing an inline selectable accordion
 */
export function SelectableAccordion({
  testID,
  title,
  items,
  selectedValues,
  onPress,
  multiSelect = false,
  numColumns = 2,
  allSelectedLabel,
  onToggleAll,
}: SelectableAccordionProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const allItemsSelected: boolean = items.length > 0 && selectedValues.length === items.length;
  const allSelected: boolean = !!allSelectedLabel && selectedValues.length === items.length;
  const description = allSelected
    ? allSelectedLabel
    : items
        .filter(item => selectedValues.includes(item.value))
        .map(item => item.label)
        .join(', ');

  return (
    <List.Accordion
      testID={testID}
      title={title}
      description={description}
      expanded={expanded}
      onPress={() => setExpanded(!expanded)}
      style={[styles.accordion, { backgroundColor: colors.elevation.level1 }]}
    >
      {multiSelect ? (
        <>
          {onToggleAll && (
            <View style={styles.toggleAllRow}>
              <Button
                testID={testID + '::ToggleAllButton'}
                mode='text'
                onPress={onToggleAll}
                compact={true}
                style={styles.toggleAllButton}
              >
                {allItemsSelected ? t('deselect_all') : t('select_all')}
              </Button>
            </View>
          )}
          <FlatList
            testID={testID + '::List'}
            data={items}
            numColumns={numColumns}
            scrollEnabled={false}
            keyExtractor={selectableItemKeyExtractor}
            contentContainerStyle={styles.itemContainer}
            columnWrapperStyle={styles.itemRow}
            renderItem={({ item }: ListRenderItemInfo<SelectableItem>) => (
              <SelectableChip
                testID={testID}
                item={item}
                isSelected={selectedValues.includes(item.value)}
                selectedColor={colors.primary}
                onPress={onPress}
              />
            )}
          />
        </>
      ) : (
        <View testID={testID + '::RadioGroup'} {...{ value: selectedValues[0] ?? '' }}>
          <RadioButton.Group value={selectedValues[0] ?? ''} onValueChange={onPress}>
            <FlatList
              testID={testID + '::List'}
              data={items}
              numColumns={numColumns}
              scrollEnabled={false}
              keyExtractor={selectableItemKeyExtractor}
              contentContainerStyle={styles.itemContainer}
              columnWrapperStyle={styles.itemRow}
              renderItem={({ item }: ListRenderItemInfo<SelectableItem>) => (
                <SelectableRadioItem testID={testID} item={item} onPress={onPress} />
              )}
            />
          </RadioButton.Group>
        </View>
      )}
    </List.Accordion>
  );
}

const styles = StyleSheet.create({
  accordion: {
    borderRadius: padding.small,
    paddingVertical: 0,
  },
  itemContainer: {
    padding: padding.small,
    gap: padding.verySmall,
  },
  itemRow: {
    gap: padding.verySmall,
  },
  chip: {
    flex: 1,
  },
  radioItemWrapper: {
    width: '50%',
  },
  radioItem: {
    paddingHorizontal: padding.verySmall,
    paddingVertical: padding.verySmall,
    justifyContent: 'flex-start',
  },
  toggleAllRow: {
    alignItems: 'flex-end',
    paddingHorizontal: padding.small,
    paddingTop: padding.small,
  },
  toggleAllButton: {
    alignSelf: 'flex-end',
  },
});
