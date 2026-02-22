/**
 * AuthWebView fallback for non-iOS platforms.
 *
 * On Android, Python runs natively via Chaquopy, so no auth WebView is needed.
 * This file exists so TypeScript can resolve the import on non-iOS platforms.
 */

export function AuthWebView(_props: {loginUrl: string}): null {
    return null;
}
