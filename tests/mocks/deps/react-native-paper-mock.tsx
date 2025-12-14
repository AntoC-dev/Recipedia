import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

// Mock components with proper TypeScript types
export const Button: React.FC<any> = props => (
  <TouchableOpacity
    testID={props.testID}
    onPress={props.onPress}
    style={props.style}
    {...{ disabled: props.disabled }}
  >
    <RNText>{props.children}</RNText>
  </TouchableOpacity>
);

export const RadioButton: React.FC<any> & { Group: React.FC<any> } = props => (
  <TouchableOpacity testID={props.testID} onPress={props.onPress}>
    <RNText>RadioButton</RNText>
  </TouchableOpacity>
);

const RadioButtonGroup: React.FC<any> = props => (
  <View testID={props.testID} {...{ value: props.value, onValueChange: props.onValueChange }}>
    {props.children}
  </View>
);
RadioButtonGroup.displayName = 'RadioButton.Group';
RadioButton.Group = RadioButtonGroup;

export const Dialog: React.FC<any> & {
  Title: React.FC<any>;
  Content: React.FC<any>;
  Actions: React.FC<any>;
  Icon: React.FC<any>;
} = props => {
  // Only render children when visible is true (matches real react-native-paper behavior)
  if (!props.visible) {
    return null;
  }

  return (
    <View testID={props.testID} {...{ visible: props.visible, onDismiss: props.onDismiss }}>
      {props.children}
    </View>
  );
};

const DialogTitle: React.FC<any> = props => <RNText testID={props.testID}>{props.children}</RNText>;
DialogTitle.displayName = 'Dialog.Title';
Dialog.Title = DialogTitle;

const DialogContent: React.FC<any> = props => <View testID={props.testID}>{props.children}</View>;
DialogContent.displayName = 'Dialog.Content';
Dialog.Content = DialogContent;

const DialogActions: React.FC<any> = props => <View testID={props.testID}>{props.children}</View>;
DialogActions.displayName = 'Dialog.Actions';
Dialog.Actions = DialogActions;

const DialogIcon: React.FC<any> = props => (
  <View testID={props.testID}>
    <RNText testID={props.testID + '::Icon'}>{props.icon}</RNText>
  </View>
);
DialogIcon.displayName = 'Dialog.Icon';
Dialog.Icon = DialogIcon;

export const Menu: React.FC<any> & { Item: React.FC<any> } = props => (
  <View testID={props.testID} {...{ visible: props.visible, onDismiss: props.onDismiss }}>
    {props.children}
  </View>
);

const MenuItem: React.FC<any> = props => (
  <TouchableOpacity testID={props.testID} onPress={props.onPress}>
    <RNText>{props.title || props.children}</RNText>
  </TouchableOpacity>
);
MenuItem.displayName = 'Menu.Item';
Menu.Item = MenuItem;

export const Portal: React.FC<any> = props => <View testID={props.testID}>{props.children}</View>;

export const Modal: React.FC<any> = props => {
  if (!props.visible) {
    return null;
  }
  return (
    <View testID={props.testID} style={props.contentContainerStyle}>
      {props.children}
    </View>
  );
};

export const Text: React.FC<any> = props => (
  <RNText
    testID={props.testID}
    style={props.style}
    numberOfLines={props.numberOfLines}
    {...{ variant: props.variant }}
  >
    {props.children}
  </RNText>
);

const TextInputComponent = React.forwardRef<any, any>((props, _ref) => {
  const textInputProps: TextInputProps = {
    testID: props.testID,
    style: props.style,
    value: props.value,
    onChangeText: props.onChangeText,
    onFocus: props.onFocus,
    onBlur: props.onBlur,
    onEndEditing: props.onEndEditing,
    onContentSizeChange: props.onContentSizeChange,
    placeholder: props.placeholder,
    editable: props.editable,
    multiline: props.multiline,
    keyboardType: props.keyboardType,
    secureTextEntry: props.secureTextEntry,
  };

  return (
    <View>
      {props.label && <RNText testID={props.testID + '::Label'}>{props.label}</RNText>}
      <RNTextInput
        {...textInputProps}
        {...{
          label: props.label,
          mode: props.mode,
          dense: props.dense,
          right: props.right,
          secureTextEntry: props.secureTextEntry,
        }}
      />
      {props.right && <View testID={props.testID + '::Right'}>{props.right}</View>}
    </View>
  );
});
TextInputComponent.displayName = 'TextInput';

