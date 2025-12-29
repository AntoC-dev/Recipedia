/**
 * AdConfig - AdMob configuration and consent management
 *
 * This module provides centralized management of AdMob ad unit IDs with
 * automatic switching between test and production ads, plus GDPR consent
 * handling using Google's User Messaging Platform (UMP).
 *
 * Test ads are used in:
 * - Development builds (__DEV__ = true)
 * - Maestro E2E tests (EXPO_PUBLIC_DATASET_TYPE = 'test')
 * - Performance tests (EXPO_PUBLIC_DATASET_TYPE = 'performance')
 *
 * Production ads are used in:
 * - Production builds with EXPO_PUBLIC_DATASET_TYPE = 'production'
 */

import { Platform } from 'react-native';
import { AdsConsent, AdsConsentStatus, TestIds } from 'react-native-google-mobile-ads';
import { getDatasetType } from './DatasetLoader';
import { adLogger } from './logger';

export type AdPlacement = 'home' | 'menu' | 'shopping';

const productionAdUnits: Record<AdPlacement, { android: string; ios: string }> = {
  home: {
    android: process.env.EXPO_PUBLIC_ADMOB_BANNER_HOME_ANDROID ?? '',
    ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_HOME_IOS ?? '',
  },
  menu: {
    android: process.env.EXPO_PUBLIC_ADMOB_BANNER_MENU_ANDROID ?? '',
    ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_MENU_IOS ?? '',
  },
  shopping: {
    android: process.env.EXPO_PUBLIC_ADMOB_BANNER_SHOPPING_ANDROID ?? '',
    ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_SHOPPING_IOS ?? '',
  },
};

/**
 * Gets the appropriate ad unit ID for a given placement
 *
 * @param placement - The screen placement for the ad
 * @returns The ad unit ID (test or production based on environment)
 */
export function getAdUnitId(placement: AdPlacement): string {
  if (__DEV__ || getDatasetType() !== 'production') {
    return TestIds.ADAPTIVE_BANNER;
  }

  const platformKey = Platform.OS === 'ios' ? 'ios' : 'android';
  return productionAdUnits[placement][platformKey];
}

/**
 * Checks if ads are enabled in the current environment
 *
 * Ads are disabled during unit tests to avoid rendering issues.
 *
 * @returns true if ads should be shown, false otherwise
 */
export function isAdsEnabled(): boolean {
  return process.env.NODE_ENV !== 'test';
}

/**
 * Initializes the GDPR consent flow
 *
 * This function should be called during app initialization.
 * It checks if consent is required and shows the consent form if needed.
 * Consent is skipped in test/development builds to avoid blocking E2E tests.
 *
 * @returns Promise<boolean> - true if ads can be shown (consent obtained or not required)
 */
export async function initializeAdConsent(): Promise<boolean> {
  if (__DEV__ || getDatasetType() !== 'production') {
    adLogger.debug('Skipping consent in non-production build');
    return true;
  }

  try {
    const consentInfo = await AdsConsent.requestInfoUpdate();

    adLogger.debug('Consent info updated', {
      status: consentInfo.status,
      isConsentFormAvailable: consentInfo.isConsentFormAvailable,
    });

    if (consentInfo.isConsentFormAvailable && consentInfo.status === AdsConsentStatus.REQUIRED) {
      const result = await AdsConsent.showForm();
      adLogger.info('Consent form result', { status: result.status });
      return result.status === AdsConsentStatus.OBTAINED;
    }

    return (
      consentInfo.status === AdsConsentStatus.OBTAINED ||
      consentInfo.status === AdsConsentStatus.NOT_REQUIRED
    );
  } catch (error) {
    adLogger.error('Failed to initialize consent', { error });
    return false;
  }
}

/**
 * Checks if personalized ads can be shown based on consent status
 *
 * @returns Promise<boolean> - true if personalized ads are allowed
 */
export async function canShowPersonalizedAds(): Promise<boolean> {
  try {
    const { status } = await AdsConsent.getConsentInfo();
    return status === AdsConsentStatus.OBTAINED;
  } catch (error) {
    adLogger.error('Failed to check consent status', { error });
    return false;
  }
}
