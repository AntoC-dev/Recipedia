/**
 * Renders every section and item eagerly, unlike the real SectionList which
 * windows to `initialNumToRender` (10) and so never mounts the later ingredient
 * categories under test. Also echoes the list-level props back as Text so they
 * can be asserted.
 */

import React from 'react';
import type * as ReactNative from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

function sectionListMock({
  testID,
  sections,
  renderItem,
  renderSectionHeader,
  keyExtractor,
  stickySectionHeadersEnabled,
  contentContainerStyle,
  ListHeaderComponent,
  ListFooterComponent,
}: any) {
  return (
    <View testID={testID}>
      <Text testID={testID + '::stickySectionHeadersEnabled'}>
        {String(stickySectionHeadersEnabled)}
      </Text>
      <Text testID={testID + '::contentContainerStyle'}>
        {JSON.stringify(StyleSheet.flatten(contentContainerStyle))}
      </Text>
      {ListHeaderComponent}
      {sections.map((section: any, sectionIndex: number) => (
        <View key={sectionIndex}>
          {renderSectionHeader({ section })}
          {section.data.map((item: any, index: number) => (
            <View key={keyExtractor ? keyExtractor(item, index) : index}>
              {renderItem({ item, index, section })}
            </View>
          ))}
        </View>
      ))}
      {ListFooterComponent}
    </View>
  );
}

/**
 * Swaps `SectionList` for {@link sectionListMock} on the public `react-native` module.
 */
export function mockSectionList() {
  const reactNative: typeof ReactNative = jest.requireActual('react-native');
  return jest.spyOn(reactNative, 'SectionList').mockImplementation(sectionListMock as never);
}
