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
import * as FileSystem from 'expo-file-system/legacy';
import {PyodideBridge} from './PyodideBridge';

// The bundled HTML file is generated at build time by setup-pyodide.sh
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PYODIDE_BUNDLE = require('../../assets/pyodide-bundle.html');

// Using about:blank gives the WebView a null (opaque) origin.
// PyPI (micropip) serves packages with Access-Control-Allow-Origin: *,
// so null-origin fetches still work for Pyodide initialization.
const PYODIDE_BASE_URL = 'about:blank';

export function PyodideWebView(): React.ReactElement | null {
    const webViewRef = useRef<WebView>(null);
    const [htmlContent, setHtmlContent] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function loadBundle() {
            try {
                const asset = Asset.fromModule(PYODIDE_BUNDLE);
                await asset.downloadAsync();

                if (!asset.localUri) {
                    throw new Error('Failed to get local URI for Pyodide bundle');
                }

                const content = await FileSystem.readAsStringAsync(
                    asset.localUri,
                );

                if (!mounted) return;

                setHtmlContent(content);
            } catch (error) {
                if (!mounted) return;

                const message =
                    error instanceof Error ? error.message : String(error);
                console.error('[PyodideWebView] Failed to load bundle:', message);
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
                const escaped = message.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                webViewRef.current.injectJavaScript(
                    `window.handleMessage('${escaped}'); true;`,
                );
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
        if (loadError) {
            console.error('[PyodideWebView] Bundle load error:', loadError);
        }
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
                    console.error('[PyodideWebView] Error:', nativeEvent);
                }}
                onHttpError={(syntheticEvent: WebViewHttpErrorEvent) => {
                    const {nativeEvent} = syntheticEvent;
                    console.error(
                        '[PyodideWebView] HTTP Error:',
                        nativeEvent.statusCode,
                    );
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
