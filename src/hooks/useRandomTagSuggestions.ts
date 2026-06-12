/**
 * useRandomTagSuggestions - Cached random tag suggestions for add-mode routes.
 *
 * The three add-mode route wrappers (`RecipeAddManual`, `RecipeAddOcr`,
 * `RecipeAddScrape`) each seed `RecipeFormScreen` with a small set of random
 * tag names used as suggestion chips. Computing this list runs a DB read
 * (`useTags().searchRandomlyTags`) on every route mount, which compounds on
 * the common navigation path Add -> cancel -> Add again.
 *
 * This hook caches the resolved names in a module-scoped slot with a short
 * TTL so re-entry within the window reuses the cached list and skips the DB
 * read. The cache returns a stable array reference per fresh window which the
 * caller can pass straight to props without identity churn between mounts.
 *
 * The TTL is exported so tests can drive the cache deterministically.
 *
 * @module useRandomTagSuggestions
 */

import { useState } from 'react';
import { useTags } from '@hooks/useTags';

/**
 * Cache lifetime in milliseconds. After this window the next call refetches
 * via `useTags().searchRandomlyTags` and replaces the cached entry.
 */
export const RANDOM_TAG_SUGGESTIONS_TTL_MS = 60_000;

type CacheEntry = {
  tags: string[];
  timestamp: number;
};

let cache: CacheEntry | null = null;

/**
 * Internal: returns the cached tag names when the slot is populated and the
 * entry is still inside the TTL window relative to `now`. Returns `null`
 * otherwise so the caller refetches.
 */
function readFreshCache(now: number): string[] | null {
  if (cache === null) return null;
  if (now - cache.timestamp >= RANDOM_TAG_SUGGESTIONS_TTL_MS) return null;
  return cache.tags;
}

/**
 * Test-only entry point to clear the module-level cache between tests so each
 * test runs against a clean slate. Not part of the public hook contract.
 */
export function __resetRandomTagSuggestionsCache(): void {
  cache = null;
}

/**
 * Returns up to three random tag names for the recipe-form suggestion chips.
 *
 * Reads from a short-lived module cache when fresh, otherwise refetches via
 * `useTags().searchRandomlyTags(3)` and updates the cache. The returned array
 * is read lazily by a `useState` initializer so the hook's React identity is
 * stable across re-renders.
 */
export function useRandomTagSuggestions(): string[] {
  const { searchRandomlyTags } = useTags();
  const [tags] = useState<string[]>(() => {
    const now = Date.now();
    const cached = readFreshCache(now);
    if (cached !== null) {
      return cached;
    }
    const fresh = searchRandomlyTags(3).map(tag => tag.name);
    cache = { tags: fresh, timestamp: now };
    return fresh;
  });
  return tags;
}
