import React from 'react';
import { Text, View } from 'react-native';

export const TestIds = {
  ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/9214589741',
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
};

export const BannerAdSize = {
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  BANNER: 'BANNER',
  FULL_BANNER: 'FULL_BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  SMART_BANNER: 'SMART_BANNER',
};

export function BannerAd({
  unitId,
  size,
  onAdLoaded,
  onAdFailedToLoad,
}: {
  unitId: string;
  size: string;
  requestOptions?: { requestNonPersonalizedAdsOnly: boolean };
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: { message: string }) => void;
}) {
  React.useEffect(() => {
    onAdLoaded?.();
  }, [onAdLoaded]);

  return (
    <View testID='BannerAd'>
      <Text testID='BannerAd::UnitId'>{unitId}</Text>
      <Text testID='BannerAd::Size'>{size}</Text>
    </View>
  );
}

export const AdsConsentStatus = {
  UNKNOWN: 'UNKNOWN',
  REQUIRED: 'REQUIRED',
  NOT_REQUIRED: 'NOT_REQUIRED',
  OBTAINED: 'OBTAINED',
};

export const AdsConsent = {
  requestInfoUpdate: jest.fn().mockResolvedValue({
    status: AdsConsentStatus.NOT_REQUIRED,
    isConsentFormAvailable: false,
  }),
  showForm: jest.fn().mockResolvedValue({
    status: AdsConsentStatus.OBTAINED,
  }),
  getConsentInfo: jest.fn().mockResolvedValue({
    status: AdsConsentStatus.OBTAINED,
  }),
};

const mobileAds = jest.fn(() => ({
  initialize: jest.fn().mockResolvedValue(undefined),
}));

export default mobileAds;
