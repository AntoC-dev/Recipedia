import React, { useImperativeHandle, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

function MockSearchBar({ testId, setSearchBarClicked, updateSearchString, clearRef }: any) {
  const [clicked, setClicked] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');

  useImperativeHandle(clearRef, () => ({
    clear: () => setCurrentPhrase(''),
    setText: (text: string) => setCurrentPhrase(text),
  }));

  return (
    <View testID={testId}>
      <Text testID={testId + '::SearchPhrase'}>{currentPhrase}</Text>
      <Text testID={testId + '::Clicked'}>{clicked.toString()}</Text>
      <TouchableOpacity
        testID={testId + '::ToggleClicked'}
        onPress={() => {
          setClicked(!clicked);
          if (setSearchBarClicked) setSearchBarClicked(!clicked);
        }}
      >
        <Text>Toggle Clicked</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID={testId + '::UpdateSearchPhrase'}
        onPress={() => {
          const searchSteps = ['', 'S', 'Su', 'Sus', 'Sush', 'Sushi'];
          const currentIndex = searchSteps.indexOf(currentPhrase);
          const nextIndex = (currentIndex + 1) % searchSteps.length;
          const newPhrase = searchSteps[nextIndex]!;
          setCurrentPhrase(newPhrase);
          if (updateSearchString) updateSearchString(newPhrase);
        }}
      >
        <Text>Update Search</Text>
      </TouchableOpacity>
      {currentPhrase.length > 0 && (
        <TouchableOpacity testID={testId + '::RightIcon'}>
          <Text>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export const searchBarMock = MockSearchBar;
