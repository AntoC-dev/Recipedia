import React from 'react';
import { FlatList } from 'react-native';

export function flashListMock() {
  return {
    FlashList: FlatList,
    AnimatedFlashList: FlatList,
  };
}
