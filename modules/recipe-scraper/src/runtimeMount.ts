/**
 * Platform-agnostic helpers for lazy Python runtime mounting.
 *
 * On iOS, the Python runtime lives inside a hidden WebView whose mount
 * is deferred until the first scrape call. On Android the runtime is
 * native (Chaquopy) and requires no host-side mount, so these helpers
 * report "already mounted" and never call back.
 *
 * The iOS overrides live in `runtimeMount.ios.ts` (resolved automatically
 * by Metro). This default file covers Android, web, and the test runtime.
 */

/**
 * Reports whether a consumer has requested the Python runtime to mount.
 *
 * Always returns `true` on platforms where no host-side mount is needed.
 *
 * @returns `true` if the runtime is (or doesn't need to be) mounted.
 */
export function isPythonRuntimeRequested(): boolean {
    return true;
}

/**
 * Subscribes to mount-request events for the Python runtime.
 *
 * On platforms with no host-side mount, the callback fires synchronously
 * once and the returned unsubscribe is a no-op.
 *
 * @param callback - Invoked when the runtime mount is requested.
 * @returns Unsubscribe function.
 */
export function subscribeToPythonRuntimeRequest(callback: () => void): () => void {
    callback();
    return () => {};
}