const TextInputAffix: React.FC<any> = props => <RNText testID={props.testID}>{props.text}</RNText>;
TextInputAffix.displayName = 'TextInput.Affix';
(TextInputComponent as any).Affix = TextInputAffix;

const TextInputIcon: React.FC<any> = props => (
  <TouchableOpacity testID={props.testID} onPress={props.onPress}>
    <RNText testID={props.testID + '::Icon'}>{props.icon}</RNText>
  </TouchableOpacity>
);
TextInputIcon.displayName = 'TextInput.Icon';
(TextInputComponent as any).Icon = TextInputIcon;

export const TextInput = TextInputComponent;

export const Chip: React.FC<any> = props => (
  <TouchableOpacity testID={props.testID} onPress={props.onPress} style={props.style}>
    <RNText testID={props.testID + '::Children'}>{props.children}</RNText>
  </TouchableOpacity>
);

export const Card: React.FC<any> & {
  Content: React.FC<any>;
  Actions: React.FC<any>;
  Cover: React.FC<any>;
  Title: React.FC<any>;
} = props => (
  <TouchableOpacity
    testID={props.testID}
    style={props.style}
    onPress={props.onPress}
    accessible={true}
  >
    <View>{props.children}</View>
  </TouchableOpacity>
);

const CardContent: React.FC<any> = props => (
  <View testID={props.testID} style={props.style}>
    {props.children}
  </View>
);
CardContent.displayName = 'Card.Content';
Card.Content = CardContent;

const CardActions: React.FC<any> = props => (
  <View testID={props.testID} style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
    {props.children}
  </View>
);
CardActions.displayName = 'Card.Actions';
Card.Actions = CardActions;

const CardCover: React.FC<any> = props => (
  <View testID={props.testID} style={props.style}>
    <RNText testID={props.testID + '::Source'}>{props.source?.uri || 'no-image'}</RNText>
  </View>
);
CardCover.displayName = 'Card.Cover';
Card.Cover = CardCover;

const CardTitle: React.FC<any> = props => (
  <View testID={props.testID}>
    <RNText testID={props.testID + '::TitleText'} numberOfLines={props.titleNumberOfLines}>
      {props.title}
    </RNText>
    <RNText testID={props.testID + '::TitleVariant'}>{props.titleVariant}</RNText>
  </View>
);
CardTitle.displayName = 'Card.Title';
Card.Title = CardTitle;

export const Divider: React.FC<any> = props => (
  <View testID={props.testID || 'divider'} {...props} />
);

export const Checkbox: React.FC<any> = props => (
  <TouchableOpacity testID={props.testID} onPress={props.onPress}>
    <RNText testID={props.testID + '::Status'}>{props.status}</RNText>
  </TouchableOpacity>
);

export const Icon: React.FC<any> = props => (
  <View testID={props.testID} {...{ size: props.size, color: props.color }}>
    <RNText testID={props.testID + '::Source'}>{props.source}</RNText>
  </View>
);

export const IconButton: React.FC<any> = props => (
  <TouchableOpacity testID={props.testID} onPress={props.onPress} style={props.style}>
    <RNText testID={props.testID + '::Icon'}>{props.icon}</RNText>
  </TouchableOpacity>
);

export const Searchbar: React.FC<any> = props => (
  <View testID={props.testID} style={props.style}>
    <RNText testID={props.testID + '::Mode'}>{props.mode}</RNText>
    <RNTextInput
      testID={props.testID + '::TextInput'}
      placeholder={props.placeholder}
      onChangeText={props.onChangeText}
      value={props.value}
      onFocus={props.onFocus}
      onSubmitEditing={props.onSubmitEditing}
    />
    <RNText testID={props.testID + '::Placeholder'}>{props.placeholder}</RNText>
    <View testID={props.testID + '::RightContainer'}>
      {props.right && props.right({ testID: props.testID + '::Right' })}
    </View>
  </View>
);

export const configureFonts = jest.fn((config?: any) => {
  return (
    config?.config || {
      titleLarge: { fontFamily: 'System', fontWeight: '400' },
      titleMedium: { fontFamily: 'System', fontWeight: '400' },
      titleSmall: { fontFamily: 'System', fontWeight: '400' },
      bodyLarge: { fontFamily: 'System', fontWeight: '400' },
      bodyMedium: { fontFamily: 'System', fontWeight: '400' },
      bodySmall: { fontFamily: 'System', fontWeight: '400' },
      labelLarge: { fontFamily: 'System', fontWeight: '400' },
      labelMedium: { fontFamily: 'System', fontWeight: '400' },
      labelSmall: { fontFamily: 'System', fontWeight: '400' },
    }
  );
});

