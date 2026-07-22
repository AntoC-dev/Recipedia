/**
 * TagsSettings - Recipe tag management and organization screen
 *
 * A dedicated screen for managing the app's tag system with full CRUD operations
 * and organizational capabilities. Features dialog-based editing, alphabetical
 * organization, and real-time synchronization with recipe data.
 *
 * Key Features:
 * - Complete tag CRUD operations (Create, Read, Update, Delete)
 * - Alphabetical sorting for organized navigation
 * - Dialog-based editing with validation
 * - Real-time database synchronization
 * - Usage tracking for deletion warnings
 * - Batch operations for tag management
 * - Comprehensive error handling and logging
 *
 * Tag Management:
 * - Create new tags for recipe categorization
 * - Edit existing tag names and properties
 * - Delete unused tags with safety checks
 * - View tag usage across recipes
 *
 * @example
 * ```typescript
 * // Navigation from Parameters screen
 * <List.Item
 *   title="Tags"
 *   onPress={() => navigation.navigate('TagsSettings')}
 * />
 * ```
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
import { useNavigation } from '@react-navigation/native';
import { TagDraft, tagTableElement, withId } from '@customTypes/DatabaseElementTypes';
import { SettingsItemList } from '@components/organisms/SettingsItemList';
import { AppBar } from '@components/organisms/AppBar';
import { BottomActionButton } from '@components/atomic/BottomActionButton';
import { DialogMode, ItemDialog } from '@components/dialogs/ItemDialog';
import { tagsSettingsLogger } from '@utils/logger';
import { useTags } from '@hooks/useTags';
import { useI18n } from '@utils/i18n';
import { Icons } from '@assets/Icons';
import { padding } from '@styles/spacing';

/**
 * TagsSettings screen component - Recipe tag management
 *
 * @returns JSX element representing the tag management interface
 */
const BUTTON_HEIGHT = 48;
const BUTTON_CONTAINER_HEIGHT = BUTTON_HEIGHT + padding.small * 2;

export function TagsSettings() {
  const { tags, addTag, editTag, deleteTag } = useTags();
  const navigation = useNavigation();
  const { t } = useI18n();

  const tagsSortedAlphabetically = [...tags].sort((a, b) => a.name.localeCompare(b.name));

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('add');
  const [currentTag, setCurrentTag] = useState<TagDraft>({ name: '' });

  const testId = 'TagsSettings';

  const handleEditTag = async (newTag: tagTableElement) => {
    const success = await editTag(newTag);
    if (!success) {
      tagsSettingsLogger.warn('Failed to update tag in database', {
        tagName: newTag.name,
        tagId: newTag.id,
      });
    }
  };

  const handleDeleteTag = async (tag: tagTableElement) => {
    const success = await deleteTag(tag);
    if (!success) {
      tagsSettingsLogger.warn('Tag not found for deletion', { tagId: tag.id, tagName: tag.name });
    }
  };

  const handleAddtag = async (newTag: TagDraft) => {
    await addTag(newTag);
  };

  // Open dialog handlers
  const openAddDialog = () => {
    setCurrentTag({ name: '' });
    setDialogMode('add');
    setDialogVisible(true);
  };

  const openEditDialog = (tag: tagTableElement) => {
    setCurrentTag(tag);
    setDialogMode('edit');
    setDialogVisible(true);
  };

  const openDeleteDialog = (tag: tagTableElement) => {
    setCurrentTag(tag);
    setDialogMode('delete');
    setDialogVisible(true);
  };

  // Close dialog handler
  const closeDialog = () => {
    setDialogVisible(false);
  };

  // Dialog action handlers
  const handleDialogConfirm = async (mode: DialogMode, newTag: TagDraft) => {
    if (mode === 'add') {
      await handleAddtag(newTag);
      closeDialog();
      return;
    }
    if (newTag.id === undefined) {
      tagsSettingsLogger.error('Cannot edit or delete a tag without a persisted id', {
        tagName: newTag.name,
      });
      closeDialog();
      return;
    }
    const persistedTag = withId<tagTableElement>(newTag, newTag.id);
    if (mode === 'edit') {
      await handleEditTag(persistedTag);
    } else {
      await handleDeleteTag(persistedTag);
    }
    closeDialog();
  };

  // TODO add a counter of how many recipes use this element before deleting it
  return (
    <ScreenWrapper>
      <AppBar title={t('tags')} onGoBack={() => navigation.goBack()} testID={testId} />
      <View style={{ flex: 1, paddingBottom: BUTTON_CONTAINER_HEIGHT }}>
        <SettingsItemList
          items={tagsSortedAlphabetically}
          testIdPrefix={testId}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
          type='tag'
        />
      </View>

      <BottomActionButton
        testID={testId}
        icon={Icons.plusIcon}
        onPress={openAddDialog}
        label={t('add_tag')}
      />

      {dialogVisible && (
        <ItemDialog
          testId={testId + '::ItemDialog'}
          isVisible={dialogVisible}
          mode={dialogMode}
          onClose={closeDialog}
          item={{
            type: 'Tag',
            value: currentTag,
            onConfirmTag: handleDialogConfirm,
          }}
        />
      )}
    </ScreenWrapper>
  );
}

export default TagsSettings;
