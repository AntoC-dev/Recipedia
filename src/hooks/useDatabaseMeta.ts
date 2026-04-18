/**
 * useDatabaseMeta - Hook for imperative database metadata operations
 *
 * Thin wrapper around the RecipeDatabase singleton for operations that are
 * not reactive (import history, emptiness check). These methods are called
 * imperatively at specific points in workflows rather than being subscribed
 * to continuously.
 *
 * For the reactive database readiness boolean use `useDatabaseReady`.
 *
 * @module useDatabaseMeta
 */

import { RecipeDatabase } from '@utils/RecipeDatabase';

/**
 * Provides imperative database metadata operations.
 *
 * All returned functions call through to the RecipeDatabase singleton directly.
 * No reactive subscriptions — consuming components do not re-render when import
 * history changes.
 *
 * @returns Object containing `isDatabaseEmpty`, `getImportedSourceUrls`,
 *   `getSeenUrls`, `markUrlsAsSeen` and `removeFromSeenHistory`
 */
export function useDatabaseMeta() {
  const db = RecipeDatabase.getInstance();

  const isDatabaseEmpty = (): boolean => {
    return db.isDatabaseEmpty();
  };

  const getImportedSourceUrls = (providerId: string): Set<string> => {
    return db.getImportedSourceUrls(providerId);
  };

  const getSeenUrls = (providerId: string): Set<string> => {
    return db.getSeenUrls(providerId);
  };

  const markUrlsAsSeen = async (providerId: string, urls: string[]): Promise<void> => {
    await db.markUrlsAsSeen(providerId, urls);
  };

  const removeFromSeenHistory = async (providerId: string, urls: string[]): Promise<void> => {
    await db.removeFromSeenHistory(providerId, urls);
  };

  return {
    isDatabaseEmpty,
    getImportedSourceUrls,
    getSeenUrls,
    markUrlsAsSeen,
    removeFromSeenHistory,
  };
}
