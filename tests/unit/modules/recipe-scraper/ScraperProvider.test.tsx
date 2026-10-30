import React from 'react';
import { Platform, Text } from 'react-native';
import { render, renderHook, act, waitFor } from '@testing-library/react-native';

import { ScraperProvider, useScraper } from '@app/modules/recipe-scraper/src/ScraperProvider';
import { recipeScraper } from '@app/modules/recipe-scraper/src/RecipeScraper';

const mockedScraper = recipeScraper as unknown as {
  whenReady: jest.Mock;
  scrapeRecipeFromHtml: jest.Mock;
  scrapeRecipeAuthenticated: jest.Mock;
};

const mockAuthState: { subscriber: (() => void) | null; currentLoginUrl: string | null } = {
  subscriber: null,
  currentLoginUrl: null,
};

jest.mock('@app/modules/recipe-scraper/src/ios/PyodideWebView', () => ({
  PyodideWebView: () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RN = require('react-native');
    return <RN.Text testID='pyodide-webview'>PyodideWebView</RN.Text>;
  },
}));

jest.mock('@app/modules/recipe-scraper/src/ios/AuthWebView', () => ({
  AuthWebView: ({ loginUrl }: { loginUrl: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RN = require('react-native');
    return <RN.Text testID='auth-webview'>{loginUrl}</RN.Text>;
  },
}));

jest.mock('@app/modules/recipe-scraper/src/ios/AuthBridge', () => ({
  AuthBridge: {
    get currentLoginUrl() {
      return mockAuthState.currentLoginUrl;
    },
    subscribe: jest.fn((callback: () => void) => {
      mockAuthState.subscriber = callback;
      return () => {
        mockAuthState.subscriber = null;
      };
    }),
  },
}));

jest.mock('@app/modules/recipe-scraper/src/RecipeScraper', () => ({
  recipeScraper: {
    whenReady: jest.fn().mockResolvedValue(undefined),
    scrapeRecipeFromHtml: jest.fn(),
    scrapeRecipeAuthenticated: jest.fn(),
  },
}));

function ScraperConsumer() {
  useScraper();
  return <Text testID='consumer'>consumer</Text>;
}

function InitErrorProbe() {
  const { initError } = useScraper();
  return <Text testID='init-error'>{initError ?? 'none'}</Text>;
}

describe('ScraperProvider', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    mockAuthState.subscriber = null;
    mockAuthState.currentLoginUrl = null;
    mockedScraper.whenReady.mockReset().mockResolvedValue(undefined);
    mockedScraper.scrapeRecipeFromHtml.mockReset().mockResolvedValue({ success: true });
    mockedScraper.scrapeRecipeAuthenticated.mockReset().mockResolvedValue({ success: true });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  });

  it('does not render the PyodideWebView before any useScraper consumer', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const { queryByTestId } = await render(
      <ScraperProvider>
        <Text>child</Text>
      </ScraperProvider>
    );
    expect(queryByTestId('pyodide-webview')).toBeNull();
  });

  it('defers warmup until the JS thread is idle', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const requestIdleCallbackSpy = jest.spyOn(global, 'requestIdleCallback');

    await render(
      <ScraperProvider>
        <ScraperConsumer />
      </ScraperProvider>
    );

    expect(requestIdleCallbackSpy).toHaveBeenCalledWith(expect.any(Function));
    requestIdleCallbackSpy.mockRestore();
  });

  it('mounts the PyodideWebView on iOS once useScraper is consumed', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const { queryByTestId } = await render(
      <ScraperProvider>
        <ScraperConsumer />
      </ScraperProvider>
    );
    expect(queryByTestId('pyodide-webview')).toBeTruthy();
  });

  it('does not mount the PyodideWebView on Android even with useScraper consumer', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    const { queryByTestId } = await render(
      <ScraperProvider>
        <ScraperConsumer />
      </ScraperProvider>
    );
    expect(queryByTestId('pyodide-webview')).toBeNull();
  });

  it('keeps the PyodideWebView mounted only once even with multiple consumers', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const { queryAllByTestId, rerender } = await render(
      <ScraperProvider>
        <ScraperConsumer />
        <ScraperConsumer />
      </ScraperProvider>
    );
    expect(queryAllByTestId('pyodide-webview')).toHaveLength(1);

    await rerender(
      <ScraperProvider>
        <ScraperConsumer />
        <ScraperConsumer />
        <ScraperConsumer />
      </ScraperProvider>
    );
    expect(queryAllByTestId('pyodide-webview')).toHaveLength(1);
  });

  it('exposes scrape methods via useScraper context', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ScraperProvider>{children}</ScraperProvider>
    );
    const { result } = await renderHook(() => useScraper(), { wrapper });

    expect(typeof result.current.scrapeRecipeFromHtml).toBe('function');
    expect(typeof result.current.scrapeRecipeAuthenticated).toBe('function');
    expect(result.current.initError).toBeNull();
  });

  it('throws when useScraper is used outside ScraperProvider', async () => {
    function Orphan() {
      useScraper();
      return null;
    }

    await expect(render(<Orphan />)).rejects.toThrow(
      'useScraper must be used within a ScraperProvider'
    );
  });

  it('surfaces a whenReady failure as initError', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    mockedScraper.whenReady.mockRejectedValueOnce(new Error('init boom'));

    const { getByTestId } = await render(
      <ScraperProvider>
        <InitErrorProbe />
      </ScraperProvider>
    );

    await waitFor(() => expect(getByTestId('init-error')).toHaveTextContent('init boom'));
  });

  it('stringifies a non-Error whenReady failure as initError', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    mockedScraper.whenReady.mockRejectedValueOnce('plain failure');

    const { getByTestId } = await render(
      <ScraperProvider>
        <InitErrorProbe />
      </ScraperProvider>
    );

    await waitFor(() => expect(getByTestId('init-error')).toHaveTextContent('plain failure'));
  });

  it('awaits readiness before delegating scrapeRecipeFromHtml', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ScraperProvider>{children}</ScraperProvider>
    );
    const { result } = await renderHook(() => useScraper(), { wrapper });

    await result.current.scrapeRecipeFromHtml('<html>', 'https://example.com', { wildMode: false });

    expect(mockedScraper.whenReady).toHaveBeenCalled();
    expect(mockedScraper.scrapeRecipeFromHtml).toHaveBeenCalledWith(
      '<html>',
      'https://example.com',
      { wildMode: false }
    );
  });

  it('awaits readiness before delegating scrapeRecipeAuthenticated', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ScraperProvider>{children}</ScraperProvider>
    );
    const { result } = await renderHook(() => useScraper(), { wrapper });

    await result.current.scrapeRecipeAuthenticated('https://example.com', 'user', 'pass');

    expect(mockedScraper.whenReady).toHaveBeenCalled();
    expect(mockedScraper.scrapeRecipeAuthenticated).toHaveBeenCalledWith(
      'https://example.com',
      'user',
      'pass',
      undefined
    );
  });

  it('mounts AuthWebView when AuthBridge publishes a login url', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const { queryByTestId } = await render(
      <ScraperProvider>
        <Text>child</Text>
      </ScraperProvider>
    );
    expect(queryByTestId('auth-webview')).toBeNull();

    await act(() => {
      mockAuthState.currentLoginUrl = 'https://login.example.com';
      mockAuthState.subscriber?.();
    });

    expect(queryByTestId('auth-webview')).toBeTruthy();
  });
});
