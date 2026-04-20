/**
 * useImportHistory - Hook for bulk import URL history operations
 *
 * Thin wrapper around the RecipeDatabase singleton for import history queries.
 * These methods are called imperatively at specific points in bulk import
 * workflows rather than being subscribed to continuously.
 *
 * @module useImportHistory
 */

import { RecipeDatabase } from '@utils/RecipeDatabase';

/**
 * Provides imperative access to bulk import URL history.
 *
 * All returned functions call through to the RecipeDatabase singleton directly.
 * No reactive subscriptions — consuming components do not re-render when import
 * history changes.
 *
 * @returns Object containing `getImportedSourceUrls`, `getSeenUrls`,
 *   `markUrlsAsSeen` and `removeFromSeenHistory`
 */
export function useImportHistory() {
  const db = RecipeDatabase.getInstance();

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
    getImportedSourceUrls,
    getSeenUrls,
    markUrlsAsSeen,
    removeFromSeenHistory,
  };
}
