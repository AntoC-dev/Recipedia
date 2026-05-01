/**
 * iOS implementation of Python runtime mount helpers.
 *
 * Proxies to {@link PyodideBridge} so the host app can lazily mount the
 * PyodideWebView only when a scrape call has actually been issued.
 */

let mountRequested = false;
const subscribers = new Set<() => void>();

/**
 * Triggers a mount request and notifies all subscribers.
 * Call this when the first scrape is initiated.
 */
export function requestPythonRuntime(): void {
    if (mountRequested) return;
    mountRequested = true;
    subscribers.forEach(cb => cb());
    subscribers.clear();
}

/**
 * Reports whether a consumer has already requested the PyodideWebView to mount.
 */
export function isPythonRuntimeRequested(): boolean {
    return mountRequested;
}

/**
 * Subscribes to mount-request events. The callback fires the first time
 * `requestPythonRuntime()` is called.
 *
 * @param callback - Invoked when the WebView mount is requested.
 * @returns Unsubscribe function.
 */
export function subscribeToPythonRuntimeRequest(callback: () => void): () => void {
    if (mountRequested) {
        callback();
        return () => {
        };
    }
    subscribers.add(callback);
    return () => {
        subscribers.delete(callback);
    };
}
