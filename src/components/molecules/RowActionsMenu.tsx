/**
 * RowActionsMenu - Overflow (⋮) menu offering move up / move down / delete actions for a list row
 *
 * Edge rules:
 * - A move item is disabled when its handler is omitted (first / last row).
 * - Both move items are hidden when both move handlers are omitted (single row).
 * - Pressing an item closes the menu before running its action.
 *
 * @example
 * ```typescript
 * <RowActionsMenu
 *   testID='RecipeIngredients::0'
 *   onMoveUp={index > 0 ? moveUp : undefined}
 *   onMoveDown={index < last ? moveDown : undefined}
 *   onDelete={remove}
 * />
 * ```
 */

import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { IconButton, Menu, useTheme } from 'react-native-paper';
import { Icons, iconsSize } from '@assets/Icons';
import { useI18n } from '@utils/i18n';

/**
 * Props for the RowActionsMenu component
 */
export type RowActionsMenuProps = {
  /**
   * Row prefix; renders `::ActionsButton`, `::ActionsMenu`, `::MoveUpItem`, `::MoveDownItem`
   * and `::DeleteItem`
   */
  testID: string;
  /** Moves the row one position up; omitted disables the item */
  onMoveUp?: () => void;
  /** Moves the row one position down; omitted disables the item */
  onMoveDown?: () => void;
  /** Deletes the row */
  onDelete: () => void;
};

/**
 * Renders a ⋮ icon button anchoring a menu of row actions
 *
 * @param props - The component props
 * @returns JSX element of the anchor button and its menu
 */
export function RowActionsMenu({ testID, onMoveUp, onMoveDown, onDelete }: RowActionsMenuProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);
  const canMove = onMoveUp !== undefined || onMoveDown !== undefined;

  const closeThen = (action?: () => void) => () => {
    setIsVisible(false);
    action?.();
  };

  return (
    <Menu
      testID={`${testID}::ActionsMenu`}
      visible={isVisible}
      anchorPosition='bottom'
      onDismiss={() => setIsVisible(false)}
      anchor={
        <IconButton
          testID={`${testID}::ActionsButton`}
          icon={Icons.dotsVertical}
          iconColor={colors.onSurfaceVariant}
          onPress={() => setIsVisible(true)}
          size={iconsSize.medium}
          style={styles.anchor}
        />
      }
    >
      {canMove ? (
        <>
          <Menu.Item
            testID={`${testID}::MoveUpItem`}
            leadingIcon={Icons.arrowUp}
            title={t('moveUp')}
            disabled={!onMoveUp}
            onPress={closeThen(onMoveUp)}
          />
          <Menu.Item
            testID={`${testID}::MoveDownItem`}
            leadingIcon={Icons.arrowDown}
            title={t('moveDown')}
            disabled={!onMoveDown}
            onPress={closeThen(onMoveDown)}
          />
        </>
      ) : null}
      <Menu.Item
        testID={`${testID}::DeleteItem`}
        leadingIcon={Icons.trashIcon}
        title={t('delete')}
        theme={{ colors: { onSurface: colors.error, onSurfaceVariant: colors.error } }}
        onPress={closeThen(onDelete)}
      />
    </Menu>
  );
}

const styles = StyleSheet.create({
  anchor: { margin: 0 },
});
