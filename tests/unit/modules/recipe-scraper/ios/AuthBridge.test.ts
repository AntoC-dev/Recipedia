import {AuthBridge} from '@app/modules/recipe-scraper/src/ios/AuthBridge';


jest.unmock('@app/modules/recipe-scraper/src/ios/AuthBridge');

afterEach(() => {
    AuthBridge.destroy();
});

describe('AuthBridge', () => {
    describe('isHostSupported', () => {
        it('returns true for quitoque.fr', () => {
            expect(AuthBridge.isHostSupported('quitoque.fr')).toBe(true);
        });

        it('returns true for www.quitoque.fr (strips www)', () => {
            expect(AuthBridge.isHostSupported('www.quitoque.fr')).toBe(true);
        });

        it('returns false for unsupported host', () => {
            expect(AuthBridge.isHostSupported('allrecipes.com')).toBe(false);
        });
    });

    describe('getAuthHandlerHosts', () => {
        it('returns array including quitoque.fr', () => {
            expect(AuthBridge.getAuthHandlerHosts()).toContain('quitoque.fr');
        });
    });

    describe('subscribe / isActive / currentLoginUrl', () => {
        it('starts inactive', () => {
            expect(AuthBridge.isActive).toBe(false);
            expect(AuthBridge.currentLoginUrl).toBeNull();
        });

        it('notifies subscriber when auth starts', async () => {
            const listener = jest.fn();
            AuthBridge.subscribe(listener);

            AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/123',
                'user@test.com',
                'pass'
            ).catch(() => {
            });

            expect(listener).toHaveBeenCalledTimes(1);
            expect(AuthBridge.isActive).toBe(true);
            expect(AuthBridge.currentLoginUrl).toBe('https://www.quitoque.fr/login');
        });

        it('notifies subscriber and becomes inactive when auth completes', async () => {
            const listener = jest.fn();
            AuthBridge.subscribe(listener);
            AuthBridge.setInjectHandler(jest.fn());

            const promise = AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/123',
                'user@test.com',
                'pass'
            );

            AuthBridge.handleLoadEnd('https://www.quitoque.fr/login');
            AuthBridge.handleMessage(JSON.stringify({type: 'authResult', html: '<html/>'}));

            await promise;

            expect(AuthBridge.isActive).toBe(false);
            expect(AuthBridge.currentLoginUrl).toBeNull();
            expect(listener).toHaveBeenCalledTimes(2);
        });

        it('unsubscribe removes listener', async () => {
            const listener = jest.fn();
            const unsubscribe = AuthBridge.subscribe(listener);
            unsubscribe();

            AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/123',
                'user@test.com',
                'pass'
            ).catch(() => {
            });

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('fetchAuthenticatedHtml', () => {
        it('rejects for unsupported host', async () => {
            await expect(
                AuthBridge.fetchAuthenticatedHtml(
                    'https://www.allrecipes.com/recipe/123',
                    'user@test.com',
                    'pass'
                )
            ).rejects.toThrow('No auth handler for host');
        });

        it('resolves with HTML when authResult message received', async () => {
            AuthBridge.setInjectHandler(jest.fn());

            const promise = AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/123',
                'user@test.com',
                'pass'
            );

            AuthBridge.handleLoadEnd('https://www.quitoque.fr/login');
            AuthBridge.handleMessage(JSON.stringify({type: 'authResult', html: '<html>recipe</html>'}));

            const html = await promise;
            expect(html).toBe('<html>recipe</html>');
        });

        it('rejects when authError message received', async () => {
            AuthBridge.setInjectHandler(jest.fn());

            const promise = AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/123',
                'user@test.com',
                'wrongpass'
            );

            AuthBridge.handleLoadEnd('https://www.quitoque.fr/login');
            AuthBridge.handleMessage(JSON.stringify({
                type: 'authError',
                message: 'Login failed - credentials may be incorrect'
            }));

            await expect(promise).rejects.toThrow('Login failed');
        });

        it('rejects when WebView error occurs', async () => {
            const promise = AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/123',
                'user@test.com',
                'pass'
            );

            AuthBridge.handleWebViewError('Connection refused');

            await expect(promise).rejects.toThrow('WebView error: Connection refused');
        });
    });

    describe('handleLoadEnd', () => {
        it('injects auth script when loaded URL matches login URL', () => {
            const inject = jest.fn();
            AuthBridge.setInjectHandler(inject);

            AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/123',
                'user@test.com',
                'pass'
            ).catch(() => {
            });

            AuthBridge.handleLoadEnd('https://www.quitoque.fr/login');

            expect(inject).toHaveBeenCalledTimes(1);
            expect(inject.mock.calls[0][0]).toContain('ReactNativeWebView.postMessage');
        });

        it('injects fetch-only script when redirected away from login page (already logged in)', () => {
            const inject = jest.fn();
            AuthBridge.setInjectHandler(inject);

            AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/123',
                'user@test.com',
                'pass'
            ).catch(() => {
            });

            AuthBridge.handleLoadEnd('https://www.quitoque.fr/tableau-de-bord');

            expect(inject).toHaveBeenCalledTimes(1);
            const injectedScript = inject.mock.calls[0][0];
            expect(injectedScript).not.toContain('loginCheckUrl');
            expect(injectedScript).toContain('ReactNativeWebView.postMessage');
        });

        it('does not inject script twice for same request', () => {
            const inject = jest.fn();
            AuthBridge.setInjectHandler(inject);

            AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/123',
                'user@test.com',
                'pass'
            ).catch(() => {
            });

            AuthBridge.handleLoadEnd('https://www.quitoque.fr/login');
            AuthBridge.handleLoadEnd('https://www.quitoque.fr/login');

            expect(inject).toHaveBeenCalledTimes(1);
        });

        it('does nothing when no pending request', () => {
            const inject = jest.fn();
            AuthBridge.setInjectHandler(inject);

            expect(() => {
                AuthBridge.handleLoadEnd('https://www.quitoque.fr/login');
            }).not.toThrow();
            expect(inject).not.toHaveBeenCalled();
        });

        it('retries injection on a subsequent loadEnd if injectHandler was not set initially', () => {
            AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/123',
                'user@test.com',
                'pass'
            ).catch(() => {
            });

            AuthBridge.handleLoadEnd('https://www.quitoque.fr/login');

            const inject = jest.fn();
            AuthBridge.setInjectHandler(inject);
            AuthBridge.handleLoadEnd('https://www.quitoque.fr/login');

            expect(inject).toHaveBeenCalledTimes(1);
        });
    });

    describe('handleMessage', () => {
        it('ignores non-auth messages', () => {
            expect(() => {
                AuthBridge.handleMessage(JSON.stringify({type: 'someOtherMessage'}));
            }).not.toThrow();
        });

        it('ignores malformed JSON', () => {
            expect(() => {
                AuthBridge.handleMessage('not json');
            }).not.toThrow();
        });
    });

    describe('destroy', () => {
        it('rejects pending request on destroy', async () => {
            const promise = AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/123',
                'user@test.com',
                'pass'
            );

            AuthBridge.destroy();

            await expect(promise).rejects.toThrow('AuthBridge destroyed');
        });
    });

    describe('timeout', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('rejects and becomes inactive after timeout', async () => {
            const listener = jest.fn();
            AuthBridge.subscribe(listener);

            const promise = AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/123',
                'user@test.com',
                'pass'
            );

            jest.runAllTimers();

            await expect(promise).rejects.toThrow('timed out');
            expect(AuthBridge.isActive).toBe(false);
            expect(listener).toHaveBeenCalledTimes(2);
        });
    });

    describe('concurrent requests', () => {
        it('cancels first request when a second one is made', async () => {
            const firstPromise = AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/123',
                'user@test.com',
                'pass'
            );

            const secondPromise = AuthBridge.fetchAuthenticatedHtml(
                'https://www.quitoque.fr/products/456',
                'user@test.com',
                'pass'
            );

            await expect(firstPromise).rejects.toThrow('cancelled previous pending request');
            expect(AuthBridge.isActive).toBe(true);

            secondPromise.catch(() => {
            });
        });
    });

    describe('handleWebViewError without pending request', () => {
        it('does not throw when called with no pending request', () => {
            expect(() => {
                AuthBridge.handleWebViewError('Connection refused');
            }).not.toThrow();
        });
    });
});
