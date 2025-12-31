import { Button, Text, View } from 'react-native';
import React from 'react';
import { TextInputWithDropDownType } from '@components/molecules/TextInputWithDropDown';

export function textInputWithDropdownMock(inputWithDropdownProps: TextInputWithDropDownType) {
  return (
    <View>
      <Text testID={inputWithDropdownProps.testID + '::TextInputWithDropdown::ReferenceTextArray'}>
        {JSON.stringify(inputWithDropdownProps.referenceTextArray)}
      </Text>
      <Text testID={inputWithDropdownProps.testID + '::TextInputWithDropdown::Value'}>
        {inputWithDropdownProps.value}
      </Text>
      <Text testID={inputWithDropdownProps.testID + '::TextInputWithDropdown::Label'}>
        {inputWithDropdownProps.label}
      </Text>
      <Text testID={inputWithDropdownProps.testID + '::TextInputWithDropdown::HideDropdown'}>
        {String(inputWithDropdownProps.hideDropdown ?? false)}
      </Text>
      <Button
        testID={inputWithDropdownProps.testID + '::TextInputWithDropdown::OnValidate'}
        onPress={() => {
          // @ts-ignore
          inputWithDropdownProps.onValidate('Test string');
        }}
        title='Click on Validate'
      />
      <View testID={inputWithDropdownProps.testID + '::TextInputWithDropdown::RightElement'}>
        {inputWithDropdownProps.right}
      </View>
    </View>
  );
}
