/**
 * ScraperProvider - Owns the RecipeScraper instance and exposes scrape methods via React context.
 *
 * On iOS, lazily mounts the Pyodide WebView on first `useScraper()` consumer.
 * On Android, no WebView is needed (Chaquopy provides the Python runtime natively).
 *
 * All scraping goes through this provider — app code never imports the singleton directly.
 */

import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {Platform} from 'react-native';
import {PyodideWebView} from './ios/PyodideWebView';
import {AuthWebView} from './ios/AuthWebView';
import {AuthBridge} from './ios/AuthBridge';
import type {ScrapeOptions} from './RecipeScraper';
import {recipeScraper} from './RecipeScraper';
import type {ScraperResult} from './types';
import {ScraperErrorTypes} from './types';
import {pyodideLogger} from '@utils/logger';

/**
 * Shape of the scraper context value exposed to consumers via `useScraper()`.
 *
 * Both methods resolve to a `ScraperUnavailable` error result when the scraping engine
 * fails to load, instead of rejecting.
 */
export interface ScraperContextValue {
    scrapeRecipeFromHtml: (html: string, url: string, options?: ScrapeOptions) => Promise<ScraperResult>;
    scrapeRecipeAuthenticated: (url: string, username: string, password: string, options?: ScrapeOptions) => Promise<ScraperResult>;
}

interface InternalContextValue extends ScraperContextValue {
    warmup: () => void;
}

const ScraperContext = createContext<InternalContextValue | null>(null);

/** Extracts a loggable message from an unknown thrown value. */
function errorToMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** Wraps the app. Owns the scraper instance and renders iOS WebView when needed. */
export function ScraperProvider({children}: { children: React.ReactNode }) {
    const [warmedUp, setWarmedUp] = useState(false);
    const [authLoginUrl, setAuthLoginUrl] = useState<string | null>(null);

    const warmup = () => {
        requestIdleCallback(() => setWarmedUp(true));
    };

    useEffect(() => {
        if (Platform.OS !== 'ios') {
            return;
        }
        return AuthBridge.subscribe(() => setAuthLoginUrl(AuthBridge.currentLoginUrl));
    }, []);

    useEffect(() => {
        if (!warmedUp) {
            return;
        }
        recipeScraper.whenReady().catch(error => {
            pyodideLogger.warn('Pyodide failed to initialize', {error: errorToMessage(error)});
        });
    }, [warmedUp]);

    const scrapeRecipeFromHtml = async (
        html: string,
        url: string,
        options?: ScrapeOptions,
    ): Promise<ScraperResult> => {
        try {
            await recipeScraper.whenReady();
        } catch (error) {
            return {success: false, error: {type: ScraperErrorTypes.ScraperUnavailable, message: errorToMessage(error)}};
        }
        return recipeScraper.scrapeRecipeFromHtml(html, url, options);
    };

    const scrapeRecipeAuthenticated = async (
        url: string,
        username: string,
        password: string,
        options?: ScrapeOptions,
    ): Promise<ScraperResult> => {
        try {
            await recipeScraper.whenReady();
        } catch (error) {
            return {success: false, error: {type: ScraperErrorTypes.ScraperUnavailable, message: errorToMessage(error)}};
        }
        return recipeScraper.scrapeRecipeAuthenticated(url, username, password, options);
    };

    const isIOS = Platform.OS === 'ios';

    return (
        <ScraperContext.Provider value={{warmup, scrapeRecipeFromHtml, scrapeRecipeAuthenticated}}>
            {children}
            {isIOS && warmedUp && <PyodideWebView/>}
            {isIOS && authLoginUrl !== null && <AuthWebView loginUrl={authLoginUrl}/>}
        </ScraperContext.Provider>
    );
}

/**
 * Hook to access scraper methods from context.
 * Triggers lazy WebView mount on iOS on first consumer render, so call it only from
 * screens that scrape.
 */
export function useScraper(): ScraperContextValue {
    const context = useContext(ScraperContext);
    if (!context) {
        throw new Error('useScraper must be used within a ScraperProvider');
    }

    const warmupRef = useRef(context.warmup);

    useEffect(() => {
        warmupRef.current();
    }, []);

    return {
        scrapeRecipeFromHtml: context.scrapeRecipeFromHtml,
        scrapeRecipeAuthenticated: context.scrapeRecipeAuthenticated,
    };
}
