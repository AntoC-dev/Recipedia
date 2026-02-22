/**
 * AuthBridge - iOS authentication bridge for recipe scraping.
 *
 * Manages a hidden WebView that navigates to a login page, injects an
 * authentication script that runs same-origin (bypassing CORS), and
 * receives the recipe HTML back via postMessage.
 *
 * The WebView is rendered on demand (only while an auth request is in
 * progress) to avoid keeping a permanent WKWebView in memory alongside
 * the large Pyodide WebView.
 *
 * WKWebView has its own cookie jar (WKHTTPCookieStore) that automatically
 * manages session cookies across same-origin fetch() calls within the WebView,
 * making the full auth flow (login + recipe fetch) seamless.
 */

import {extractHost} from '../urlUtils';

type AuthHandlerConfig = {
    loginUrl: string;
    csrfSelector: string;
    loginCheckUrl: string;
    usernameField: string;
    passwordField: string;
    csrfField: string;
};

const AUTH_HANDLER_CONFIGS: Record<string, AuthHandlerConfig> = {
    'quitoque.fr': {
        loginUrl: 'https://www.quitoque.fr/login',
        csrfSelector: 'input[name="_csrf_shop_security_token"]',
        loginCheckUrl: 'https://www.quitoque.fr/login-check',
        usernameField: '_username',
        passwordField: '_password',
        csrfField: '_csrf_shop_security_token',
    },
};

type AuthWebViewMessage =
    | {type: 'authResult'; html: string}
    | {type: 'authError'; message: string};

type PendingRequest = {
    recipeUrl: string;
    username: string;
    password: string;
    config: AuthHandlerConfig;
    resolve: (html: string) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
    scriptInjected: boolean;
};

const AUTH_TIMEOUT_MS = 60000;

// Language: injected JavaScript (WKWebView). Not executed in React Native — serialized as a string
// and injected into WKWebView via injectJavaScript. Hermes bytecode compilation prevents
// Function.prototype.toString() from returning source, so template literals are the only
// viable approach for cross-boundary script injection in React Native.
const FETCH_RECIPE_JS = `
            var recipeResp = await fetch(cfg.recipeUrl, {
                credentials: 'include',
                headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'User-Agent': 'Mozilla/5.0' }
            });

            if (!recipeResp.ok) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'authError', message: 'Recipe fetch failed: HTTP ' + recipeResp.status }));
                return;
            }

            if (recipeResp.url.includes('/login')) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'authError', message: 'Recipe fetch redirected to login - session may have expired' }));
                return;
            }

            var html = await recipeResp.text();
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'authResult', html: html }));`;

class AuthBridgeImpl {
    private injectHandler: ((script: string) => void) | null = null;
    private pending: PendingRequest | null = null;
    private readonly listeners = new Set<() => void>();

    subscribe(callback: () => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    get isActive(): boolean {
        return this.pending !== null;
    }

    get currentLoginUrl(): string | null {
        return this.pending?.config.loginUrl ?? null;
    }

    setInjectHandler(inject: (script: string) => void): void {
        this.injectHandler = inject;
    }

    getAuthHandlerHosts(): string[] {
        return Object.keys(AUTH_HANDLER_CONFIGS);
    }

    isHostSupported(host: string): boolean {
        const normalized = host.toLowerCase().replace(/^www\./, '');
        return normalized in AUTH_HANDLER_CONFIGS;
    }

    async fetchAuthenticatedHtml(
        url: string,
        username: string,
        password: string
    ): Promise<string> {
        const host = extractHost(url);
        const config = AUTH_HANDLER_CONFIGS[host];

        if (!config) {
            throw new Error(`AuthBridge: No auth handler for host "${host}"`);
        }

        if (this.pending) {
            this.pending.reject(new Error('AuthBridge: new request cancelled previous pending request'));
            clearTimeout(this.pending.timeout);
            this.pending = null;
        }

        return new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pending = null;
                this.notifyListeners();
                reject(new Error(`AuthBridge: auth timed out after ${AUTH_TIMEOUT_MS}ms`));
            }, AUTH_TIMEOUT_MS);

            this.pending = {
                recipeUrl: url,
                username,
                password,
                config,
                resolve,
                reject,
                timeout,
                scriptInjected: false,
            };

