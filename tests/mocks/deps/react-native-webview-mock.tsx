import React from 'react';
import { View, Text, Button } from 'react-native';

const WebView = (props: Record<string, unknown>) => {
  const source = props.source as { uri?: string; html?: string } | undefined;
  return (
    <View testID='mock-webview'>
      <Text>{JSON.stringify(source)}</Text>
      {typeof props.onLoadEnd === 'function' && (
        <Button
          testID='mock-webview-onLoadEnd'
          title='onLoadEnd'
          onPress={() => (props.onLoadEnd as Function)({ nativeEvent: { url: source?.uri ?? '' } })}
        />
      )}
      {typeof props.onMessage === 'function' && (
        <Button
          testID='mock-webview-onMessage'
          title='onMessage'
          onPress={() => (props.onMessage as Function)({ nativeEvent: { data: 'mock-message' } })}
        />
      )}
      {typeof props.onError === 'function' && (
        <Button
          testID='mock-webview-onError'
          title='onError'
          onPress={() =>
            (props.onError as Function)({ nativeEvent: { description: 'mock-error' } })
          }
        />
      )}
    </View>
  );
};

export default WebView;
