/**
 * DatabasePickerDialog - Searchable list dialog for selecting items from the database
 *
 * A reusable dialog that presents a searchable, virtualized list of database items
 * (ingredients or tags). Users can filter items by name and tap to select one.
 * Uses FlashList for efficient rendering of large lists.
 *
 * @example
 * ```typescript
 * <DatabasePickerDialog
 *   testId="ingredient-picker"
 *   isVisible={showPicker}
 *   title="Pick an ingredient"
 *   items={sortedIngredients}
 *   onSelect={(item) => handlePicked(item)}
 *   onDismiss={() => setShowPicker(false)}
 * />
 * ```
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, List, Portal, Searchbar, Text, useTheme } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useI18n } from '@utils/i18n';
import { padding, screenHeight } from '@styles/spacing';

/**
 * Props for the DatabasePickerDialog component
 * @template T - Item type that must have at least a `name` property
 */
export type DatabasePickerDialogProps<T extends { name: string }> = {
  testId: string;
  isVisible: boolean;
  title: string;
  items: T[];
  onSelect: (item: T) => void;
  onDismiss: () => void;
};

const styles = StyleSheet.create({
  searchbar: {
    marginBottom: padding.medium,
    borderRadius: padding.extraLarge,
  },
  searchResults: {
    height: screenHeight * 0.4,
    overflow: 'hidden',
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: padding.large,
  },
});

/**
 * A searchable dialog for picking items from the database.
 * Uses FlashList for virtualized rendering of large item lists.
 *
 * @template T - Item type extending `{ name: string }`
 */
export function DatabasePickerDialog<T extends { name: string }>({
  testId,
  isVisible,
  title,
  items,
  onSelect,
  onDismiss,
}: DatabasePickerDialogProps<T>) {
  const { t } = useI18n();
  const { colors } = useTheme();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    debounceTimerRef.current = setTimeout(() => setDebouncedQuery(searchInput), 300);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchInput]);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const handleDismiss = () => {
    setSearchInput('');
    setDebouncedQuery('');
    onDismiss();
  };

  const handleSelect = (item: T) => {
    setSearchInput('');
    setDebouncedQuery('');
    onSelect(item);
  };

  return (
    <Portal>
      <Dialog visible={isVisible} onDismiss={handleDismiss} testID={testId}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Searchbar
            testID={`${testId}::Searchbar`}
            placeholder={t('alerts.databasePicker.searchPlaceholder')}
            value={searchInput}
            onChangeText={setSearchInput}
            style={[styles.searchbar, { backgroundColor: colors.background }]}
          />
          <View style={styles.searchResults}>
            <FlashList
              keyboardDismissMode='on-drag'
              data={filteredItems}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              renderItem={({ item, index }) => (
                <List.Item
                  testID={`${testId}::Item::${index}`}
                  title={item.name}
                  onPress={() => handleSelect(item)}
                />
              )}
              ListEmptyComponent={
                <Text style={styles.noResults} variant='bodyMedium'>
                  {t('alerts.databasePicker.noResults')}
                </Text>
              }
            />
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button testID={`${testId}::CancelButton`} onPress={handleDismiss}>
            {t('cancel')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
