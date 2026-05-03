import React from 'react';
import { Platform, Text } from 'react-native';
import { render, renderHook, act } from '@testing-library/react-native';

import { ScraperProvider, useScraper } from '@app/modules/recipe-scraper/src/ScraperProvider';

jest.mock('@app/modules/recipe-scraper/src/ios/PyodideWebView', () => ({
  PyodideWebView: () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RN = require('react-native');
    return <RN.Text testID='pyodide-webview'>PyodideWebView</RN.Text>;
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

describe('ScraperProvider', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  });

  it('does not render the PyodideWebView before any useScraper consumer', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const { queryByTestId } = render(
      <ScraperProvider>
        <Text>child</Text>
      </ScraperProvider>
    );
    expect(queryByTestId('pyodide-webview')).toBeNull();
  });

  it('mounts the PyodideWebView on iOS once useScraper is consumed', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const { queryByTestId } = render(
      <ScraperProvider>
        <ScraperConsumer />
      </ScraperProvider>
    );
    expect(queryByTestId('pyodide-webview')).toBeTruthy();
  });

  it('does not mount the PyodideWebView on Android even with useScraper consumer', () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    const { queryByTestId } = render(
      <ScraperProvider>
        <ScraperConsumer />
      </ScraperProvider>
    );
    expect(queryByTestId('pyodide-webview')).toBeNull();
  });

  it('keeps the PyodideWebView mounted only once even with multiple consumers', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const { queryAllByTestId, rerender } = render(
      <ScraperProvider>
        <ScraperConsumer />
        <ScraperConsumer />
      </ScraperProvider>
    );
    expect(queryAllByTestId('pyodide-webview')).toHaveLength(1);

    act(() => {
      rerender(
        <ScraperProvider>
          <ScraperConsumer />
          <ScraperConsumer />
          <ScraperConsumer />
        </ScraperProvider>
      );
    });
    expect(queryAllByTestId('pyodide-webview')).toHaveLength(1);
  });

  it('exposes scrape methods via useScraper context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ScraperProvider>{children}</ScraperProvider>
    );
    const { result } = renderHook(() => useScraper(), { wrapper });

    expect(typeof result.current.scrapeRecipeFromHtml).toBe('function');
    expect(typeof result.current.scrapeRecipeAuthenticated).toBe('function');
    expect(result.current.initError).toBeNull();
  });

  it('throws when useScraper is used outside ScraperProvider', () => {
    function Orphan() {
      useScraper();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow('useScraper must be used within a ScraperProvider');
  });
});
