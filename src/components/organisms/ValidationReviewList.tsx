/**
 * ValidationReviewList - Inline review list for bulk import validation
 *
 * Displays all tags and ingredients needing validation in a virtualized FlashList.
 * Each item shows inline actions (use suggestion, add new, pick, skip).
 * Opens ItemDialog for "Add New" and DatabasePickerDialog for "Pick" flows.
 *
 * @module components/organisms/ValidationReviewList
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, Text, useTheme } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import {
  FormIngredientElement,
  ingredientTableElement,
  TagDraft,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import {
  IngredientReviewItem,
  ResolutionMappings,
  TagReviewItem,
  ValidationResolution,
} from '@customTypes/ValidationTypes';
import { useValidationReviewState } from '@hooks/useValidationReviewState';
import { mergeIngredient } from '@utils/RecipeValidationHelpers';
import { ValidationReviewItem } from '@components/molecules/ValidationReviewItem';
import { ItemDialog } from '@components/dialogs/ItemDialog';
import { DatabasePickerDialog } from '@components/dialogs/DatabasePickerDialog';
import { BottomActionButton } from '@components/atomic/BottomActionButton';
import { useTags } from '@hooks/useTags';
import { useIngredients } from '@hooks/useIngredients';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';
import { Icons } from '@assets/Icons';

const LIST_BOTTOM_PADDING = 80;

export type ValidationReviewListProps = {
  testID: string;
  rawTags: TagDraft[];
  rawIngredients: FormIngredientElement[];
  onImport: (mappings: ResolutionMappings) => void;
  recipeCount: number;
};

type DialogTarget = {
  type: 'Tag' | 'Ingredient';
  itemName: string;
};

type FlatItem =
  | { kind: 'header'; sectionType: 'Tag' | 'Ingredient'; title: string }
  | { kind: 'item'; sectionType: 'Tag' | 'Ingredient'; item: TagReviewItem | IngredientReviewItem };

type ReviewRowProps = {
  flatItem: FlatItem;
  listTestID: string;
  onUseSuggested: (
    type: 'Tag' | 'Ingredient',
    itemName: string,
    match: tagTableElement | ingredientTableElement,
    original?: IngredientReviewItem
  ) => void;
  onAddNew: (type: 'Tag' | 'Ingredient', itemName: string) => void;
  onPickFromDatabase: (type: 'Tag' | 'Ingredient', itemName: string) => void;
  onSkip: (type: 'Tag' | 'Ingredient', itemName: string) => void;
  onUndo: (type: 'Tag' | 'Ingredient', itemName: string) => void;
};

function ReviewRow({
  flatItem,
  listTestID,
  onUseSuggested,
  onAddNew,
  onPickFromDatabase,
  onSkip,
  onUndo,
}: ReviewRowProps) {
  const { colors } = useTheme();

  if (flatItem.kind === 'header') {
    return (
      <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
        <Text variant='titleMedium' testID={`${listTestID}::${flatItem.sectionType}SectionHeader`}>
          {flatItem.title}
        </Text>
        <Divider style={{ marginTop: padding.small }} />
      </View>
    );
  }

  const { item, sectionType } = flatItem;
  const itemName = item.name ?? '';
  const suggestedMatch = item.similarItems[0];
  const itemTestID = `${listTestID}::${sectionType}::${itemName}`;

  return (
    <ValidationReviewItem
      testID={itemTestID}
      itemType={sectionType}
      itemName={itemName}
      suggestedMatch={suggestedMatch}
      status={item.reviewState.status}
      resolution={item.reviewState.resolution}
      onUseSuggested={() =>
        suggestedMatch &&
        onUseSuggested(
          sectionType,
          itemName,
          suggestedMatch,
          sectionType === 'Ingredient' ? (item as IngredientReviewItem) : undefined
        )
      }
      onAddNew={() => onAddNew(sectionType, itemName)}
      onPickFromDatabase={() => onPickFromDatabase(sectionType, itemName)}
      onSkip={() => onSkip(sectionType, itemName)}
      onUndo={() => onUndo(sectionType, itemName)}
    />
  );
}

/**
 * ValidationReviewList component
 *
 * Renders a virtualized FlashList of all validation items grouped by type (tags and ingredients).
 * Provides inline actions on each card; "Add New" opens ItemDialog and "Pick" opens
 * DatabasePickerDialog directly. Owns review state internally via useValidationReviewState;
 * calls onImport with resolved mappings when the user confirms the import.
 *
 * @param props - Component props
 * @returns JSX element representing the validation review list
 */
