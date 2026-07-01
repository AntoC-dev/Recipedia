/**
 * ScraperProvider - Owns the RecipeScraper instance and exposes scrape methods via React context.
 *
 * On iOS, lazily mounts the Pyodide WebView on first `useScraper()` consumer.
 * On Android, no WebView is needed (Chaquopy provides the Python runtime natively).
 *
 * All scraping goes through this provider — app code never imports the singleton directly.
 */

import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {InteractionManager, Platform} from 'react-native';
import {PyodideWebView} from './ios/PyodideWebView';
import {AuthWebView} from './ios/AuthWebView';
import {AuthBridge} from './ios/AuthBridge';
import type {ScrapeOptions} from './RecipeScraper';
import {recipeScraper} from './RecipeScraper';
import type {ScrapedRecipe, ScraperResult} from './types';
import {pyodideLogger} from '@utils/logger';

/**
 * Shape of the scraper context value exposed to consumers via `useScraper()`.
 */
export interface ScraperContextValue {
    scrapeRecipeFromHtml: (html: string, url: string, options?: ScrapeOptions) => Promise<ScraperResult<ScrapedRecipe>>;
    scrapeRecipeAuthenticated: (url: string, username: string, password: string, options?: ScrapeOptions) => Promise<ScraperResult<ScrapedRecipe>>;
    initError: string | null;
}

interface InternalContextValue extends ScraperContextValue {
    warmup: () => void;
}

const ScraperContext = createContext<InternalContextValue | null>(null);

/** Wraps the app. Owns the scraper instance and renders iOS WebView when needed. */
export function ScraperProvider({children}: { children: React.ReactNode }) {
    const [warmedUp, setWarmedUp] = useState(false);
    const [authLoginUrl, setAuthLoginUrl] = useState<string | null>(null);
    const [initError, setInitError] = useState<string | null>(null);

    const warmup = () => {
        InteractionManager.runAfterInteractions(() => setWarmedUp(true));
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
            const message = error instanceof Error ? error.message : String(error);
            pyodideLogger.warn('Pyodide failed to initialize', {error: message});
            setInitError(message);
        });
    }, [warmedUp]);

    const scrapeRecipeFromHtml = async (
        html: string,
        url: string,
        options?: ScrapeOptions,
    ): Promise<ScraperResult<ScrapedRecipe>> => {
        await recipeScraper.whenReady();
        return recipeScraper.scrapeRecipeFromHtml(html, url, options);
    };

    const scrapeRecipeAuthenticated = async (
        url: string,
        username: string,
        password: string,
        options?: ScrapeOptions,
    ): Promise<ScraperResult<ScrapedRecipe>> => {
        await recipeScraper.whenReady();
        return recipeScraper.scrapeRecipeAuthenticated(url, username, password, options);
    };

    const isIOS = Platform.OS === 'ios';

    return (
        <ScraperContext.Provider value={{warmup, scrapeRecipeFromHtml, scrapeRecipeAuthenticated, initError}}>
            {children}
            {isIOS && warmedUp && <PyodideWebView/>}
            {isIOS && authLoginUrl !== null && <AuthWebView loginUrl={authLoginUrl}/>}
        </ScraperContext.Provider>
    );
}

/**
 * Hook to access scraper methods from context.
 * Triggers lazy WebView mount on iOS on first consumer render.
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
        initError: context.initError,
    };
}
