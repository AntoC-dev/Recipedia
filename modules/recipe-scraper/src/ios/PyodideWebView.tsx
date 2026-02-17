/**
 * PyodideWebView fallback for non-iOS platforms.
 *
 * On Android, Python runs natively via Chaquopy, so no WebView is needed.
 * This file exists so Metro can resolve the import without bundling Pyodide assets.
 */

export function PyodideWebView(): null {
    return null;
}
