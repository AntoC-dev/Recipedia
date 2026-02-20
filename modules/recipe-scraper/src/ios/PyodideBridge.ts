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

const DEFAULT_TIMEOUT_MS = 30000;
const INIT_TIMEOUT_MS = 60000;

class PyodideBridgeImpl {
    private isReady = false;
    private pendingCalls = new Map<number, RpcCallback>();
    private nextCallId = 1;
    private readyPromise: Promise<void> | null = null;
    private readyResolve: (() => void) | null = null;
    private readyReject: ((error: Error) => void) | null = null;
    private messageHandler: PyodideMessageHandler | null = null;
    private initTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        this.readyPromise = new Promise((resolve, reject) => {
            this.readyResolve = resolve;
            this.readyReject = reject;
        });

        this.initTimeout = setTimeout(() => {
            if (!this.isReady && this.readyReject) {
                this.readyReject(
                    new Error('Pyodide initialization timed out after 60 seconds')
                );
            }
        }, INIT_TIMEOUT_MS);
    }

    setMessageHandler(handler: PyodideMessageHandler): void {
        this.messageHandler = handler;
    }

    sendToWebView(message: string): void {
        if (this.messageHandler) {
            this.messageHandler(message);
        }
    }

    handleMessage(messageStr: string): void {
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
            console.error('[PyodideBridge] Failed to parse message:', error);
        }
    }

    private handleReady(): void {
        this.isReady = true;
        if (this.initTimeout) {
            clearTimeout(this.initTimeout);
            this.initTimeout = null;
        }
        if (this.readyResolve) {
            this.readyResolve();
        }
    }

    private handleLog(level: string, message: string): void {
        const prefix = '[Pyodide]';
        switch (level) {
            case 'debug':
                console.debug(prefix, message);
                break;
            case 'info':
                console.info(prefix, message);
                break;
            case 'warn':
                console.warn(prefix, message);
                break;
            case 'error':
                console.error(prefix, message);
                break;
            default:
                console.log(prefix, message);
        }
    }

    private handleError(error: {type: string; message: string}): void {
        console.error('[PyodideBridge] Error:', error.type, error.message);
        if (!this.isReady && this.readyReject) {
            this.readyReject(new Error(`${error.type}: ${error.message}`));
        }
    }

    private handleRpcResponse(
        id: number,
        result?: string,
        error?: {type: string; message: string}
    ): void {
        const pending = this.pendingCalls.get(id);
        if (!pending) {
            console.warn('[PyodideBridge] Received response for unknown call:', id);
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

    async waitForReady(timeoutMs = INIT_TIMEOUT_MS): Promise<boolean> {
        if (this.isReady) {
            return true;
        }

        try {
            await Promise.race([
                this.readyPromise,
                new Promise<never>((_, reject) =>
                    setTimeout(
                        () => reject(new Error('Timeout waiting for Pyodide')),
                        timeoutMs
                    )
                ),
            ]);
            return true;
        } catch {
            return false;
        }
    }

    isPythonReady(): boolean {
        return this.isReady;
    }

    async call(
        method: string,
        params: Record<string, unknown> = {},
        timeoutMs = DEFAULT_TIMEOUT_MS
    ): Promise<string> {
        if (!this.isReady) {
            const ready = await this.waitForReady();
            if (!ready) {
                throw new Error('Pyodide is not ready');
            }
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
        }

        for (const [, pending] of this.pendingCalls) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Bridge destroyed'));
        }
        this.pendingCalls.clear();
        this.isReady = false;
    }
}

export const PyodideBridge = new PyodideBridgeImpl();
