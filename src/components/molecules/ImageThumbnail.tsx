/**
 * ImageThumbnail - Square image thumbnail with an optional icon overlay
 *
 * A composable molecule that wraps CustomImage in a relative-positioned container
 * and optionally renders a proportionally-sized icon in the top-right corner.
 * Both the icon size and touch target scale with the thumbnail size.
 *
 * @example
 * ```typescript
 * // With a remove icon (interactive)
 * <ImageThumbnail
 *   uri="file:///photo.jpg"
 *   size={80}
 *   testID="screenshot::Thumbnail"
 *   icon="close"
 *   iconTestID="screenshot::RemoveButton"
 *   onIconPress={handleRemove}
 * />
 *
 * // With a badge icon (display only)
 * <ImageThumbnail
 *   uri={recipe.imageUrl}
 *   size={60}
 *   borderRadius={8}
 *   testID="recipe::Thumbnail"
 *   icon={isPreviouslySeen ? 'history' : undefined}
 *   iconTestID={testId + '::SeenIndicator'}
 * />
 * ```
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, IconButton, useTheme } from 'react-native-paper';
import { CustomImage } from '@components/atomic/CustomImage';
import { IconName } from '@assets/Icons';
import { padding } from '@styles/spacing';

const ICON_SIZE_RATIO = 0.2;

/**
 * Props for the ImageThumbnail component
 */
export type ImageThumbnailProps = {
  /** URI or path to the image to display */
  uri?: string;
  /** Width and height of the thumbnail in pixels */
  size: number;
  /** Border radius for rounded corners */
  borderRadius?: number;
  /** Unique identifier for testing, forwarded to CustomImage */
  testID: string;
  /** Material icon name rendered in the top-right corner */
  icon?: IconName;
  /** Callback invoked when the icon is pressed; omit for display-only icons */
  onIconPress?: () => void;
};

/**
 * ImageThumbnail component — fixed-size image with optional top-right icon
 *
 * @param props - The component props
 * @returns JSX element representing a square image thumbnail with an optional icon
 */
export function ImageThumbnail({
  uri,
  size,
  borderRadius = 0,
  testID,
  icon,
  onIconPress,
}: ImageThumbnailProps) {
  const { colors } = useTheme();
  const iconSize = Math.round(size * ICON_SIZE_RATIO);

  const testId = testID + '::Thumbnail';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <CustomImage uri={uri} size={size} borderRadius={borderRadius} testID={testID} />
      {icon ? (
        <View
          style={[styles.iconOverlay, { backgroundColor: colors.surfaceVariant }]}
          accessible={true}
        >
          {onIconPress ? (
            <IconButton
              testID={testId + '::IconButton'}
              icon={icon}
              size={iconSize}
              style={{
                width: iconSize,
                height: iconSize,
                margin: padding.verySmall,
              }}
              mode={'contained'}
              onPress={onIconPress}
            />
          ) : (
            <Icon
              testID={testId + '::Icon'}
              source={icon}
              size={iconSize}
              color={colors.onSurfaceVariant}
            />
          )}
        </View>
      ) : undefined}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconOverlay: {
    position: 'absolute',
    top: padding.verySmall,
    right: padding.verySmall,
    borderRadius: 999,
    padding: padding.verySmall,
  },
});

export default ImageThumbnail;
