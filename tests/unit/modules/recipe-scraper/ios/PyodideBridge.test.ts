jest.unmock('@app/modules/recipe-scraper/src/ios/PyodideBridge');

const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
jest.mock('@utils/logger', () => ({
    pyodideLogger: mockLogger,
}));

type BridgeInstance = typeof import('@app/modules/recipe-scraper/src/ios/PyodideBridge').PyodideBridge;

function loadFreshBridge(): BridgeInstance {
    jest.resetModules();
    jest.unmock('@app/modules/recipe-scraper/src/ios/PyodideBridge');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@app/modules/recipe-scraper/src/ios/PyodideBridge').PyodideBridge;
}

describe('PyodideBridge', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('initialization', () => {
        it('starts not ready', () => {
            const bridge = loadFreshBridge();
            expect(bridge.isPythonReady()).toBe(false);
        });

        it('starts with no initialization error', () => {
            const bridge = loadFreshBridge();
            expect(bridge.getInitializationError()).toBeNull();
        });

        it('logs debug on construction', () => {
            loadFreshBridge();
            expect(mockLogger.debug).toHaveBeenCalledWith('Initializing...');
        });
    });

    describe('initialization timeout', () => {
        it('stores timeout error after 60 seconds', async () => {
            const bridge = loadFreshBridge();
            jest.advanceTimersByTime(60001);
            await Promise.resolve();
            expect(bridge.getInitializationError()?.message).toContain('timed out after 60 seconds');
        });

        it('logs warning via catch handler when timeout fires', async () => {
            loadFreshBridge();
            jest.advanceTimersByTime(60001);
            await Promise.resolve();
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Initialization failed',
                expect.objectContaining({ error: expect.stringContaining('timed out after 60 seconds') })
            );
        });

        it('isPythonReady remains false after timeout', async () => {
            const bridge = loadFreshBridge();
            jest.advanceTimersByTime(60001);
            await Promise.resolve();
            expect(bridge.isPythonReady()).toBe(false);
        });

        it('whenReady rejects once timeout has fired', async () => {
            const bridge = loadFreshBridge();
            jest.advanceTimersByTime(60001);
            await Promise.resolve();
            await expect(bridge.whenReady()).rejects.toThrow('timed out');
        });
    });

    describe('handleMessage: ready', () => {
        it('marks bridge as ready', () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({type: 'ready'}));
            expect(bridge.isPythonReady()).toBe(true);
        });

        it('logs info when ready', () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({type: 'ready'}));
            expect(mockLogger.info).toHaveBeenCalledWith('Ready');
        });

        it('whenReady resolves after ready signal', async () => {
            const bridge = loadFreshBridge();
            const readyPromise = bridge.whenReady();
            bridge.handleMessage(JSON.stringify({type: 'ready'}));
            await expect(readyPromise).resolves.toBeUndefined();
        });

        it('initialization error remains null after ready signal', () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({type: 'ready'}));
            expect(bridge.getInitializationError()).toBeNull();
        });

        it('cancels the init timeout so no warn fires after 60 seconds', async () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({type: 'ready'}));
            jest.clearAllMocks();
            jest.advanceTimersByTime(60001);
            await Promise.resolve();
            expect(mockLogger.warn).not.toHaveBeenCalledWith(
                'Initialization failed',
                expect.anything()
            );
        });
    });

    describe('handleMessage: error (before ready)', () => {
        it('stores the initialization error', () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({
                type: 'error',
                error: {type: 'ImportError', message: 'Module not found'},
            }));
            expect(bridge.getInitializationError()?.message).toBe('ImportError: Module not found');
        });

        it('logs error with type and message', () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({
                type: 'error',
                error: {type: 'ImportError', message: 'Module not found'},
            }));
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Bridge error',
                {type: 'ImportError', message: 'Module not found'}
            );
        });

        it('logs initialization failed warning via catch handler', async () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({
                type: 'error',
                error: {type: 'ImportError', message: 'Module not found'},
            }));
            await Promise.resolve();
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Initialization failed',
                {error: 'ImportError: Module not found'}
            );
        });

        it('whenReady rejects after WebView error', async () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({
                type: 'error',
                error: {type: 'ImportError', message: 'fail'},
            }));
            await expect(bridge.whenReady()).rejects.toThrow('ImportError: fail');
        });
    });

    describe('handleMessage: error (after already ready)', () => {
        it('logs error but does not change isReady or overwrite initializationError', () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({type: 'ready'}));
            bridge.handleMessage(JSON.stringify({
                type: 'error',
                error: {type: 'RuntimeError', message: 'Something failed'},
            }));
            expect(bridge.isPythonReady()).toBe(true);
            expect(bridge.getInitializationError()).toBeNull();
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Bridge error',
                {type: 'RuntimeError', message: 'Something failed'}
            );
        });
    });

    describe('handleMessage: log', () => {
        it.each([
            ['debug', 'debug'],
            ['info', 'info'],
            ['warn', 'warn'],
            ['error', 'error'],
        ])('routes level "%s" to pyodideLogger.%s', (level, method) => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({type: 'log', level, message: 'test msg'}));
            expect(mockLogger[method as keyof typeof mockLogger]).toHaveBeenCalledWith('test msg');
        });

        it('routes unknown log level to pyodideLogger.info', () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({type: 'log', level: 'verbose', message: 'test'}));
            expect(mockLogger.info).toHaveBeenCalledWith('test');
        });
    });

    describe('handleMessage: rpcResponse', () => {
        let bridge: BridgeInstance;
        let receivedMessages: string[];

        beforeEach(() => {
            bridge = loadFreshBridge();
            receivedMessages = [];
            bridge.setMessageHandler(msg => receivedMessages.push(msg));
            bridge.handleMessage(JSON.stringify({type: 'ready'}));
        });

        it('resolves the pending call with result', async () => {
            const callPromise = bridge.call('testMethod', {});
            const {id} = JSON.parse(receivedMessages[0]);
            bridge.handleMessage(JSON.stringify({type: 'rpcResponse', id, result: '{"ok":true}'}));
            await expect(callPromise).resolves.toBe('{"ok":true}');
        });

        it('rejects the pending call with formatted error message', async () => {
            const callPromise = bridge.call('testMethod', {});
            const {id} = JSON.parse(receivedMessages[0]);
            bridge.handleMessage(JSON.stringify({
                type: 'rpcResponse',
                id,
                error: {type: 'ScraperError', message: 'No recipe found'},
            }));
            await expect(callPromise).rejects.toThrow('ScraperError: No recipe found');
        });

        it('rejects with "Empty response" when neither result nor error is provided', async () => {
            const callPromise = bridge.call('testMethod', {});
            const {id} = JSON.parse(receivedMessages[0]);
            bridge.handleMessage(JSON.stringify({type: 'rpcResponse', id}));
            await expect(callPromise).rejects.toThrow('Empty response from Pyodide');
        });

        it('warns when response received for unknown call id', () => {
            bridge.handleMessage(JSON.stringify({type: 'rpcResponse', id: 9999, result: 'data'}));
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Received response for unknown call',
                {id: 9999}
            );
        });

        it('resolves concurrent calls independently when responses arrive out of order', async () => {
            const call1 = bridge.call('method1');
            const call2 = bridge.call('method2');

            const id1 = JSON.parse(receivedMessages[0]).id;
            const id2 = JSON.parse(receivedMessages[1]).id;

            bridge.handleMessage(JSON.stringify({type: 'rpcResponse', id: id2, result: 'res2'}));
            bridge.handleMessage(JSON.stringify({type: 'rpcResponse', id: id1, result: 'res1'}));

            await expect(call1).resolves.toBe('res1');
            await expect(call2).resolves.toBe('res2');
        });
    });

    describe('handleMessage: malformed / unknown type', () => {
        it('does not throw on malformed JSON', () => {
            const bridge = loadFreshBridge();
            expect(() => bridge.handleMessage('not valid json')).not.toThrow();
        });

        it('logs error on malformed JSON', () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage('not valid json');
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to parse message',
                {error: expect.any(SyntaxError)}
            );
        });

        it('does not throw on unknown message type', () => {
            const bridge = loadFreshBridge();
            expect(() => bridge.handleMessage(JSON.stringify({type: 'unknown'}))).not.toThrow();
        });
    });

    describe('setMessageHandler / sendToWebView', () => {
        it('calls the registered handler with the message', () => {
            const bridge = loadFreshBridge();
            const handler = jest.fn<void, [string]>();
            bridge.setMessageHandler(handler);
            bridge.sendToWebView('hello');
            expect(handler).toHaveBeenCalledWith('hello');
        });

        it('does not throw when no handler is registered', () => {
            const bridge = loadFreshBridge();
            expect(() => bridge.sendToWebView('hello')).not.toThrow();
        });

        it('replaces previous handler when set again', () => {
            const bridge = loadFreshBridge();
            const first = jest.fn<void, [string]>();
            const second = jest.fn<void, [string]>();
            bridge.setMessageHandler(first);
            bridge.setMessageHandler(second);
            bridge.sendToWebView('test');
            expect(first).not.toHaveBeenCalled();
            expect(second).toHaveBeenCalledWith('test');
        });
    });

    describe('whenReady', () => {
        it('resolves immediately when already ready', async () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({type: 'ready'}));
            await expect(bridge.whenReady()).resolves.toBeUndefined();
        });

        it('rejects immediately when initialization already failed', async () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({
                type: 'error',
                error: {type: 'TestError', message: 'failed'},
            }));
            await expect(bridge.whenReady()).rejects.toThrow('TestError: failed');
        });
    });

    describe('call', () => {
        it('sends RPC message with correct type, method, params, and numeric id', async () => {
            const bridge = loadFreshBridge();
            const messages: string[] = [];
            bridge.setMessageHandler(msg => messages.push(msg));
            bridge.handleMessage(JSON.stringify({type: 'ready'}));

            bridge.call('scrapeRecipe', {url: 'https://example.com', wildMode: true}).catch(() => {});

            const sent = JSON.parse(messages[0]);
            expect(sent.type).toBe('rpc');
            expect(sent.method).toBe('scrapeRecipe');
            expect(sent.params).toEqual({url: 'https://example.com', wildMode: true});
            expect(typeof sent.id).toBe('number');
        });

        it('assigns incrementing ids to concurrent calls', () => {
            const bridge = loadFreshBridge();
            const messages: string[] = [];
            bridge.setMessageHandler(msg => messages.push(msg));
            bridge.handleMessage(JSON.stringify({type: 'ready'}));

            bridge.call('method1').catch(() => {});
            bridge.call('method2').catch(() => {});

            const id1 = JSON.parse(messages[0]).id;
            const id2 = JSON.parse(messages[1]).id;
            expect(id2).toBe(id1 + 1);
        });

        it('defers sending RPC until bridge becomes ready', async () => {
            const bridge = loadFreshBridge();
            const messages: string[] = [];
            bridge.setMessageHandler(msg => messages.push(msg));

            const callPromise = bridge.call('testMethod');
            expect(messages).toHaveLength(0);

            bridge.handleMessage(JSON.stringify({type: 'ready'}));
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            expect(messages).toHaveLength(1);
            const {id} = JSON.parse(messages[0]);
            bridge.handleMessage(JSON.stringify({type: 'rpcResponse', id, result: 'ok'}));
            await expect(callPromise).resolves.toBe('ok');
        });

        it('rejects when init has failed', async () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({
                type: 'error',
                error: {type: 'TestError', message: 'init failed'},
            }));
            await expect(bridge.call('testMethod')).rejects.toThrow('TestError: init failed');
        });

        it('rejects after per-call timeout expires', async () => {
            const bridge = loadFreshBridge();
            bridge.setMessageHandler(() => {});
            bridge.handleMessage(JSON.stringify({type: 'ready'}));

            const callPromise = bridge.call('testMethod', {}, 5000);
            jest.advanceTimersByTime(5001);

            await expect(callPromise).rejects.toThrow("RPC call 'testMethod' timed out after 5000ms");
        });
    });

    describe('convenience methods', () => {
        let bridge: BridgeInstance;
        let receivedMessages: string[];

        beforeEach(() => {
            bridge = loadFreshBridge();
            receivedMessages = [];
            bridge.setMessageHandler(msg => receivedMessages.push(msg));
            bridge.handleMessage(JSON.stringify({type: 'ready'}));
        });

        it('scrapeRecipeFromHtml sends correct method and params', () => {
            bridge.scrapeRecipeFromHtml('<html/>', 'https://example.com', false).catch(() => {});
            const sent = JSON.parse(receivedMessages[0]);
            expect(sent.method).toBe('scrapeRecipeFromHtml');
            expect(sent.params).toEqual({html: '<html/>', url: 'https://example.com', wildMode: false});
        });

        it('scrapeRecipeFromHtml defaults wildMode to true', () => {
            bridge.scrapeRecipeFromHtml('<html/>', 'https://example.com').catch(() => {});
            const sent = JSON.parse(receivedMessages[0]);
            expect(sent.params.wildMode).toBe(true);
        });

        it('getSupportedHosts sends correct method with empty params', () => {
            bridge.getSupportedHosts().catch(() => {});
            const sent = JSON.parse(receivedMessages[0]);
            expect(sent.method).toBe('getSupportedHosts');
            expect(sent.params).toEqual({});
        });

        it('isHostSupported sends correct method with host param', () => {
            bridge.isHostSupported('allrecipes.com').catch(() => {});
            const sent = JSON.parse(receivedMessages[0]);
            expect(sent.method).toBe('isHostSupported');
            expect(sent.params).toEqual({host: 'allrecipes.com'});
        });
    });

    describe('destroy', () => {
        it('rejects all pending calls with "Bridge destroyed"', async () => {
            const bridge = loadFreshBridge();
            bridge.setMessageHandler(() => {});
            bridge.handleMessage(JSON.stringify({type: 'ready'}));

            const call1 = bridge.call('method1');
            const call2 = bridge.call('method2');
            bridge.destroy();

            await expect(call1).rejects.toThrow('Bridge destroyed');
            await expect(call2).rejects.toThrow('Bridge destroyed');
        });

        it('sets isReady to false', () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({type: 'ready'}));
            bridge.destroy();
            expect(bridge.isPythonReady()).toBe(false);
        });

        it('clears initializationError', () => {
            const bridge = loadFreshBridge();
            bridge.handleMessage(JSON.stringify({
                type: 'error',
                error: {type: 'TestError', message: 'fail'},
            }));
            bridge.destroy();
            expect(bridge.getInitializationError()).toBeNull();
        });

        it('cancels the init timeout so no warn fires after destroy', async () => {
            const bridge = loadFreshBridge();
            bridge.destroy();
            jest.clearAllMocks();
            jest.advanceTimersByTime(60001);
            await Promise.resolve();
            expect(mockLogger.warn).not.toHaveBeenCalledWith(
                'Initialization failed',
                expect.anything()
            );
        });

        it('warns on rpcResponse for a call that was destroyed mid-flight', () => {
            const bridge = loadFreshBridge();
            const messages: string[] = [];
            bridge.setMessageHandler(msg => messages.push(msg));
            bridge.handleMessage(JSON.stringify({type: 'ready'}));

            bridge.call('method1').catch(() => {});
            const {id} = JSON.parse(messages[0]);
            bridge.destroy();

            bridge.handleMessage(JSON.stringify({type: 'rpcResponse', id, result: 'late'}));
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Received response for unknown call',
                {id}
            );
        });
    });
});
