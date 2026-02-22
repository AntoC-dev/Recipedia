/**
 * AuthWebView - Hidden WebView for iOS authenticated recipe scraping.
 *
 * Rendered on demand (only while an auth request is in progress) to
 * avoid keeping a permanent WKWebView in memory. The WebView navigates
 * directly to the login page via the `loginUrl` prop; once loaded,
 * AuthBridge injects a same-origin JavaScript auth script.
 */

import React, {useRef, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import WebView from 'react-native-webview';
import type {
    WebViewErrorEvent,
    WebViewNavigationEvent,
} from 'react-native-webview/lib/WebViewTypes';
import {AuthBridge} from './AuthBridge';

interface Props {
    loginUrl: string;
}

export function AuthWebView({loginUrl}: Props): React.ReactElement {
    const webViewRef = useRef<WebView>(null);

    useEffect(() => {
        AuthBridge.setInjectHandler((script: string) => {
            webViewRef.current?.injectJavaScript(script);
        });

        return () => {
            AuthBridge.destroy();
        };
    }, []);

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{uri: loginUrl}}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                onLoadEnd={(event: WebViewNavigationEvent | WebViewErrorEvent) => {
                    AuthBridge.handleLoadEnd(event.nativeEvent.url);
                }}
                onMessage={event => {
                    AuthBridge.handleMessage(event.nativeEvent.data);
                }}
                onError={(event: WebViewErrorEvent) => {
                    AuthBridge.handleWebViewError(event.nativeEvent.description);
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