export function ValidationReviewList({
  testID,
  rawTags,
  rawIngredients,
  onImport,
  recipeCount,
}: ValidationReviewListProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { tags: dbTags, addTag, findSimilarTags } = useTags();
  const { ingredients: dbIngredients, addIngredient, findSimilarIngredients } = useIngredients();

  const [addNewItem, setAddNewItem] = useState<DialogTarget | null>(null);
  const [pickItem, setPickItem] = useState<DialogTarget | null>(null);

  const {
    tags,
    ingredients,
    allResolved,
    resolveTag,
    resolveIngredient,
    skipTag,
    skipIngredient,
    undoTag,
    undoIngredient,
    getResolutionMappings,
  } = useValidationReviewState(rawTags, rawIngredients, findSimilarTags, findSimilarIngredients);

  const resolvedTagCount = tags.filter(tag => tag.reviewState.status !== 'pending').length;
  const resolvedIngredientCount = ingredients.filter(
    i => i.reviewState.status !== 'pending'
  ).length;

  const listData: FlatItem[] = [];
  const stickyHeaderIndices: number[] = [];

  if (tags.length > 0) {
    stickyHeaderIndices.push(listData.length);
    listData.push({
      kind: 'header',
      sectionType: 'Tag',
      title: t('bulkImport.validation.tagsSection', {
        resolved: resolvedTagCount,
        total: tags.length,
      }),
    });
    tags.forEach(item => listData.push({ kind: 'item', sectionType: 'Tag', item }));
  }
  if (ingredients.length > 0) {
    stickyHeaderIndices.push(listData.length);
    listData.push({
      kind: 'header',
      sectionType: 'Ingredient',
      title: t('bulkImport.validation.ingredientsSection', {
        resolved: resolvedIngredientCount,
        total: ingredients.length,
      }),
    });
    ingredients.forEach(item => listData.push({ kind: 'item', sectionType: 'Ingredient', item }));
  }

  const handleUseSuggested = (
    type: 'Tag' | 'Ingredient',
    itemName: string,
    suggestedMatch: tagTableElement | ingredientTableElement,
    originalItem?: IngredientReviewItem
  ) => {
    const resolution: ValidationResolution = {
      type: 'use-suggested',
      resolvedItem:
        type === 'Ingredient' && originalItem
          ? mergeIngredient(originalItem, suggestedMatch as ingredientTableElement)
          : suggestedMatch,
    };
    if (type === 'Tag') {
      resolveTag(itemName, resolution);
    } else {
      resolveIngredient(itemName, resolution);
    }
  };

  const handlePickSelect = (picked: tagTableElement | ingredientTableElement) => {
    if (!pickItem) {
      return;
    }
    if (pickItem.type === 'Tag') {
      resolveTag(pickItem.itemName, {
        type: 'pick-existing',
        resolvedItem: picked as tagTableElement,
      });
    } else {
      const original = ingredients.find(i => i.name === pickItem.itemName);
      resolveIngredient(pickItem.itemName, {
        type: 'pick-existing',
        resolvedItem: original
          ? mergeIngredient(original, picked as ingredientTableElement)
          : (picked as ingredientTableElement),
      });
    }
    setPickItem(null);
  };

  return (
    <View style={styles.container}>
      <FlashList
        data={listData}
        keyExtractor={(item, index) => `${item.sectionType}-${item.kind}-${index}`}
        renderItem={({ item }) => (
          <ReviewRow
            flatItem={item}
            listTestID={testID}
            onUseSuggested={handleUseSuggested}
            onAddNew={(type, itemName) => setAddNewItem({ type, itemName })}
            onPickFromDatabase={(type, itemName) => setPickItem({ type, itemName })}
            onSkip={(type, itemName) =>
              type === 'Tag' ? skipTag(itemName) : skipIngredient(itemName)
            }
            onUndo={(type, itemName) =>
              type === 'Tag' ? undoTag(itemName) : undoIngredient(itemName)
            }
          />
        )}
        getItemType={item => item.kind}
        stickyHeaderIndices={stickyHeaderIndices}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text
              variant='bodyLarge'
              style={{ color: colors.onSurfaceVariant }}
              testID={`${testID}::ListHeader`}
            >
              {t('bulkImport.validation.reviewSubtitle')}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        testID={`${testID}::List`}
      />

      <BottomActionButton
        testID={testID}
        onPress={() => onImport(getResolutionMappings())}
        label={t('bulkImport.validation.importRecipes', { count: recipeCount })}
        icon={Icons.import}
        disabled={!allResolved}
      />

      {addNewItem && (
        <ItemDialog
          testId={`${testID}::AddNewDialog`}
          isVisible
          mode='add'
          onClose={() => setAddNewItem(null)}
          item={
            addNewItem.type === 'Tag'
              ? {
                  type: 'Tag',
                  value: { id: -1, name: addNewItem.itemName },
                  onConfirmTag: async (_, tag) => {
                    const savedTag = await addTag(tag);
                    resolveTag(addNewItem.itemName, { type: 'add-new', resolvedItem: savedTag });
                    setAddNewItem(null);
                  },
                }
              : {
                  type: 'Ingredient',
                  value: { name: addNewItem.itemName },
                  onConfirmIngredient: async (_, ing) => {
                    const savedIng = await addIngredient(ing);
                    resolveIngredient(addNewItem.itemName, {
                      type: 'add-new',
                      resolvedItem: savedIng,
                    });
                    setAddNewItem(null);
                  },
                }
          }
        />
      )}

      {pickItem && (
        <DatabasePickerDialog
          testId={`${testID}::PickDialog`}
          isVisible
          title={t(
            pickItem.type === 'Tag'
              ? 'bulkImport.validation.pickTagFor'
              : 'bulkImport.validation.pickIngredientFor',
            { name: pickItem.itemName }
          )}
          items={pickItem.type === 'Tag' ? dbTags : dbIngredients}
          onSelect={handlePickSelect}
          onDismiss={() => setPickItem(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: LIST_BOTTOM_PADDING,
  },
  listHeader: {
    paddingHorizontal: padding.small,
    paddingVertical: padding.medium,
  },
  sectionHeader: {
    padding: padding.small,
  },
});
