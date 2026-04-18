/**
 * DatabaseMetaContext - Focused context for database initialization status and metadata operations
 *
 * Provides database readiness state, scaling progress, dataset load errors, and
 * import history operations. Consumers of this context only re-render when
 * initialization status or error state changes, not on recipe/ingredient mutations.
 *
 * @example
 * ```typescript
 * function LoadingGate() {
 *   const { isDatabaseReady } = useDatabaseMeta();
 *   if (!isDatabaseReady) return <Spinner />;
 *   return <App />;
 * }
 * ```
 */

import { createContext, useContext } from 'react';

/**
 * Type definition for database metadata context
 */
export interface DatabaseMetaContextType {
  /** Indicates whether database data is loaded and ready to use */
  isDatabaseReady: boolean;
  /** Current progress of recipe scaling operation (0-100), undefined if not scaling */
  scalingProgress: number | undefined;
  /** Dataset loading error - app is usable but initial recipes won't be loaded */
  datasetLoadError: string | undefined;
  /** Dismisses the dataset load error notification */
  dismissDatasetLoadError: () => void;
  /** Checks if database is empty (for first launch detection) */
  isDatabaseEmpty: () => boolean;
  /** Gets URLs that have been imported from a specific provider */
  getImportedSourceUrls: (providerId: string) => Set<string>;
  /** Gets URLs that have been seen (but not imported) from a specific provider */
  getSeenUrls: (providerId: string) => Set<string>;
  /** Marks URLs as seen for a specific provider */
  markUrlsAsSeen: (providerId: string, urls: string[]) => Promise<void>;
  /** Removes URLs from seen history for a specific provider */
  removeFromSeenHistory: (providerId: string, urls: string[]) => Promise<void>;
}

export const DatabaseMetaContext = createContext<DatabaseMetaContextType | undefined>(undefined);

/**
 * useDatabaseMeta - Hook for accessing database initialization status and metadata operations
 *
 * @returns DatabaseMetaContextType with readiness state and import history operations
 * @throws Error if used outside RecipeDatabaseProvider
 */
export const useDatabaseMeta = (): DatabaseMetaContextType => {
  const context = useContext(DatabaseMetaContext);
  if (!context) {
    throw new Error('useDatabaseMeta must be used within a RecipeDatabaseProvider');
  }
  return context;
};
