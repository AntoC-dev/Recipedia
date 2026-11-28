import React from 'react';
import { Text as RNText, TouchableOpacity, View } from 'react-native';

const paperMock = jest.requireActual<typeof import('./react-native-paper-mock')>(
  './react-native-paper-mock'
);

const CollapsibleAccordion = (props: any) => (
  <View testID={props.testID} style={props.style}>
    <TouchableOpacity testID={props.testID + '::Header'} onPress={props.onPress ?? (() => {})}>
      <RNText testID={props.testID + '::Title'} style={props.titleStyle}>
        {props.title}
      </RNText>
      <RNText testID={props.testID + '::Description'}>{props.description}</RNText>
      <RNText testID={props.testID + '::Expanded'}>{String(props.expanded)}</RNText>
    </TouchableOpacity>
    {props.expanded ? <View testID={props.testID + '::Content'}>{props.children}</View> : null}
  </View>
);

export function collapsibleAccordionPaperMock() {
  return {
    ...paperMock,
    List: { ...paperMock.List, Accordion: CollapsibleAccordion },
  };
}
