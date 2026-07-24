/**
 * useWarmSearchIndex - Idle-time fuzzy search index warming
 *
 * Rebuilds a corpus-keyed fuzzy search index during idle time whenever its
 * corpus changes, so the expensive `buildItemIndex` pass runs off the critical
 * path instead of synchronously on the user's first keystroke. Pairs with the
 * `makeItemIndexCache` getters that back `useTags` / `useIngredients`: warming
 * populates their `WeakMap` cache for the current corpus reference, turning the
 * first real search into a cache hit.
 *
 * @module useWarmSearchIndex
 */

import { useEffect } from 'react';
import { cancelIdle, runWhenIdle } from '@utils/idle';

/**
 * Warms a corpus-keyed search index during idle time after the corpus changes.
 *
 * On each new `corpus` reference, schedules `build(corpus)` via
 * {@link runWhenIdle}. The build result is discarded — the point is the side
 * effect of populating `build`'s internal cache. A pending warm is cancelled
 * when the corpus changes again or the consumer unmounts, so a fast sequence of
 * mutations only ever warms the latest corpus.
 *
 * @typeParam T - Corpus element type
 * @param build - Corpus-keyed index builder (e.g. a `makeItemIndexCache` getter)
 * @param corpus - Current corpus array; a new reference triggers a fresh warm
 */
export function useWarmSearchIndex<T>(build: (corpus: T[]) => unknown, corpus: T[]): void {
  useEffect(() => {
    if (corpus.length === 0) {
      return;
    }
    const handle = runWhenIdle(() => {
      build(corpus);
    });
    return () => cancelIdle(handle);
  }, [build, corpus]);
}
