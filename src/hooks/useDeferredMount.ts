/**
 * useDeferredMount - Defer a heavy subtree to a lower-priority render
 *
 * Returns `false` on the first (high-priority) render and `true` on a
 * subsequent render that React schedules at transition priority, via
 * `useDeferredValue`'s initial-value form.
 *
 * Gate expensive subtrees (long lists, form-heavy dialogs) behind the returned
 * flag so the opening frame — a navigation transition or a dialog entrance —
 * paints immediately and the heavy work reconciles right after, without
 * blocking the animation. Unlike `InteractionManager.runAfterInteractions`,
 * this stays inside React's concurrent model: the deferred render is
 * interruptible and needs no timers or manual cleanup.
 *
 * @module useDeferredMount
 */

import { useDeferredValue } from 'react';

/**
 * Signals whether the deferred (post-first-paint) render has occurred.
 *
 * @returns `false` on the initial render, then `true` once React commits the
 *   deferred render. Stays `true` for the lifetime of the component.
 */
export function useDeferredMount(): boolean {
  return useDeferredValue(true, false);
}
