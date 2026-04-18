/**
 * useDatabaseReady - Hook for observing database initialization state
 *
 * Subscribes to the `ready` slice of the RecipeDatabase singleton via
 * `useSyncExternalStore`. Returns `true` exactly once, after `db.init()`
 * completes, and reverts to `false` after `db.closeAndReset()` (test teardown).
 *
 * Use this hook in the root component tree to gate rendering behind database
 * readiness, replacing the old `isDatabaseReady` value from `useRecipeDatabase()`.
 *
 * @module useDatabaseReady
 */

import { useSyncExternalStore } from 'react';
import { RecipeDatabase } from '@utils/RecipeDatabase';

/**
 * Returns whether the RecipeDatabase singleton has finished initializing.
 *
 * @returns `true` after `db.init()` resolves, `false` before or after reset
 */
export function useDatabaseReady(): boolean {
  const db = RecipeDatabase.getInstance();
  return useSyncExternalStore(
    cb => db.subscribe('ready', cb),
    () => db.isReady()
  );
}
