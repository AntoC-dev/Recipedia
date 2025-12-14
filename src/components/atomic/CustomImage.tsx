/**
 * CustomImage - Themed image component with enhanced loading handling
 *
 * A wrapper around Expo Image that provides consistent theming, loading states,
 * and error handling. Features automatic background color from the current theme
 * and flexible content fitting options for different image display needs.
 *
 * Key Features:
 * - Theme-integrated background color during loading
 * - Flexible content fitting options (cover, contain, fill, etc.)
 * - Load success and error callbacks for state management
 * - Consistent styling and behavior across the app
 * - Built on Expo Image for better performance and caching
 *
 * @example
 * ```typescript
 * // Basic usage
 * <CustomImage
 *   uri="path/to/image.jpg"
 *   testID="recipe-image"
 * />
 *
 * // With custom content fit and callbacks
 * <CustomImage
 *   uri={imageUri}
 *   contentFit="contain"
 *   onLoadSuccess={() => setImageLoaded(true)}
 *   onLoadError={() => setImageError(true)}
 *   testID="profile-image"
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Icon, useTheme } from 'react-native-paper';
import { Icons } from '@assets/Icons';

/**
 * Props for the CustomImage component
 */
export type CustomImageProps = {
  /** URI or path to the image to display */
  uri?: string;
  /** How the image should be resized to fit its container (default: 'cover') */
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Custom background color (defaults to theme.colors.tertiary) */
  backgroundColor?: string;
  /** Size for width and height (if provided, overrides flex: 1) */
  size?: number;
  /** Whether to make the image circular (applies size/2 as border radius) */
  circular?: boolean;
  /** Custom border radius (overrides circular if provided) */
  borderRadius?: number;
  /** Callback fired when image loads successfully */
  onLoadSuccess?: () => void;
  /** Callback fired when image fails to load */
  onLoadError?: () => void;
  /** Unique identifier for testing and accessibility */
  testID: string;
};

/**
 * CustomImage component with theme integration
 *
 * @param props - The component props
 * @returns JSX element representing a themed image with loading handling
 */
export function CustomImage({
  uri,
  contentFit = 'cover',
  backgroundColor,
  size,
  circular,
  borderRadius: customBorderRadius,
  onLoadSuccess,
  onLoadError,
  testID,
}: CustomImageProps) {
  const { colors } = useTheme();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  const dimensions: StyleProp<ViewStyle> = size ? { width: size, height: size } : { flex: 1 };
  const borderRadius = customBorderRadius ?? (circular && size ? size / 2 : 0);
  const showPlaceholder = !uri || hasError;

  const handleError = () => {
    setHasError(true);
    onLoadError?.();
  };

  return (
    <View
      style={[
        dimensions,
        {
          backgroundColor: backgroundColor || colors.surfaceVariant,
          borderRadius,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        },
      ]}
      testID={testID}
    >
      {showPlaceholder && (
        <Icon
          source={Icons.imageOff}
          size={size ? size * 0.4 : 24}
          color={colors.onSurfaceVariant}
          testID={testID + '::Placeholder'}
        />
      )}
      <Image
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: backgroundColor || colors.tertiary,
          position: showPlaceholder ? 'absolute' : 'relative',
          opacity: showPlaceholder ? 0 : 1,
        }}
        testID={testID + '::Image'}
        source={uri}
        contentFit={contentFit}
        onError={handleError}
        onLoad={onLoadSuccess}
      />
    </View>
  );
}

export default CustomImage;
