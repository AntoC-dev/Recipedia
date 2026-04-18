/**
 * TagDataContext - Focused context for tag state and CRUD operations
 *
 * Provides reactive access to the tag collection and all tag mutations.
 * Consumers re-render only when tags change, isolating them from recipe,
 * ingredient, or menu updates.
 *
 * @example
 * ```typescript
 * function TagsSettings() {
 *   const { tags, addTag, deleteTag } = useTags();
 *   return <SettingsItemList items={tags} onDelete={deleteTag} />;
 * }
 * ```
 */

import { createContext, useContext } from 'react';
import { tagTableElement } from '@customTypes/DatabaseElementTypes';

/**
 * Type definition for the tag data context
 */
export interface TagDataContextType {
  /** Current tags state - reactive, triggers re-renders when changed */
  tags: tagTableElement[];
  /** Adds tag to database and refreshes tags state */
  addTag: (tag: tagTableElement) => Promise<tagTableElement>;
  /** Edits tag in database and refreshes both tags AND recipes state */
  editTag: (tag: tagTableElement) => Promise<boolean>;
  /** Deletes tag from database and refreshes both tags AND recipes state */
  deleteTag: (tag: tagTableElement) => Promise<boolean>;
  /** Finds tags similar to the given name using fuzzy matching */
  findSimilarTags: (tagName: string) => tagTableElement[];
  /** Returns random tags */
  getRandomTags: (count: number) => tagTableElement[];
  /** Returns random tags (legacy method) */
  searchRandomlyTags: (count: number) => tagTableElement[];
  /** Adds multiple tags to database and refreshes tags state */
  addMultipleTags: (tags: tagTableElement[]) => Promise<void>;
}

export const TagDataContext = createContext<TagDataContextType | undefined>(undefined);

/**
 * useTags - Hook for accessing tag state and operations
 *
 * @returns TagDataContextType with current tags and all tag CRUD operations
 * @throws Error if used outside RecipeDatabaseProvider
 */
export const useTags = (): TagDataContextType => {
  const context = useContext(TagDataContext);
  if (!context) {
    throw new Error('useTags must be used within a RecipeDatabaseProvider');
  }
  return context;
};
