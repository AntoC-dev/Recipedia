/**
 * PyodideWebView - Hidden WebView for running Pyodide on iOS.
 *
 * This component manages a hidden WebView that loads a pre-bundled Pyodide
 * HTML file containing the WASM runtime and Python packages. The bundle is
 * generated at build time and loaded from expo-asset, ensuring offline support.
 */

import React, {useRef, useEffect, useState} from 'react';
import {StyleSheet, View, Platform} from 'react-native';
import WebView from 'react-native-webview';
import type {
    WebViewMessageEvent,
    WebViewErrorEvent,
    WebViewHttpErrorEvent,
} from 'react-native-webview/lib/WebViewTypes';
import {Asset} from 'expo-asset';
import { File } from 'expo-file-system';
import {PyodideBridge} from './PyodideBridge';
import {pyodideLogger} from '@utils/logger';

let PYODIDE_BUNDLE: number | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    PYODIDE_BUNDLE = require('../../assets/pyodide-bundle.html');
} catch (error) {
    pyodideLogger.error('Pyodide bundle asset not found — web scraping will use schema.org fallback', {
        error: error instanceof Error ? error.message : String(error),
    });
}

const PYODIDE_BASE_URL = 'about:blank';

export function PyodideWebView(): React.ReactElement | null {
    const webViewRef = useRef<WebView>(null);
    const [htmlContent, setHtmlContent] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (!PYODIDE_BUNDLE) {
            pyodideLogger.warn('Skipping Pyodide initialization — bundle not available');
            setLoadError('Pyodide bundle asset not found');
            return;
        }

        let mounted = true;

        async function loadBundle() {
            try {
                const asset = Asset.fromModule(PYODIDE_BUNDLE!);
                await asset.downloadAsync();

                if (!asset.localUri) {
                    throw new Error('Failed to get local URI for Pyodide bundle');
                }

                const content = await new File(asset.localUri).text();

                if (!mounted) return;

                pyodideLogger.info('Bundle loaded successfully');
                setHtmlContent(content);
            } catch (error) {
                if (!mounted) return;

                const message =
                    error instanceof Error ? error.message : String(error);
                pyodideLogger.error('Failed to load bundle', { error: message });
                setLoadError(message);
            }
        }

        loadBundle();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        PyodideBridge.setMessageHandler((message: string) => {
            if (webViewRef.current) {
                webViewRef.current.postMessage(message);
            }
        });

        return () => {
            PyodideBridge.destroy();
        };
    }, []);

    const handleMessage = (event: WebViewMessageEvent) => {
        PyodideBridge.handleMessage(event.nativeEvent.data);
    };

    // Don't render on Android (uses Chaquopy instead)
    if (Platform.OS !== 'ios') {
        return null;
    }

    // Show nothing while loading
    if (!htmlContent) {
        return null;
    }

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{html: htmlContent, baseUrl: PYODIDE_BASE_URL}}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={handleMessage}
                onError={(syntheticEvent: WebViewErrorEvent) => {
                    const {nativeEvent} = syntheticEvent;
                    pyodideLogger.error('WebView error', nativeEvent);
                }}
                onHttpError={(syntheticEvent: WebViewHttpErrorEvent) => {
                    const {nativeEvent} = syntheticEvent;
                    pyodideLogger.error('WebView HTTP error', {
                        statusCode: nativeEvent.statusCode,
                    });
                }}
                style={styles.webview}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: 0,
        height: 0,
        opacity: 0,
        overflow: 'hidden',
    },
    webview: {
        width: 1,
        height: 1,
    },
});
