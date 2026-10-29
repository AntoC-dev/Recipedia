/**
 * RecipeTags - Comprehensive tag management component for recipes
 *
 * A sophisticated tag management system that supports both read-only display and
 * interactive editing modes. Features dynamic tag addition, autocomplete functionality,
 * OCR integration for tag extraction, and seamless CRUD operations.
 *
 * Key Features:
 * - Dual mode operation: read-only display and interactive editing
 * - Dynamic tag addition with autocomplete suggestions
 * - Tag removal functionality with intuitive UI
 * - OCR integration for tag extraction from images
 * - Performance-optimized with FlashList for dynamic inputs
 * - Database integration for tag suggestions
 * - Real-time filtering of available vs used tags
 * - Responsive layout with horizontal tag display
 *
 * @example
 * ```typescript
 * // Read-only tag display
 * <RecipeTags
 *   type="readOnly"
 *   tagsList={['vegetarian', 'quick', 'healthy']}
 * />
 *
 * // Editable tags with manual addition
 * <RecipeTags
 *   type="addOrEdit"
 *   tagsList={currentTags}
 *   randomTags="Try: breakfast, comfort food, spicy"
 *   addNewTag={(tag) => setTags([...tags, tag])}
 *   removeTag={(tag) => setTags(tags.filter(t => t !== tag))}
 * />
 * ```
 */

import { View } from 'react-native';
import React, { useState } from 'react';
import { RoundButton } from '@components/atomic/RoundButton';
import { ScanButton } from '@components/molecules/ScanButton';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import { Icons } from '@assets/Icons';
import { HorizontalList } from '@components/molecules/HorizontalList';
import { TextInputWithDropDown } from '@components/molecules/TextInputWithDropDown';
import { useTags } from '@hooks/useTags';
import { recipeButtonStyles, recipeTagsStyles } from '@styles/recipeComponents';
import { Text, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';

/** Props for add/edit modes; the Scan button renders only when `withScan` is set */
export type RecipeTagsAddOrEditProps = {
  type: 'addOrEdit';
  /** Renders the Scan button targeting the tags field (OCR mode) */
  withScan?: boolean;
  /** Random tag suggestions to display to user */
  randomTags: string;
  /** Callback fired when a new tag is added */
  addNewTag: (newTag: string) => void;
  /** Callback fired when a tag is removed */
  removeTag: (tag: string) => void;
};

/** Props for read-only mode */
export type RecipeTagsReadOnlyProps = { type: 'readOnly' };

/**
 * Props for the RecipeTags component
 */
export type RecipeTagProps = {
  /** Array of current tags */
  tagsList: string[];
} & (RecipeTagsReadOnlyProps | RecipeTagsAddOrEditProps);

/**
 * RecipeTags component for comprehensive tag management
 *
 * @param tagsProps - The component props with mode-specific configuration
 * @returns JSX element representing a tag management interface
 */
export function RecipeTags(tagsProps: RecipeTagProps) {
  const { tags } = useTags();
  const [newTags, setNewTags] = useState<number[]>([]);
  const [tagsAddedCounter, setTagsAddedCounter] = useState(0);

  const allTagsNamesSorted = tags
    .map(tag => tag.name)
    .filter(dbTag => !tagsProps.tagsList.includes(dbTag))
    .sort();

  const { t } = useI18n();
  const { colors } = useTheme();
  const tagsTestID = 'RecipeTags';

  return (
    <View style={recipeTagsStyles.containerSection}>
      {tagsProps.type === 'readOnly' ? (
        <HorizontalList testID={tagsTestID} propType={'Tag'} item={tagsProps.tagsList} />
      ) : (
        <View>
          <Text
            testID={tagsTestID + '::HeaderText'}
            variant={'headlineSmall'}
            style={recipeTagsStyles.containerElement}
          >
            {t('tags')}:
          </Text>
          <Text
            testID={tagsTestID + '::ElementText'}
            variant={'labelMedium'}
            style={[recipeTagsStyles.containerElement, { color: colors.outline }]}
          >
            {t('tagExplanation')}
            {tagsProps.randomTags}
          </Text>

          <View style={recipeTagsStyles.tagsContainer}>
            <View style={recipeTagsStyles.tab}>
              <HorizontalList
                testID={'RecipeTags'}
                propType={'Tag'}
                item={tagsProps.tagsList}
                icon={Icons.crossIcon}
                onPress={tagsProps.removeTag}
              />
            </View>
            {newTags.map(item => (
              <View key={item}>
                <TextInputWithDropDown
                  style={recipeTagsStyles.containerSection}
                  testID={tagsTestID + '::List::' + item}
                  referenceTextArray={allTagsNamesSorted}
                  onValidate={(newText: string) => {
                    if (!newText || newText.trim().length === 0) {
                      return;
                    }
                    tagsProps.addNewTag(newText);
                    setNewTags(prev => prev.filter(itemToFilter => itemToFilter !== item));
                  }}
                />
              </View>
            ))}

            <View style={recipeButtonStyles.roundButtonsContainer}>
              {tagsProps.withScan ? (
                <ScanButton
                  testID={tagsTestID + '::OpenModal'}
                  field={recipeColumnsNames.tags}
                  style={recipeButtonStyles.roundButton}
                />
              ) : null}
              <View style={recipeButtonStyles.roundButton}>
                <RoundButton
                  testID={tagsTestID}
                  icon={Icons.plusIcon}
                  label={t('recipe.roundButton.newTag')}
                  onPressFunction={() => {
                    setNewTags(prev => [...prev, tagsAddedCounter]);
                    setTagsAddedCounter(prev => prev + 1);
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
