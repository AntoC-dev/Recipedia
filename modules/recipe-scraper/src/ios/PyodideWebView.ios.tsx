/**
 * PyodideWebView - Hidden WebView for running Pyodide on iOS.
 *
 * Loads a pre-bundled Pyodide HTML file (built into the app via expo-asset)
 * containing the WASM runtime and Python packages, ensuring offline support.
 *
 * The HTML is loaded by URI (`source={{uri}}`) rather than as a JS string:
 * expo-file-system@55's File.text() denies reads of files inside the iOS
 * app bundle ("Missing permission for uri"), and reading multi-MB HTML into
 * the JS heap is wasteful regardless.
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

export function PyodideWebView(): React.ReactElement | null {
    const webViewRef = useRef<WebView>(null);
    const [bundleUri, setBundleUri] = useState<string | null>(null);

    useEffect(() => {
        if (!PYODIDE_BUNDLE) {
            pyodideLogger.warn('Skipping Pyodide initialization — bundle not available');
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

                if (!mounted) return;

                pyodideLogger.info('Bundle URI resolved', {uri: asset.localUri});
                setBundleUri(asset.localUri);
            } catch (error) {
                if (!mounted) return;

                const message =
                    error instanceof Error ? error.message : String(error);
                pyodideLogger.error('Failed to resolve bundle URI', {error: message});
            }
        }

        loadBundle();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        PyodideBridge.attach((message: string) => {
            if (webViewRef.current) {
                webViewRef.current.postMessage(message);
            }
        });

        return () => {
            PyodideBridge.detach();
        };
    }, []);

    const handleMessage = (event: WebViewMessageEvent) => {
        PyodideBridge.handleMessage(event.nativeEvent.data);
    };

    if (Platform.OS !== 'ios') {
        return null;
    }

    if (!bundleUri) {
        return null;
    }

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{uri: bundleUri}}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
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