export const useTheme = jest.fn(() => ({
  colors: {
    primary: '#6200ee',
    primaryContainer: '#e8def8',
    secondary: '#03dac6',
    secondaryContainer: '#cefaf8',
    tertiary: '#7c5800',
    background: '#f6f6f6',
    surface: '#ffffff',
    surfaceVariant: '#e7e0ec',
    error: '#b00020',
    onPrimary: '#ffffff',
    onSecondary: '#000000',
    onBackground: '#000000',
    onSurface: '#000000',
    onSurfaceVariant: '#49454f',
    onError: '#ffffff',
    text: '#000000',
    disabled: '#9e9e9e',
    placeholder: '#9e9e9e',
    backdrop: 'rgba(0,0,0,0.5)',
    notification: '#f50057',
    outline: '#79767d',
  },
  fonts: {
    bodySmall: { fontSize: 12 },
    bodyMedium: { fontSize: 14 },
    bodyLarge: { fontSize: 16 },
    headlineSmall: { fontSize: 18 },
    headlineMedium: { fontSize: 20 },
    headlineLarge: { fontSize: 24 },
    titleSmall: { fontSize: 16 },
    titleMedium: { fontSize: 18 },
    titleLarge: { fontSize: 20 },
    labelSmall: { fontSize: 10 },
    labelMedium: { fontSize: 12 },
    labelLarge: { fontSize: 14 },
  },
}));

export const Switch: React.FC<any> = props => (
  <TouchableOpacity
    testID={props.testID}
    onPress={() => props.onValueChange && props.onValueChange(!props.value)}
    {...{ value: props.value, onValueChange: props.onValueChange }}
  >
    <RNText testID={props.testID + '::Value'}>{props.value ? 'ON' : 'OFF'}</RNText>
  </TouchableOpacity>
);

export const SegmentedButtons: React.FC<any> = props => (
  <View testID={props.testID} style={props.style}>
    {props.buttons?.map((button: any, index: number) => (
      <TouchableOpacity
        key={button.value || index}
        testID={props.testID + '::Button::' + (button.value || index)}
        onPress={() => props.onValueChange && props.onValueChange(button.value)}
        {...{ value: props.value, onValueChange: props.onValueChange }}
      >
        <RNText testID={props.testID + '::Button::' + (button.value || index) + '::Label'}>
          {button.label}
        </RNText>
      </TouchableOpacity>
    ))}
  </View>
);

export const List = {
  Section: (props: any) => (
    <View testID='list-section' {...props}>
      <RNText testID='list-section-title'>{props.title}</RNText>
      <View testID='list-section-content'>{props.children}</View>
    </View>
  ),
  Subheader: (props: any) => <RNText testID={props.testID}>{props.children}</RNText>,
  Item: (props: any) => (
    <TouchableOpacity testID={props.testID} onPress={props.onPress} style={props.style}>
      {props.left && (
        <View testID={props.testID + '::Left'}>
          {typeof props.left === 'function' ? props.left() : props.left}
        </View>
      )}
      <View testID={props.testID + '::Content'}>
        <RNText testID={props.testID + '::Title'} numberOfLines={props.titleNumberOfLines}>
          {props.title}
        </RNText>
        {props.description && (
          <RNText testID={props.testID + '::Description'}>{props.description}</RNText>
        )}
      </View>
      {props.right && (
        <View testID={props.testID + '::Right'}>
          {typeof props.right === 'function' ? props.right() : props.right}
        </View>
      )}
    </TouchableOpacity>
  ),
  Icon: (props: any) => <RNText testID='list-icon'>{props.icon}</RNText>,
  Accordion: (props: any) => (
    <View testID={props.testID} style={props.style}>
      <TouchableOpacity testID={props.testID + '::Header'} onPress={() => {}}>
        <RNText testID={props.testID + '::Title'}>{props.title}</RNText>
      </TouchableOpacity>
      <View testID={props.testID + '::Content'}>{props.children}</View>
    </View>
  ),
  AccordionGroup: (props: any) => <View testID={props.testID}>{props.children}</View>,
};

export const ActivityIndicator: React.FC<any> = props => (
  <View testID={props.testID}>
    <RNText testID={props.testID + '::Size'}>{props.size}</RNText>
  </View>
);