            this.notifyListeners();
        });
    }

    handleLoadEnd(loadedUrl: string): void {
        if (!this.pending || this.pending.scriptInjected) {
            return;
        }

        let alreadyLoggedIn = false;
        try {
            const loadedPath = new URL(loadedUrl).pathname.toLowerCase();
            const loginPath = new URL(this.pending.config.loginUrl).pathname.toLowerCase();

            if (loadedPath !== loginPath) {
                // Redirected away from login page — user likely already has a valid session
                alreadyLoggedIn = true;
            }
        } catch {
            // URL parsing failed - proceed anyway
        }

        const script = alreadyLoggedIn
            ? this.buildFetchOnlyScript(this.pending)
            : this.buildAuthScript(this.pending);
        if (!this.injectHandler) {
            console.error('[AuthBridge] injectHandler not set - AuthWebView may not be mounted yet');
            return;
        }
        this.pending.scriptInjected = true;
        this.injectHandler(script);
    }

    handleMessage(data: string): void {
        let message: AuthWebViewMessage;

        try {
            message = JSON.parse(data) as AuthWebViewMessage;
        } catch {
            return;
        }

        switch (message.type) {
            case 'authResult':
                this.handleResult(message.html);
                break;

            case 'authError':
                this.handleError(message.message);
                break;
        }
    }

    handleWebViewError(description: string): void {
        if (!this.pending) {
            return;
        }
        console.error(`[AuthBridge] WebView error: ${description}`);
        this.resolvePending(null, new Error(`WebView error: ${description}`));
    }

    destroy(): void {
        if (this.pending) {
            clearTimeout(this.pending.timeout);
            this.pending.reject(new Error('AuthBridge destroyed'));
            this.pending = null;
        }
        this.injectHandler = null;
    }

    private handleResult(html: string): void {
        this.resolvePending(html, null);
    }

    private handleError(message: string): void {
        console.error(`[AuthBridge] Auth error: ${message}`);
        this.resolvePending(null, new Error(message));
    }

    private resolvePending(html: string | null, error: Error | null): void {
        if (!this.pending) {
            return;
        }
        const pending = this.pending;
        this.pending = null;
        clearTimeout(pending.timeout);

        this.notifyListeners();

        if (error) {
            pending.reject(error);
        } else {
            pending.resolve(html!);
        }
    }

    private notifyListeners(): void {
        for (const listener of this.listeners) {
            listener();
        }
    }

    private buildFetchOnlyScript(request: PendingRequest): string {
        const safeConfig = JSON.stringify({recipeUrl: request.recipeUrl});

        return `
(function() {
    var cfg = ${safeConfig};

    async function run() {
        try {
${FETCH_RECIPE_JS}
        } catch(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'authError', message: 'Exception: ' + (e && e.message ? e.message : String(e)) }));
        }
    }

    run();
    true;
})();
`;
    }

    private buildAuthScript(request: PendingRequest): string {
        const safeConfig = JSON.stringify({
            csrfSelector: request.config.csrfSelector,
            loginCheckUrl: request.config.loginCheckUrl,
            usernameField: request.config.usernameField,
            passwordField: request.config.passwordField,
            csrfField: request.config.csrfField,
            recipeUrl: request.recipeUrl,
            username: request.username,
            password: request.password,
        });

        return `
(function() {
    var cfg = ${safeConfig};

    async function run() {
        try {
            var csrfInput = document.querySelector(cfg.csrfSelector);
            if (!csrfInput) {
                var allInputs = Array.from(document.querySelectorAll('input')).map(function(i) { return i.name; }).join(', ');
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'authError', message: 'CSRF token not found (selector: ' + cfg.csrfSelector + '). Inputs: ' + allInputs }));
                return;
            }
            var csrfToken = csrfInput.value;

            var formData = new FormData();
            formData.append(cfg.usernameField, cfg.username);
            formData.append(cfg.passwordField, cfg.password);
            formData.append(cfg.csrfField, csrfToken);

            var loginResp = await fetch(cfg.loginCheckUrl, {
                method: 'POST',
                body: formData,
                credentials: 'include',
                redirect: 'follow'
            });

            if (!loginResp.ok) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'authError', message: 'Login POST failed: HTTP ' + loginResp.status }));
                return;
            }

            if (loginResp.url.includes('/login')) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'authError', message: 'Login failed - credentials may be incorrect (redirected back to /login)' }));
                return;
            }

${FETCH_RECIPE_JS}
        } catch(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'authError', message: 'Exception: ' + (e && e.message ? e.message : String(e)) }));
        }
    }

    run();
    true;
})();
`;
    }
}

export const AuthBridge = new AuthBridgeImpl();
