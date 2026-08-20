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
    <RNText testID={props.testID + '::Children'}>{props.children}</RNText>
  </TouchableOpacity>
);

export const RadioButton: React.FC<any> & {
  Group: React.FC<any>;
  Item: React.FC<any>;
} = props => (
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

const RadioButtonItem: React.FC<any> = props => (
  <TouchableOpacity testID={props.testID} onPress={props.onPress}>
    <RNText>{props.label}</RNText>
  </TouchableOpacity>
);
RadioButtonItem.displayName = 'RadioButton.Item';
RadioButton.Item = RadioButtonItem;

export const Dialog: React.FC<any> & {
  Title: React.FC<any>;
  Content: React.FC<any>;
  ScrollArea: React.FC<any>;
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

const DialogScrollArea: React.FC<any> = props => (
  <View testID={props.testID}>{props.children}</View>
);
DialogScrollArea.displayName = 'Dialog.ScrollArea';
Dialog.ScrollArea = DialogScrollArea;

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
    {props.anchor}
    {props.visible && props.children}
  </View>
);

const MenuItem: React.FC<any> = props => (
  <TouchableOpacity testID={props.testID} onPress={props.onPress}>
    <RNText>{props.title || props.children}</RNText>
  </TouchableOpacity>
);
MenuItem.displayName = 'Menu.Item';
Menu.Item = MenuItem;

const BottomNavigationBar: React.FC<any> = props => (
  <View testID='BottomNavigation.Bar' style={props.style}>
    <RNText testID='BottomNavigation.Bar::SafeAreaInsets'>
      {JSON.stringify(props.safeAreaInsets)}
    </RNText>
    {props.navigationState.routes.map((route: any, index: number) => (
      <TouchableOpacity
        key={route.key}
        testID={props.getTestID({ route })}
        accessibilityLabel={props.getAccessibilityLabel({ route })}
        onPress={() => props.onTabPress({ route, preventDefault: () => {} })}
      >
        <RNText>{props.getLabelText({ route })}</RNText>
        {props.renderIcon({
          route,
          focused: index === props.navigationState.index,
          color: index === props.navigationState.index ? props.activeColor : props.inactiveColor,
        })}
      </TouchableOpacity>
    ))}
  </View>
);
BottomNavigationBar.displayName = 'BottomNavigation.Bar';

export const BottomNavigation: { Bar: React.FC<any> } = { Bar: BottomNavigationBar };

export const Portal: React.FC<any> & { Host: React.FC<any> } = props => (
  <View testID={props.testID}>{props.children}</View>
);
const PortalHost: React.FC<any> = props => <View>{props.children}</View>;
PortalHost.displayName = 'Portal.Host';
Portal.Host = PortalHost;

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
    accessible={props.accessible}
    accessibilityRole={props.accessibilityRole}
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
    scrollEnabled: props.scrollEnabled,
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
    <RNText testID={props.testID + '::Color'}>{props.color}</RNText>
  </TouchableOpacity>
);
TextInputIcon.displayName = 'TextInput.Icon';
(TextInputComponent as any).Icon = TextInputIcon;

export const TextInput = TextInputComponent;

