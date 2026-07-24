/**
 * idle - Cooperative idle-time scheduling
 *
 * Schedules non-critical work to run when the JavaScript thread is idle, so it
 * does not compete with navigation transitions, list scrolling or gesture
 * handling for the same frame budget. Backed by React's `scheduler` package at
 * idle priority — the same cooperative priority queue the React runtime uses to
 * interleave work — so idle tasks yield to renders, gestures and transitions and
 * run only once nothing more urgent is pending.
 *
 * This is deliberately not `requestIdleCallback`: React Native (Hermes / JSC)
 * does not provide that DOM API, so a wrapper around it would silently degrade
 * to a plain `setTimeout` on device. `scheduler` ships with React, works
 * uniformly across engines, and is the primitive `requestIdleCallback` polyfills
 * themselves delegate to.
 *
 * Use this for work whose result is not needed for the current frame but is
 * worth doing before the user asks for it — e.g. warming a search index after
 * its corpus changes so the first query is instant.
 *
 * @module idle
 */

import {
  unstable_IdlePriority as IdlePriority,
  unstable_scheduleCallback as scheduleCallback,
  unstable_cancelCallback as cancelCallback,
} from 'scheduler';

/**
 * Opaque handle returned by {@link runWhenIdle} and consumed by
 * {@link cancelIdle}. Wraps the scheduler task so callers never depend on its
 * shape.
 */
export type IdleHandle = ReturnType<typeof scheduleCallback>;

/**
 * Schedules `callback` to run when the JS thread is idle.
 *
 * The callback is enqueued at the scheduler's idle priority: it runs only once
 * higher-priority work (renders, gestures, transitions) has drained, and the
 * scheduler yields back to that work if it arrives mid-flush. Always pair with
 * {@link cancelIdle} to release work that is no longer needed — e.g. on unmount
 * or when its input changes.
 *
 * @param callback - Work to run during idle time
 * @returns Handle that cancels the scheduled work via {@link cancelIdle}
 */
export function runWhenIdle(callback: () => void): IdleHandle {
  return scheduleCallback(IdlePriority, callback);
}

/**
 * Cancels work scheduled by {@link runWhenIdle}. Safe to call after the callback
 * has already run; the scheduler ignores stale handles.
 *
 * @param handle - Handle returned by {@link runWhenIdle}
 */
export function cancelIdle(handle: IdleHandle): void {
  cancelCallback(handle);
}
