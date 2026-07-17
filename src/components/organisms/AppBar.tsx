import React from 'react';
import { Appbar, useTheme } from 'react-native-paper';
import { Icons } from '@assets/Icons';

export type AppBarProps = {
  onGoBack: () => void;
  title?: string;
  testID: string;
  isEditing?: boolean;
  onCancel?: () => void;
  onValidate?: () => Promise<void>;
  onDelete?: () => void;
  onEdit?: () => void;
};

export function AppBar({
  onGoBack,
  title,
  testID,
  isEditing,
  onCancel,
  onValidate,
  onDelete,
  onEdit,
}: AppBarProps) {
  const { colors } = useTheme();

  const testId = testID + '::AppBar';
  return (
    <Appbar.Header
      testID={testId}
      style={{ backgroundColor: colors.primaryContainer }}
      statusBarHeight={0}
      elevated={true}
    >
      {isEditing ? (
        <Appbar.Action
          icon={Icons.crossIcon}
          onPress={onCancel}
          testID={testId + '::Cancel'}
          color={colors.onPrimaryContainer}
        />
      ) : (
        <Appbar.BackAction
          onPress={onGoBack}
          testID={testId + '::BackButton'}
          color={colors.onPrimaryContainer}
        />
      )}
      <Appbar.Content
        title={title ?? ''}
        titleStyle={{ color: colors.onPrimaryContainer }}
        testID={testId + '::Title'}
      />
      {onDelete && (
        <Appbar.Action
          icon={Icons.trashIcon}
          onPress={onDelete}
          testID={testId + '::Delete'}
          color={colors.onPrimaryContainer}
        />
      )}
      {onEdit && (
        <Appbar.Action
          icon={Icons.pencilIcon}
          onPress={onEdit}
          testID={testId + '::Edit'}
          color={colors.onPrimaryContainer}
        />
      )}
      {isEditing && onValidate && (
        <Appbar.Action
          icon={Icons.checkIcon}
          onPress={onValidate}
          testID={testId + '::Validate'}
          color={colors.onPrimaryContainer}
        />
      )}
    </Appbar.Header>
  );
}
