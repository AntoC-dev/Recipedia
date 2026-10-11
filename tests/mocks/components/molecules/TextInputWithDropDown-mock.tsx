import { Button, Text, View } from 'react-native';
import React, { useState } from 'react';
import { TextInputWithDropDownType } from '@components/molecules/TextInputWithDropDown';

export function TextInputWithDropDownMock(inputWithDropdownProps: TextInputWithDropDownType) {
  const testID = inputWithDropdownProps.testID + '::TextInputWithDropdown';
  const [isDropdownShown, setIsDropdownShown] = useState(false);
  const field = (
    <View>
      <Text testID={testID + '::ReferenceTextArray'}>
        {JSON.stringify(inputWithDropdownProps.referenceTextArray)}
      </Text>
      <Text testID={testID + '::Value'}>{inputWithDropdownProps.value}</Text>
      <Text testID={testID + '::Label'}>{inputWithDropdownProps.label}</Text>
      <Text testID={testID + '::Mode'}>{inputWithDropdownProps.mode}</Text>
      <Text testID={testID + '::Dense'}>{String(inputWithDropdownProps.dense)}</Text>
      <Text testID={testID + '::Style'}>{JSON.stringify(inputWithDropdownProps.style)}</Text>
      <Text testID={testID + '::ContentStyle'}>
        {JSON.stringify(inputWithDropdownProps.contentStyle)}
      </Text>
      <Text testID={testID + '::TextInputStyle'}>
        {JSON.stringify(inputWithDropdownProps.textInputStyle)}
      </Text>
      <Button
        testID={testID + '::OnValidate'}
        onPress={() => inputWithDropdownProps.onValidate?.('Test string')}
        title='Click on Validate'
      />
      <Button
        testID={testID + '::OnValidateBlank'}
        onPress={() => inputWithDropdownProps.onValidate?.('  ')}
        title='Click on Validate blank'
      />
      <Button
        testID={testID + '::OnChangeText'}
        onPress={() => inputWithDropdownProps.onChangeText?.('Test string')}
        title='Click on ChangeText'
      />
      <Button
        testID={testID + '::OnSelect'}
        onPress={() => inputWithDropdownProps.onSelect?.('Test string')}
        title='Click on Select'
      />
      <Button
        testID={testID + '::OnSelectBlank'}
        onPress={() => inputWithDropdownProps.onSelect?.('')}
        title='Click on Select blank'
      />
      <Button
        testID={testID + '::OnFocus'}
        onPress={() => inputWithDropdownProps.onFocus?.()}
        title='Click on Focus'
      />
      <Button
        testID={testID + '::OnBlur'}
        onPress={() => inputWithDropdownProps.onBlur?.()}
        title='Click on Blur'
      />
      <Button
        testID={testID + '::ShowDropdown'}
        onPress={() => setIsDropdownShown(true)}
        title='Click on ShowDropdown'
      />
      <View testID={testID + '::RightElement'}>{inputWithDropdownProps.right}</View>
    </View>
  );
  const dropdown = isDropdownShown ? <Text testID={testID + '::Dropdown'}>Dropdown</Text> : null;

  if (inputWithDropdownProps.renderLayout) {
    return inputWithDropdownProps.renderLayout(field, dropdown);
  }
  return (
    <View>
      {field}
      {dropdown}
    </View>
  );
}