export const Chip: React.FC<any> = props => (
  <TouchableOpacity testID={props.testID} onPress={props.onPress} style={props.style}>
    <RNText testID={props.testID + '::Selected'}>{String(props.selected)}</RNText>
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
    accessible={props.accessible}
    accessibilityRole={props.accessibilityRole}
    accessibilityLabel={props.accessibilityLabel}
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

export const Badge: React.FC<any> = props => (
  <View testID={props.testID} style={props.style}>
    <RNText>{props.children}</RNText>
  </View>
);

export const Icon: React.FC<any> = props => (
  <View testID={props.testID} {...{ size: props.size, color: props.color }}>
    <RNText testID={props.testID + '::Source'}>{props.source}</RNText>
  </View>
);

export const IconButton: React.FC<any> = props => (
  <TouchableOpacity
    testID={props.testID}
    onPress={props.onPress}
    style={props.style}
    {...{ iconColor: props.iconColor }}
  >
    <RNText testID={props.testID + '::Icon'}>{props.icon}</RNText>
    <RNText testID={props.testID + '::Color'}>{props.iconColor}</RNText>
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
      onBlur={props.onBlur}
      onSubmitEditing={props.onSubmitEditing}
      returnKeyType={props.returnKeyType}
    />
    <RNText testID={props.testID + '::Placeholder'}>{props.placeholder}</RNText>
    <RNText testID={props.testID + '::HasRight'}>{String(props.right !== undefined)}</RNText>
    <RNText testID={props.testID + '::ClearIcon'}>{props.clearIcon}</RNText>
    <TouchableOpacity
      testID={props.testID + '-clear-icon'}
      onPress={() => {
        props.onChangeText?.('');
        props.onClearIconPress?.();
      }}
      disabled={!props.value}
    >
      <RNText>{props.clearAccessibilityLabel}</RNText>
    </TouchableOpacity>
    <View testID={props.testID + '::RightContainer'}>
      {props.right && props.right({ testID: props.testID + '::Right' })}
    </View>
  </View>
);

const md3TypescaleDefaults: Record<string, { fontFamily: string; fontWeight: string }> = {
  displayLarge: { fontFamily: 'System', fontWeight: '400' },
  displayMedium: { fontFamily: 'System', fontWeight: '400' },
  displaySmall: { fontFamily: 'System', fontWeight: '400' },
  headlineLarge: { fontFamily: 'System', fontWeight: '400' },
  headlineMedium: { fontFamily: 'System', fontWeight: '400' },
  headlineSmall: { fontFamily: 'System', fontWeight: '400' },
  titleLarge: { fontFamily: 'System', fontWeight: '400' },
  titleMedium: { fontFamily: 'System', fontWeight: '500' },
  titleSmall: { fontFamily: 'System', fontWeight: '500' },
  bodyLarge: { fontFamily: 'System', fontWeight: '400' },
  bodyMedium: { fontFamily: 'System', fontWeight: '400' },
  bodySmall: { fontFamily: 'System', fontWeight: '400' },
  labelLarge: { fontFamily: 'System', fontWeight: '500' },
  labelMedium: { fontFamily: 'System', fontWeight: '500' },
  labelSmall: { fontFamily: 'System', fontWeight: '500' },
};

export const configureFonts = jest.fn((config?: any) => {
  const overrideConfig = config?.config;
  if (!overrideConfig) {
    return md3TypescaleDefaults;
  }

  return Object.fromEntries(
    Object.entries(md3TypescaleDefaults).map(([variant, defaults]) => [
      variant,
      { ...defaults, ...overrideConfig },
    ])
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
    elevation: {
      level0: 'transparent',
      level1: '#f7f2fa',
      level2: '#f3edf7',
      level3: '#ece6f0',
      level4: '#e8e0eb',
      level5: '#e6dde9',
    },
  },
  fonts: {
    bodySmall: { fontSize: 12 },
    bodyMedium: { fontSize: 14 },
    bodyLarge: { fontSize: 16 },
    headlineSmall: { fontSize: 18 },
    headlineMedium: { fontSize: 20 },
    headlineLarge: { fontSize: 24 },
    titleSmall: { fontSize: 16 },
    titleMedium: { fontSize: 16, lineHeight: 24 },
    titleLarge: { fontSize: 20 },
    labelSmall: { fontSize: 10 },
    labelMedium: { fontSize: 12 },
    labelLarge: { fontSize: 14, lineHeight: 20 },
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
  Subheader: (props: any) => (
    <RNText
      testID={props.testID}
      style={props.style}
      numberOfLines={props.numberOfLines}
      accessibilityRole={props.accessibilityRole}
    >
      {props.children}
    </RNText>
  ),
  Item: (props: any) => (
    <TouchableOpacity
      testID={props.testID}
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      style={props.style}
      accessibilityRole={props.accessibilityRole}
      accessibilityState={props.accessibilityState}
    >
      {props.left && (
        <View testID={props.testID + '::Left'}>
          {typeof props.left === 'function' ? props.left() : props.left}
        </View>
      )}
      <View testID={props.testID + '::Content'}>
        <RNText
          testID={props.testID + '::Title'}
          numberOfLines={props.titleNumberOfLines}
          style={props.titleStyle}
        >
          {props.title}
        </RNText>
        {props.description && (
          <RNText testID={props.testID + '::Description'} style={props.descriptionStyle}>
            {props.description}
          </RNText>
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
      <TouchableOpacity testID={props.testID + '::Header'} onPress={props.onPress ?? (() => {})}>
        <RNText testID={props.testID + '::Title'} style={props.titleStyle}>
          {props.title}
        </RNText>
        <RNText testID={props.testID + '::Description'}>{props.description}</RNText>
        <RNText testID={props.testID + '::Expanded'}>{String(props.expanded)}</RNText>
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
  if (props.visible === false) {
    return null;
  }
  return (
    <RNText testID={props.testID} {...{ type: props.type, visible: props.visible }}>
      {props.children}
    </RNText>
  );
};

export const Tooltip: React.FC<any> = props => (
  <View testID={props.testID} {...{ title: props.title, enterTouchDelay: props.enterTouchDelay }}>
    {props.children}
  </View>
);
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
    <View testID='FAB.Group' style={props.style}>
      {renderActions()}
      <TouchableOpacity
        testID={props.testID}
        style={props.fabStyle}
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

export const Surface: React.FC<any> = props => (
  <View testID={props.testID} style={props.style}>
    {props.children}
  </View>
);

export const Snackbar: React.FC<any> & {
  DURATION_SHORT: number;
  DURATION_MEDIUM: number;
  DURATION_LONG: number;
} = Object.assign(
  (props: any) => {
    if (!props.visible) return null;
    return (
      <View testID={props.testID}>
        <RNText testID={props.testID + '::Text'}>{props.children}</RNText>
        <RNText testID={props.testID + '::Duration'}>{props.duration}</RNText>
        {props.onDismiss && (
          <Button testID={props.testID + '::Dismiss'} onPress={props.onDismiss}>
            Dismiss
          </Button>
        )}
        {props.action && (
          <Button testID={props.testID + '::Action'} onPress={props.action.onPress}>
            {props.action.label}
          </Button>
        )}
      </View>
    );
  },
  { DURATION_SHORT: 4000, DURATION_MEDIUM: 7000, DURATION_LONG: 10000 }
);

export const PaperProvider: React.FC<any> = props => <>{props.children}</>;
