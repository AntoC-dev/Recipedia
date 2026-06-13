/**
 * Persistent app settings backed by AsyncStorage.
 *
 * Provides typed getters and setters for dark mode, default persons count,
 * season filter, and language. On first use, each setting falls back to a
 * device-derived or hardcoded default. `initSettings` should be called once
 * during app startup to apply persisted values (e.g. the active language) to
 * the running i18n instance.
 *
 * @module settings
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { Appearance } from 'react-native';
import i18n from './i18n';
import { settingsLogger } from '@utils/logger';

/**
 * AsyncStorage keys used to persist each user setting.
 */
export const SETTINGS_KEYS = {
  DARK_MODE: 'settings_dark_mode',
  DEFAULT_PERSONS: 'settings_default_persons',
  SEASON_FILTER: 'settings_season_filter',
  LANGUAGE: 'settings_language',
};

/**
 * Fallback values applied when a setting has not yet been written to storage.
 * An empty string for `language` means the device locale will be used.
 */
export const DEFAULT_SETTINGS = {
  darkMode: false,
  defaultPersons: 4,
  seasonFilter: true,
  language: '',
};

/**
 * Reads the dark mode preference from storage.
 *
 * On first launch (before the setting is written) falls back to the OS colour
 * scheme reported by `Appearance`. On storage error, also falls back to the OS
 * colour scheme.
 *
 * @returns `true` when dark mode should be enabled, `false` otherwise.
 */
export const getDarkMode = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(SETTINGS_KEYS.DARK_MODE);
    if (value !== null) {
      return value === 'true';
    }
    return Appearance.getColorScheme() === 'dark';
  } catch (error) {
    settingsLogger.error('Failed to get dark mode setting', { error });
    return Appearance.getColorScheme() === 'dark';
  }
};

/**
 * Persists the dark mode preference.
 *
 * @param value - `true` to enable dark mode, `false` to disable.
 */
export const setDarkMode = async (value: boolean): Promise<void> => {
  try {
    settingsLogger.info('Set dark mode to ', value);
    await AsyncStorage.setItem(SETTINGS_KEYS.DARK_MODE, value.toString());
  } catch (error) {
    settingsLogger.error('Failed to save dark mode setting', { value, error });
  }
};

/**
 * Reads the default serving-persons preference from storage.
 *
 * Falls back to {@link DEFAULT_SETTINGS}.`defaultPersons` when the value has
 * not been set or storage fails.
 *
 * @returns The saved default number of persons, or `4` as the fallback.
 */
export const getDefaultPersons = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(SETTINGS_KEYS.DEFAULT_PERSONS);
    return value !== null ? parseInt(value, 10) : DEFAULT_SETTINGS.defaultPersons;
  } catch (error) {
    settingsLogger.error('Failed to get default persons setting', { error });
    return DEFAULT_SETTINGS.defaultPersons;
  }
};

/**
 * Persists the default serving-persons preference.
 *
 * @param value - The number of persons to use as default for recipe scaling.
 */
export const setDefaultPersons = async (value: number): Promise<void> => {
  try {
    settingsLogger.info('Set default persons to ', value);
    await AsyncStorage.setItem(SETTINGS_KEYS.DEFAULT_PERSONS, value.toString());
  } catch (error) {
    settingsLogger.error('Failed to save default persons setting', { value, error });
  }
};

/**
 * Reads the season filter preference from storage.
 *
 * Returns `false` when the value has never been written; falls back to
 * {@link DEFAULT_SETTINGS}.`seasonFilter` on storage error.
 *
 * @returns `true` when the season filter is enabled.
 */
export const getSeasonFilter = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(SETTINGS_KEYS.SEASON_FILTER);
    return value === 'true';
  } catch (error) {
    settingsLogger.error('Failed to get season filter setting', { error });
    return DEFAULT_SETTINGS.seasonFilter;
  }
};

/**
 * Persists the season filter preference.
 *
 * @param value - `true` to restrict recipe results to seasonal ingredients.
 */
export const setSeasonFilter = async (value: boolean): Promise<void> => {
  try {
    settingsLogger.info('Set season filter to ', value);
    await AsyncStorage.setItem(SETTINGS_KEYS.SEASON_FILTER, value.toString());
  } catch (error) {
    settingsLogger.error('Failed to save season filter setting', { enabled: value, error });
  }
};

/**
 * Flips the season filter preference and persists the new value.
 *
 * @returns The new season filter state after toggling.
 */
export const toggleSeasonFilter = async (): Promise<boolean> => {
  const currentValue = await getSeasonFilter();
  const newValue = !currentValue;
  await setSeasonFilter(newValue);
  return newValue;
};

/**
 * Reads the language preference from storage.
 *
 * Falls back to the device locale (`expo-localization`) when no value has been
 * saved, and to `'en'` if the device locale cannot be determined.
 *
 * @returns A BCP 47 language code (e.g. `'en'`, `'fr'`).
 */
export const getLanguage = async (): Promise<string> => {
  try {
    const value = await AsyncStorage.getItem(SETTINGS_KEYS.LANGUAGE);
    if (value && value.length > 0) {
      return value;
    }
  } catch (error) {
    settingsLogger.error('Failed to get language setting', { error });
  }
  return Localization.getLocales()[0].languageCode ?? 'en';
};

/**
 * Persists the language preference and applies it to the running i18n instance.
 *
 * @param value - A BCP 47 language code (e.g. `'en'`, `'fr'`).
 */
export const setLanguage = async (value: string): Promise<void> => {
  try {
    settingsLogger.info('Set language to ', value);
    await AsyncStorage.setItem(SETTINGS_KEYS.LANGUAGE, value);
    // Also update i18n instance
    await i18n.changeLanguage(value);
  } catch (error) {
    settingsLogger.error('Failed to save language setting', { languageCode: value, error });
  }
};

/**
 * Applies persisted settings to the running app.
 *
 * Reads the saved language from storage and calls `i18n.changeLanguage` so
 * the correct translation bundle is active before any component renders. Should
 * be awaited during app startup before the root navigator mounts.
 */
export const initSettings = async (): Promise<void> => {
  settingsLogger.debug('Initializing app settings');
  // Load language setting and apply it
  const language = await getLanguage();
  if (language) {
    settingsLogger.debug('Setting language', { language });
    await i18n.changeLanguage(language);
  }
  settingsLogger.debug('Settings initialization completed');
};
