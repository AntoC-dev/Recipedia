/**
 * useTags - Focused hook for tag data and CRUD operations
 *
 * Subscribes directly to the `tags` slice of the RecipeDatabase singleton via
 * `useSyncExternalStore`. Re-renders only when tag data changes — unaffected by
 * recipe, ingredient or menu mutations.
 *
 * @module useTags
 */

import { useSyncExternalStore } from 'react';
import { RecipeDatabase } from '@utils/RecipeDatabase';
import { tagTableElement } from '@customTypes/DatabaseElementTypes';

/**
 * Provides reactive tag data and all tag operations.
 *
 * Note that `editTag` and `deleteTag` also invalidate the `recipes` slice
 * (handled internally by RecipeDatabase) so recipe consumers re-render too.
 *
 * @returns Object containing reactive `tags` array and all tag mutation functions
 */
export function useTags() {
  const db = RecipeDatabase.getInstance();
  const tags = useSyncExternalStore(
    cb => db.subscribe('tags', cb),
    () => db.get_tags()
  );

  const addTag = async (tag: tagTableElement): Promise<tagTableElement> => {
    return db.addTag(tag);
  };

  const editTag = async (tag: tagTableElement): Promise<boolean> => {
    return db.editTag(tag);
  };

  const deleteTag = async (tag: tagTableElement): Promise<boolean> => {
    return db.deleteTag(tag);
  };

  const findSimilarTags = (tagName: string): tagTableElement[] => {
    return db.findSimilarTags(tagName);
  };

  const getRandomTags = (count: number): tagTableElement[] => {
    return db.getRandomTags(count);
  };

  const searchRandomlyTags = (count: number): tagTableElement[] => {
    return db.searchRandomlyTags(count);
  };

  const addMultipleTags = async (tagsToAdd: tagTableElement[]): Promise<void> => {
    await db.addMultipleTags(tagsToAdd);
  };

  return {
    tags,
    addTag,
    editTag,
    deleteTag,
    findSimilarTags,
    getRandomTags,
    searchRandomlyTags,
    addMultipleTags,
  };
}
