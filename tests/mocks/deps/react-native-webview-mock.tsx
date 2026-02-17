import React from 'react';
import { View, Text } from 'react-native';

const WebView = (props: Record<string, unknown>) => (
  <View testID='mock-webview'>
    <Text>{JSON.stringify(props.source)}</Text>
  </View>
);

export default WebView;
