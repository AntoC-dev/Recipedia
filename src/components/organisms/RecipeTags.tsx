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
 *   editType="edit"
 *   tagsList={currentTags}
 *   randomTags="Try: breakfast, comfort food, spicy"
 *   addNewTag={(tag) => setTags([...tags, tag])}
 *   removeTag={(tag) => setTags(tags.filter(t => t !== tag))}
 * />
 *
 * // Tags with OCR scanning capability
 * <RecipeTags
 *   type="addOrEdit"
 *   editType="add"
 *   tagsList={recipeTags}
 *   randomTags="Suggested: dessert, chocolate"
 *   addNewTag={handleTagAdd}
 *   removeTag={handleTagRemove}
 *   openModal={() => openOCRScanner()}
 * />
 * ```
 */

import { View } from 'react-native';
import React, { useState } from 'react';
import { RoundButton } from '@components/atomic/RoundButton';
import { Icons } from '@assets/Icons';
import { HorizontalList } from '@components/molecules/HorizontalList';
import { TextInputWithDropDown } from '@components/molecules/TextInputWithDropDown';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
import { recipeTagsStyles } from '@styles/recipeComponents';
import { Text, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';

/** Props for edit mode without OCR */
export type RecipeTagsEditProps = { editType: 'edit' };

/** Props for add mode with OCR functionality */
export type RecipeTagsAddProps = { editType: 'add'; openModal: () => void };

/** Props for add/edit modes with discriminated union */
export type RecipeTagsAddOrEditProps = {
  type: 'addOrEdit';
  /** Random tag suggestions to display to user */
  randomTags: string;
  /** Callback fired when a new tag is added */
  addNewTag: (newTag: string) => void;
  /** Callback fired when a tag is removed */
  removeTag: (tag: string) => void;
  /** Force hide the dropdown (e.g., during scroll) */
  hideDropdown?: boolean;
} & (RecipeTagsEditProps | RecipeTagsAddProps);

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
  const { tags } = useRecipeDatabase();
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
                  hideDropdown={tagsProps.hideDropdown}
                  onValidate={(newText: string) => {
                    tagsProps.addNewTag(newText);
                    setNewTags(newTags.filter(itemToFilter => itemToFilter !== item));
                  }}
                />
              </View>
            ))}

            <View style={recipeTagsStyles.roundButtonsContainer}>
              {tagsProps.editType === 'add' ? (
                <View style={recipeTagsStyles.roundButton}>
                  <RoundButton
                    testID={tagsTestID + '::OpenModal'}
                    size={'medium'}
                    icon={Icons.scanImageIcon}
                    onPressFunction={tagsProps.openModal}
                  />
                </View>
              ) : null}
              <View style={recipeTagsStyles.roundButton}>
                <RoundButton
                  testID={tagsTestID}
                  size={'medium'}
                  icon={Icons.plusIcon}
                  onPressFunction={() => {
                    setNewTags([...newTags, tagsAddedCounter]);
                    setTagsAddedCounter(tagsAddedCounter + 1);
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

export default RecipeTags;