export const ProgressBar: React.FC<any> = props => (
  <View
    testID={props.testID}
    style={props.style}
    {...{ progress: props.progress, color: props.color }}
  >
    <RNText testID={props.testID + '::Progress'}>{props.progress}</RNText>
  </View>
);

export const DataTable: React.FC<any> & {
  Header: React.FC<any>;
  Title: React.FC<any>;
  Row: React.FC<any>;
  Cell: React.FC<any>;
} = props => (
  <View testID={props.testID} style={props.style}>
    {props.children}
  </View>
);

const DataTableHeader: React.FC<any> = props => (
  <View testID={props.testID} style={props.style}>
    {props.children}
  </View>
);
DataTableHeader.displayName = 'DataTable.Header';
DataTable.Header = DataTableHeader;

const DataTableTitle: React.FC<any> = props => (
  <View testID={props.testID} style={props.style}>
    <RNText testID={props.testID + '::Text'} style={props.textStyle}>
      {props.children}
    </RNText>
  </View>
);
DataTableTitle.displayName = 'DataTable.Title';
DataTable.Title = DataTableTitle;

const DataTableRow: React.FC<any> = props => (
  <View testID={props.testID} style={props.style}>
    {props.children}
  </View>
);
DataTableRow.displayName = 'DataTable.Row';
DataTable.Row = DataTableRow;

const DataTableCell: React.FC<any> = props => (
  <View testID={props.testID} style={props.style}>
    {props.children}
  </View>
);
DataTableCell.displayName = 'DataTable.Cell';
DataTable.Cell = DataTableCell;

export const HelperText: React.FC<any> = props => {
  if (!props.visible) {
    return null;
  }
  return (
    <RNText testID={props.testID} {...{ type: props.type, visible: props.visible }}>
      {props.children}
    </RNText>
  );
};
export const FAB: React.FC<any> & { Group: React.FC<any> } = props => (
  <TouchableOpacity testID={props.testID} onPress={props.onPress} style={props.style}>
    <RNText testID={props.testID + '::Icon'}>{props.icon}</RNText>
    {props.label && <RNText testID={props.testID + '::Label'}>{props.label}</RNText>}
  </TouchableOpacity>
);

const FABGroup: React.FC<any> = props => {
  const renderActions = () => {
    if (!props.open || !props.actions) return null;
    return props.actions.map((action: any, index: number) => (
      <TouchableOpacity
        key={action.testID || index}
        testID={action.testID}
        onPress={action.onPress}
      >
        <RNText testID={action.testID + '::Icon'}>{action.icon}</RNText>
        {action.label && <RNText testID={action.testID + '::Label'}>{action.label}</RNText>}
      </TouchableOpacity>
    ));
  };

  return (
    <View testID='FAB.Group' style={props.fabStyle}>
      {renderActions()}
      <TouchableOpacity
        testID={props.testID}
        onPress={() => props.onStateChange && props.onStateChange({ open: !props.open })}
      >
        <RNText testID={props.testID + '::Icon'}>{props.icon}</RNText>
      </TouchableOpacity>
    </View>
  );
};
FABGroup.displayName = 'FAB.Group';
FAB.Group = FABGroup;

export const Appbar: React.FC<any> & {
  Header: React.FC<any>;
  Content: React.FC<any>;
  Action: React.FC<any>;
  BackAction: React.FC<any>;
} = props => (
  <View testID={props.testID} style={props.style}>
    {props.children}
  </View>
);

const AppbarHeader: React.FC<any> = props => (
  <View testID={props.testID} style={props.style}>
    {props.children}
  </View>
);
AppbarHeader.displayName = 'Appbar.Header';
Appbar.Header = AppbarHeader;

const AppbarContent: React.FC<any> = props => (
  <View testID={props.testID} style={props.style}>
    <RNText testID={props.testID + '::Title'}>{props.title}</RNText>
  </View>
);
AppbarContent.displayName = 'Appbar.Content';
Appbar.Content = AppbarContent;

const AppbarAction: React.FC<any> = props => (
  <TouchableOpacity testID={props.testID} onPress={props.onPress}>
    <RNText testID={props.testID + '::Icon'}>{props.icon}</RNText>
  </TouchableOpacity>
);
AppbarAction.displayName = 'Appbar.Action';
Appbar.Action = AppbarAction;

const AppbarBackAction: React.FC<any> = props => (
  <TouchableOpacity testID={props.testID} onPress={props.onPress}>
    <RNText>Back</RNText>
  </TouchableOpacity>
);
AppbarBackAction.displayName = 'Appbar.BackAction';
Appbar.BackAction = AppbarBackAction;
