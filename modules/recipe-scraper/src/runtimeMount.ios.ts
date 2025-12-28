/**
 * iOS implementation of Python runtime mount helpers.
 *
 * Proxies to {@link PyodideBridge} so the host app can lazily mount the
 * PyodideWebView only when a scrape call has actually been issued.
 */

import {PyodideBridge} from './ios/PyodideBridge';

/**
 * Reports whether a consumer has already requested the PyodideWebView to mount.
 */
export function isPythonRuntimeRequested(): boolean {
    return PyodideBridge.isMountRequested();
}

/**
 * Subscribes to mount-request events. The callback fires the first time
 * a scrape call triggers `PyodideBridge.requestMount()`.
 *
 * @param callback - Invoked when the WebView mount is requested.
 * @returns Unsubscribe function.
 */
export function subscribeToPythonRuntimeRequest(callback: () => void): () => void {
    return PyodideBridge.subscribeMount(callback);
}
