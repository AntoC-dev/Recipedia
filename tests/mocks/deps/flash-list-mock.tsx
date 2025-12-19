import React from 'react';
import { View } from 'react-native';

export function FlashList({ data, renderItem, keyExtractor, testID }: any) {
  return (
    <View testID={testID}>
      {data?.map((item: any, index: number) => (
        <View key={keyExtractor ? keyExtractor(item, index) : index}>
          {renderItem({ item, index })}
        </View>
      ))}
    </View>
  );
}

export function flashListMock() {
  return {
    FlashList,
  };
}
