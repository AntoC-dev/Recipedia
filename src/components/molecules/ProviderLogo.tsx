/**
 * ProviderLogo - Logo display component for recipe providers
 *
 * A component that displays a provider's logo image with automatic fallback
 * to an icon when the image fails to load or is unavailable. Used primarily
 * in the bulk import settings screen to visually identify recipe sources.
 *
 * Key Features:
 * - Automatic error handling with fallback icon
 * - Consistent sizing for list item integration
 * - Graceful degradation when logo URL is missing
 *
 * @example
 * ```typescript
 * // In a List.Item
 * <List.Item
 *   title="HelloFresh"
 *   left={() => <ProviderLogo logoUrl={provider.logoUrl} testID="provider-logo" />}
 * />
 *
 * // With missing URL (shows fallback icon)
 * <ProviderLogo logoUrl="" testID="fallback-logo" />
 * ```
 */

import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { Icons } from '@assets/Icons';
import { padding } from '@styles/spacing';

/** Default logo size in pixels */
const DEFAULT_LOGO_SIZE = 40;

/**
 * Props for the ProviderLogo component
 */
export type ProviderLogoProps = {
  /** URL of the provider's logo image */
  logoUrl: string;
  /** Unique identifier for testing */
  testID: string;
  /** Size of the logo in pixels (default: 40) */
  size?: number;
};

/**
 * ProviderLogo component for displaying provider logos with fallback
 *
 * Renders a provider's logo image within a container. If the image
 * fails to load or no URL is provided, displays a fallback web icon instead.
 *
 * @param props - The component props
 * @returns JSX element representing the provider logo or fallback icon
 */
export function ProviderLogo({ logoUrl, testID, size = DEFAULT_LOGO_SIZE }: ProviderLogoProps) {
  const { colors } = useTheme();
  const [hasError, setHasError] = useState(false);

  /**
   * Handles image load errors by triggering fallback display
   */
  const handleError = () => {
    setHasError(true);
  };

  const iconSize = size * 0.8;

  return (
    <View style={styles.logoContainer} testID={testID}>
      {hasError || !logoUrl ? (
        <Icon
          testID={testID + '::FallbackIcon'}
          source={Icons.webIcon}
          size={iconSize}
          color={colors.onSurface}
        />
      ) : (
        <Image
          source={{ uri: logoUrl }}
          style={{ width: size, height: size }}
          resizeMode='contain'
          onError={handleError}
          testID={testID + '::Image'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: padding.small,
  },
});

export default ProviderLogo;
