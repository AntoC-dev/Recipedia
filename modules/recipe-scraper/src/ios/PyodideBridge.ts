/**
 * Pyodide Bridge for iOS recipe scraping.
 *
 * Manages communication between TypeScript and the Pyodide WebView,
 * providing a Promise-based RPC interface for Python function calls.
 */

type RpcCallback = {
    resolve: (result: string) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
};

type PyodideMessage =
    | {type: 'ready'}
    | {type: 'log'; level: string; message: string}
    | {type: 'error'; error: {type: string; message: string}}
    | {type: 'rpcResponse'; id: number; result?: string; error?: {type: string; message: string}};

export type PyodideMessageHandler = (message: string) => void;

import {pyodideLogger} from '@utils/logger';

const DEFAULT_TIMEOUT_MS = 30000;
const INIT_TIMEOUT_MS = 60000;

class PyodideBridgeImpl {
    private isReady = false;
    private initializationError: Error | null = null;
    private pendingCalls = new Map<number, RpcCallback>();
    private nextCallId = 1;
    private readyPromise: Promise<void> | null = null;
    private readyResolve: (() => void) | null = null;
    private readyReject: ((error: Error) => void) | null = null;
    private messageHandler: PyodideMessageHandler | null = null;
    private initTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        this.createReadyPromise();
        pyodideLogger.debug('Initializing...');
        // Safety-net timer: ensures whenReady() rejects even if the WebView never
        // mounts (e.g. bundle asset fails to load). attach() re-arms a fresh timer
        // on mount so Pyodide gets a full window once it actually starts.
        this.armInitTimer();
    }

    private createReadyPromise(): void {
        this.readyPromise = new Promise((resolve, reject) => {
            this.readyResolve = resolve;
            this.readyReject = reject;
        });
        // Handles all rejection paths (timeout + WebView errors) in one place.
        // Prevents unhandled rejection warning; whenReady() handles the error for callers.
        this.readyPromise.catch((error: Error) => {
            pyodideLogger.warn('Initialization failed', { error: error.message });
        });
    }

    private armInitTimer(): void {
        if (this.initTimeout) {
            clearTimeout(this.initTimeout);
        }
        this.initTimeout = setTimeout(() => {
            if (!this.isReady && this.readyReject) {
                const error = new Error('Pyodide initialization timed out after 60 seconds');
                this.initializationError = error;
                this.readyReject(error);
            }
        }, INIT_TIMEOUT_MS);
    }

    setMessageHandler(handler: PyodideMessageHandler): void {
        this.messageHandler = handler;
    }

    /**
     * Called by the WebView wrapper when the WebView mounts.
     * Re-arms init state so a prior failure or hot-reload remount can recover.
     */
    attach(handler: PyodideMessageHandler): void {
        this.messageHandler = handler;
        if (this.isReady) return;
        if (this.initializationError || !this.readyPromise) {
            this.initializationError = null;
            this.createReadyPromise();
        }
        this.armInitTimer();
    }

    /**
     * Called by the WebView wrapper when the WebView unmounts.
     * Soft-clears the handler without destroying init state, so a remount can re-attach.
     */
    detach(): void {
        this.messageHandler = null;
    }

    sendToWebView(message: string): void {
        if (this.messageHandler) {
            this.messageHandler(message);
        }
    }

    handleMessage(messageStr: string): void {
        // Ignore non-JSON noise (e.g. WebView scheduler events like "sched$...").
        if (typeof messageStr !== 'string' || messageStr.charAt(0) !== '{') {
            return;
        }
        try {
            const message = JSON.parse(messageStr) as PyodideMessage;

            switch (message.type) {
                case 'ready':
                    this.handleReady();
                    break;

                case 'log':
                    this.handleLog(message.level, message.message);
                    break;

                case 'error':
                    this.handleError(message.error);
                    break;

                case 'rpcResponse':
                    this.handleRpcResponse(message.id, message.result, message.error);
                    break;
            }
        } catch (error) {
            pyodideLogger.error('Failed to parse message', { error });
        }
    }

    private handleReady(): void {
        this.isReady = true;
        pyodideLogger.info('Ready');
        if (this.initTimeout) {
            clearTimeout(this.initTimeout);
            this.initTimeout = null;
        }
        if (this.readyResolve) {
            this.readyResolve();
        }
    }

    private handleLog(level: string, message: string): void {
        const logFn = level === 'debug' ? pyodideLogger.debug
            : level === 'info' ? pyodideLogger.info
            : level === 'warn' ? pyodideLogger.warn
            : level === 'error' ? pyodideLogger.error
            : pyodideLogger.info;
        logFn(message);
    }

    private handleError(error: {type: string; message: string}): void {
        pyodideLogger.error('Bridge error', { type: error.type, message: error.message });
        if (!this.isReady && this.readyReject) {
            const err = new Error(`${error.type}: ${error.message}`);
            this.initializationError = err;
            this.readyReject(err);
        }
    }

    private handleRpcResponse(
        id: number,
        result?: string,
        error?: {type: string; message: string}
    ): void {
        const pending = this.pendingCalls.get(id);
        if (!pending) {
            pyodideLogger.warn('Received response for unknown call', { id });
            return;
        }

        clearTimeout(pending.timeout);
        this.pendingCalls.delete(id);

        if (error) {
            pending.reject(new Error(`${error.type}: ${error.message}`));
        } else if (result !== undefined) {
            pending.resolve(result);
        } else {
            pending.reject(new Error('Empty response from Pyodide'));
        }
    }

    async whenReady(): Promise<void> {
        if (this.isReady) return;
        await this.readyPromise;
    }

    isPythonReady(): boolean {
        return this.isReady;
    }

    getInitializationError(): Error | null {
        return this.initializationError;
    }

    async call(
        method: string,
        params: Record<string, unknown> = {},
        timeoutMs = DEFAULT_TIMEOUT_MS
    ): Promise<string> {
        if (!this.isReady) {
            await this.whenReady();
        }

        return new Promise((resolve, reject) => {
            const id = this.nextCallId++;

            const timeout = setTimeout(() => {
                this.pendingCalls.delete(id);
                reject(new Error(`RPC call '${method}' timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            this.pendingCalls.set(id, {resolve, reject, timeout});

            const message = JSON.stringify({
                type: 'rpc',
                id,
                method,
                params,
            });

            this.sendToWebView(message);
        });
    }

    async scrapeRecipeFromHtml(
        html: string,
        url: string,
        wildMode = true
    ): Promise<string> {
        return this.call('scrapeRecipeFromHtml', {html, url, wildMode});
    }

    async getSupportedHosts(): Promise<string> {
        return this.call('getSupportedHosts');
    }

    async isHostSupported(host: string): Promise<string> {
        return this.call('isHostSupported', {host});
    }

    destroy(): void {
        if (this.initTimeout) {
            clearTimeout(this.initTimeout);
            this.initTimeout = null;
        }

        for (const [, pending] of this.pendingCalls) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Bridge destroyed'));
        }
        this.pendingCalls.clear();

        // Reject any pending whenReady() awaiters so they don't hang forever.
        if (!this.isReady && this.readyReject) {
            this.readyReject(new Error('Bridge destroyed'));
        }

        this.isReady = false;
        this.initializationError = null;
        this.messageHandler = null;
        // Recreate readyPromise so a future setMessageHandler() (WebView remount) re-arms init.
        this.createReadyPromise();
    }
}

export const PyodideBridge = new PyodideBridgeImpl();
