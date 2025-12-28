/**
 * AdBanner - Adaptive banner advertisement component
 *
 * A reusable AdMob banner component that displays adaptive banner ads
 * with proper theming integration and error handling. Automatically
 * adjusts to screen width and respects user consent preferences.
 *
 * Key Features:
 * - Adaptive banner sizing for optimal display
 * - Theme-aware container styling
 * - Error handling with graceful degradation
 * - Test ad support in development mode
 * - GDPR consent integration ready
 *
 * @example
 * ```typescript
 * <AdBanner placement="home" testId="HomeScreen::AdBanner" />
 * ```
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AdPlacement, getAdUnitId, isAdsEnabled } from '@utils/AdConfig';
import { adLogger } from '@utils/logger';
import { padding } from '@styles/spacing';

export type AdBannerProps = {
  placement: AdPlacement;
  testId: string;
};

/**
 * Displays an adaptive banner advertisement
 *
 * @param props - Component props
 * @param props.placement - Screen placement identifier for ad targeting
 * @param props.testId - Test ID prefix for automated testing
 */
export function AdBanner({ placement, testId }: AdBannerProps) {
  const { colors } = useTheme();
  const [hasError, setHasError] = useState(false);

  if (!isAdsEnabled() || hasError) {
    return null;
  }

  const adUnitId = getAdUnitId(placement);

  return (
    <View
      testID={`${testId}::AdBanner`}
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          adLogger.debug('Ad loaded successfully', { placement });
        }}
        onAdFailedToLoad={error => {
          adLogger.warn('Ad failed to load', { placement, error: error.message });
          setHasError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: padding.small,
  },
});

export default AdBanner;
